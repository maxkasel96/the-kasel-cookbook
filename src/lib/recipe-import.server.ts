import {
  importedRecipeModelOutputJsonSchema,
  importedRecipeModelOutputSchema,
  recipeDraftFromModelOutput,
  type ImportedRecipeDraft,
} from "@/lib/recipe-import";

type RecipeSchemaCandidate = {
  title?: string;
  description?: string;
  servings?: string;
  prepMinutes?: string;
  cookMinutes?: string;
  ingredients: string[];
  steps: string[];
};

type ExtractedRecipePage = {
  title?: string;
  metaDescription?: string;
  recipeSchema?: RecipeSchemaCandidate;
  visibleText: string;
};

type OpenAIResponsePayload = {
  status?: string;
  output_text?: string;
  error?: {
    message?: string;
  };
  output?: Array<{
    type?: string;
    content?: Array<
      | {
          type?: "output_text";
          text?: string;
        }
      | {
          type?: "refusal";
          refusal?: string;
        }
    >;
  }>;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_IMPORT_MODEL = "gpt-4.1-mini";
const MAX_VISIBLE_TEXT_CHARS = 14000;
const FETCH_TIMEOUT_MS = 15000;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, codePoint) =>
      String.fromCodePoint(Number(codePoint))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) =>
      String.fromCodePoint(parseInt(codePoint, 16))
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const stripTags = (value: string) =>
  collapseWhitespace(
    decodeHtmlEntities(
      value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
    )
  );

const getTagContent = (html: string, tagName: string) => {
  const match = html.match(
    new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i")
  );
  return match ? stripTags(match[1]) : undefined;
};

const getMetaContent = (html: string, name: string) => {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1]).trim();
    }
  }

  return undefined;
};

const flattenJsonLdNodes = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLdNodes);
  }

  if (!isObject(value)) {
    return [];
  }

  const graphNodes = Array.isArray(value["@graph"])
    ? value["@graph"].flatMap(flattenJsonLdNodes)
    : [];

  return [value, ...graphNodes];
};

const hasRecipeType = (value: unknown) => {
  if (typeof value === "string") {
    return value.toLowerCase() === "recipe";
  }

  if (Array.isArray(value)) {
    return value.some(hasRecipeType);
  }

  return false;
};

const parseIso8601Minutes = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const match = value.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/i
  );
  if (!match) {
    return collapseWhitespace(value);
  }

  const [, days, hours, minutes] = match;
  const totalMinutes =
    Number(days ?? 0) * 24 * 60 +
    Number(hours ?? 0) * 60 +
    Number(minutes ?? 0);

  return totalMinutes > 0 ? String(totalMinutes) : undefined;
};

const extractInstructionSteps = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [collapseWhitespace(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap(extractInstructionSteps);
  }

  if (!isObject(value)) {
    return [];
  }

  const directText =
    typeof value.text === "string"
      ? collapseWhitespace(value.text)
      : typeof value.name === "string"
        ? collapseWhitespace(value.name)
        : undefined;

  const nestedItems = Array.isArray(value.itemListElement)
    ? value.itemListElement.flatMap(extractInstructionSteps)
    : [];

  return [directText, ...nestedItems].filter(
    (step): step is string => Boolean(step)
  );
};

const extractRecipeSchemaCandidate = (html: string) => {
  const scriptMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of scriptMatches) {
    const rawJson = match[1]?.trim();
    if (!rawJson) continue;

    try {
      const parsed = JSON.parse(decodeHtmlEntities(rawJson));
      const nodes = flattenJsonLdNodes(parsed);
      const recipeNode = nodes.find((node) => hasRecipeType(node["@type"]));

      if (!recipeNode) continue;

      const ingredients = Array.isArray(recipeNode.recipeIngredient)
        ? recipeNode.recipeIngredient
            .filter((value): value is string => typeof value === "string")
            .map((value) => collapseWhitespace(value))
            .filter(Boolean)
        : [];

      const steps = extractInstructionSteps(recipeNode.recipeInstructions);

      return {
        title:
          typeof recipeNode.name === "string"
            ? collapseWhitespace(recipeNode.name)
            : undefined,
        description:
          typeof recipeNode.description === "string"
            ? collapseWhitespace(recipeNode.description)
            : undefined,
        servings:
          typeof recipeNode.recipeYield === "string"
            ? collapseWhitespace(recipeNode.recipeYield)
            : Array.isArray(recipeNode.recipeYield)
              ? recipeNode.recipeYield
                  .filter((value): value is string => typeof value === "string")
                  .map(collapseWhitespace)
                  .find(Boolean)
              : undefined,
        prepMinutes: parseIso8601Minutes(recipeNode.prepTime),
        cookMinutes: parseIso8601Minutes(recipeNode.cookTime),
        ingredients,
        steps,
      } satisfies RecipeSchemaCandidate;
    } catch {
      continue;
    }
  }

  return undefined;
};

const extractVisibleText = (html: string) => {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(li|p|div|section|article|h1|h2|h3|h4|h5|h6|br)[^>]*>/gi, "\n")
    .replace(/<\/(li|p|div|section|article|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const lines = decodeHtmlEntities(cleaned)
    .split("\n")
    .map((line) => collapseWhitespace(line))
    .filter((line) => line.length >= 2)
    .slice(0, 250);

  return lines.join("\n").slice(0, MAX_VISIBLE_TEXT_CHARS);
};

async function fetchRecipePage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KaselCookbookRecipeImporter/1.0; +https://localhost:3000)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unable to load that page right now (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("xml")) {
    throw new Error("That URL did not return an HTML recipe page.");
  }

  return response.text();
}

function extractRecipePage(html: string): ExtractedRecipePage {
  const title = getTagContent(html, "title") ?? getMetaContent(html, "og:title");
  const metaDescription =
    getMetaContent(html, "description") ?? getMetaContent(html, "og:description");
  const recipeSchema = extractRecipeSchemaCandidate(html);
  const visibleText = extractVisibleText(html);

  return {
    title,
    metaDescription,
    recipeSchema,
    visibleText,
  };
}

function buildRecipeImportPrompt(url: string, extractedPage: ExtractedRecipePage) {
  return [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text:
            "You extract structured recipe drafts for an admin recipe form. Return only the JSON schema requested. Do not invent missing facts. Prefer source JSON-LD recipe data when present, then use visible page text. Ingredient quantities should be decimal-friendly strings when possible, because the admin form later saves numeric quantities. Put preparation adjectives like diced, softened, or drained into note instead of text when possible.",
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: [
            `Source URL: ${url}`,
            "",
            "Normalize the recipe into this app's create-recipe form shape:",
            "- title",
            "- description",
            "- servings",
            "- prepMinutes",
            "- cookMinutes",
            "- ingredients[] with text, quantity, unit, note, optional",
            "- steps[] with text and ingredientIndexes",
            "",
            "Rules:",
            "- Use empty strings instead of null when data is missing.",
            "- Keep the ingredient text focused on the ingredient name.",
            "- Use short, imperative step strings.",
            "- Preserve optional ingredients only when the page clearly marks them optional.",
            "- For each step, return ingredientIndexes using 1-based positions from the ingredients array.",
            "- Include every ingredient that is directly used, added, mixed, cooked, or garnished in that step.",
            "- Do not assign ingredients to a step when the step is only timing, resting, or a generic finish instruction with no clear ingredient reference.",
            "- If a step says to add a previously mixed sauce, filling, or topping, include the ingredient indexes that make up that component when they are clear from the source.",
            "",
            `Page title: ${extractedPage.title ?? ""}`,
            `Meta description: ${extractedPage.metaDescription ?? ""}`,
            "",
            "Structured recipe data found on page:",
            JSON.stringify(extractedPage.recipeSchema ?? {}, null, 2),
            "",
            "Visible text excerpt from the page:",
            extractedPage.visibleText,
          ].join("\n"),
        },
      ],
    },
  ];
}

async function extractResponseText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const refusalText = (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter(
      (
        item
      ): item is {
        type?: "refusal";
        refusal?: string;
      } => item.type === "refusal"
    )
    .map((item) => item.refusal?.trim())
    .filter(Boolean)
    .join("\n");

  if (refusalText) {
    throw new Error(refusalText);
  }

  const outputText = (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter(
      (
        item
      ): item is {
        type?: "output_text";
        text?: string;
      } => item.type === "output_text"
    )
    .map((item) => item.text ?? "")
    .join("")
    .trim();

  if (!outputText) {
    throw new Error("OpenAI returned an empty recipe import response.");
  }

  return outputText;
}

async function callOpenAIForRecipeDraft(url: string, extractedPage: ExtractedRecipePage) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Recipe import is not configured yet. Set OPENAI_API_KEY on the server first."
    );
  }

  const model = process.env.OPENAI_RECIPE_IMPORT_MODEL ?? DEFAULT_IMPORT_MODEL;
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 1800,
      input: buildRecipeImportPrompt(url, extractedPage),
      text: {
        format: {
          type: "json_schema",
          name: "recipe_import_draft",
          strict: true,
          schema: importedRecipeModelOutputJsonSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  const payload = (await response.json()) as OpenAIResponsePayload;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "OpenAI recipe import failed.");
  }

  const outputText = await extractResponseText(payload);
  const parsedModelOutput = importedRecipeModelOutputSchema.parse(
    JSON.parse(outputText)
  );

  return recipeDraftFromModelOutput(url, parsedModelOutput);
}

export async function importRecipeFromUrl(url: string): Promise<ImportedRecipeDraft> {
  const html = await fetchRecipePage(url);
  const extractedPage = extractRecipePage(html);

  if (!extractedPage.visibleText && !extractedPage.recipeSchema) {
    throw new Error("Unable to extract enough recipe content from that page.");
  }

  return callOpenAIForRecipeDraft(url, extractedPage);
}
