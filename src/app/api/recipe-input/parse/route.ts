import { NextResponse } from "next/server";

import { type ImportedRecipeDraft } from "@/lib/recipe-import";

type ParseBody = {
  url?: string;
};

const demoRecipeFromUrl = (url: string): ImportedRecipeDraft => ({
  sourceUrl: url,
  title: "Imported recipe draft",
  description:
    "Framework response: connect this route to OpenAI + page scraping to generate structured recipe data.",
  servings: "4",
  prepMinutes: "15",
  cookMinutes: "25",
  ingredients: [
    { quantity: "1", unit: "lb", text: "pasta" },
    { quantity: "2", unit: "cups", text: "marinara sauce" },
    { quantity: "1/2", unit: "cup", text: "parmesan cheese", optional: true },
  ],
  steps: [
    "Scrape the recipe page and extract the visible ingredient list and instructions.",
    "Send the raw content to OpenAI with a prompt that normalizes ingredients and steps.",
    "Return structured JSON and let the user review before creating a recipe.",
  ],
});

export async function POST(request: Request) {
  const body = (await request.json()) as ParseBody;
  const rawUrl = body.url?.trim();

  if (!rawUrl) {
    return NextResponse.json({ error: "Recipe URL is required." }, { status: 400 });
  }

  try {
    const normalizedUrl = new URL(rawUrl);

    // TODO: Replace this with real implementation:
    // 1) Fetch the target recipe page HTML.
    // 2) Extract recipe text blocks from the document.
    // 3) Call OpenAI and ask for structured recipe JSON.
    // 4) Validate and return that JSON as ImportedRecipeDraft.
    const draft = demoRecipeFromUrl(normalizedUrl.toString());

    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json(
      { error: "Please enter a valid absolute URL (including https://)." },
      { status: 400 }
    );
  }
}
