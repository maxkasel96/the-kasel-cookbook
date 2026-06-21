type RecipeIngredient = {
  id: number | string
  ingredient_text?: string | null
  quantity?: number | null
  unit?: string | null
  note?: string | null
  is_optional?: boolean | null
  position?: number | null
}

type InstructionIngredientLink = {
  ingredient_id?: number | string | null
}

type InstructionStep = {
  id?: number | string | null
  content?: string | null
  position?: number | null
  recipe_instruction_step_ingredients?: InstructionIngredientLink[] | null
}

type LinkedName = {
  name?: string | null
}

type RecipeMetadataLink = {
  tags?: LinkedName | LinkedName[] | null
  categories?: LinkedName | LinkedName[] | null
}

type RecipeChatContext = {
  title?: string | null
  description?: string | null
  servings?: number | null
  prep_minutes?: number | null
  cook_minutes?: number | null
  recipe_ingredients?: RecipeIngredient[] | null
  recipe_instruction_steps?: InstructionStep[] | null
  recipe_tags?: RecipeMetadataLink[] | null
  recipe_categories?: RecipeMetadataLink[] | null
}

export type RecipeChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type OpenAIResponsePayload = {
  output_text?: string
  error?: {
    message?: string
  }
  output?: Array<{
    type?: string
    content?: Array<
      | {
          type?: 'output_text'
          text?: string
        }
      | {
          type?: 'refusal'
          refusal?: string
        }
    >
  }>
}

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_CHAT_MODEL = 'gpt-4.1-mini'
const CHAT_TIMEOUT_MS = 20000
const MAX_MESSAGE_CHARS = 1200
const MAX_HISTORY_MESSAGES = 8

const isPresentString = (value: string | null | undefined): value is string =>
  Boolean(value?.trim())

const formatQuantity = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return ''
  }

  return String(Math.round((value + Number.EPSILON) * 100) / 100).replace(
    /\.?0+$/,
    ''
  )
}

const getLinkedNames = (
  links: RecipeMetadataLink[] | null | undefined,
  key: 'tags' | 'categories'
) =>
  links
    ?.flatMap((link) => {
      const value = link?.[key]

      if (Array.isArray(value)) {
        return value.map((item) => item?.name).filter(isPresentString)
      }

      return value?.name ? [value.name] : []
    })
    .filter(isPresentString) ?? []

const formatIngredient = (ingredient: RecipeIngredient) => {
  const quantity = formatQuantity(ingredient.quantity)
  const unit = ingredient.unit?.trim()
  const text = ingredient.ingredient_text?.trim()
  const mainLabel = [quantity, unit, text].filter(Boolean).join(' ')
  const details = [
    ingredient.note?.trim(),
    ingredient.is_optional ? 'optional' : '',
  ].filter(Boolean)

  return details.length ? `${mainLabel} (${details.join(', ')})` : mainLabel
}

function buildRecipeContext(recipe: RecipeChatContext) {
  const ingredients = recipe.recipe_ingredients ?? []
  const steps = recipe.recipe_instruction_steps ?? []
  const ingredientById = new Map(
    ingredients.map((ingredient, index) => [
      String(ingredient.id),
      formatIngredient(ingredient) || `Ingredient ${index + 1}`,
    ])
  )

  const lines = [
    `Title: ${recipe.title ?? 'Untitled recipe'}`,
    recipe.description ? `Description: ${recipe.description}` : '',
    recipe.servings ? `Servings: ${recipe.servings}` : '',
    recipe.prep_minutes ? `Prep minutes: ${recipe.prep_minutes}` : '',
    recipe.cook_minutes ? `Cook minutes: ${recipe.cook_minutes}` : '',
  ].filter(Boolean)

  const categories = getLinkedNames(recipe.recipe_categories, 'categories')
  const tags = getLinkedNames(recipe.recipe_tags, 'tags')

  if (categories.length) {
    lines.push(`Categories: ${categories.join(', ')}`)
  }

  if (tags.length) {
    lines.push(`Tags: ${tags.join(', ')}`)
  }

  lines.push(
    '',
    'Ingredients:',
    ingredients.length
      ? ingredients
          .map((ingredient, index) => `${index + 1}. ${formatIngredient(ingredient)}`)
          .join('\n')
      : 'No saved ingredients.',
    '',
    'Instructions:'
  )

  if (!steps.length) {
    lines.push('No saved instruction steps.')
  } else {
    steps.forEach((step, index) => {
      const linkedIngredients = (
        step.recipe_instruction_step_ingredients ?? []
      )
        .map((link) =>
          link.ingredient_id === null || link.ingredient_id === undefined
            ? null
            : ingredientById.get(String(link.ingredient_id))
        )
        .filter(isPresentString)

      lines.push(
        `${index + 1}. ${step.content ?? ''}${
          linkedIngredients.length
            ? `\n   Uses: ${linkedIngredients.join('; ')}`
            : ''
        }`
      )
    })
  }

  return lines.join('\n')
}

function sanitizeMessages(messages: RecipeChatMessage[]) {
  return messages
    .filter(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        Boolean(message.content?.trim())
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_CHARS),
    }))
}

function buildChatInput(recipe: RecipeChatContext, messages: RecipeChatMessage[]) {
  const sanitizedMessages = sanitizeMessages(messages)

  return [
    {
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: [
            'You are a concise cooking assistant for The Kasel Cookbook.',
            'Answer only using the saved recipe context provided by the server.',
            'You may explain cooking techniques, substitutions, prep order, timing, doneness cues, and troubleshooting when they are grounded in the recipe.',
            'If the recipe does not provide enough information, say so briefly and give a cautious cooking-focused suggestion.',
            'Do not claim to update, edit, save, or modify the recipe.',
            'Do not provide medical or nutrition advice beyond general cooking context.',
            'Keep answers practical for someone actively cooking. Aim for 2-5 short sentences unless a short list is clearer.',
          ].join(' '),
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: `Saved recipe context:\n${buildRecipeContext(recipe)}`,
        },
      ],
    },
    ...sanitizedMessages.map((message) => ({
      role: message.role,
      content: [
        {
          type: message.role === 'user' ? 'input_text' : 'output_text',
          text: message.content,
        },
      ],
    })),
  ]
}

async function extractResponseText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  const refusalText = (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter(
      (
        item
      ): item is {
        type?: 'refusal'
        refusal?: string
      } => item.type === 'refusal'
    )
    .map((item) => item.refusal?.trim())
    .filter(Boolean)
    .join('\n')

  if (refusalText) {
    throw new Error(refusalText)
  }

  const outputText = (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter(
      (
        item
      ): item is {
        type?: 'output_text'
        text?: string
      } => item.type === 'output_text'
    )
    .map((item) => item.text ?? '')
    .join('')
    .trim()

  if (!outputText) {
    throw new Error('OpenAI returned an empty recipe chat response.')
  }

  return outputText
}

export async function askRecipeAssistant(
  recipe: RecipeChatContext,
  messages: RecipeChatMessage[]
) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'Recipe chat is not configured yet. Set OPENAI_API_KEY on the server first.'
    )
  }

  const model = process.env.OPENAI_RECIPE_CHAT_MODEL ?? DEFAULT_CHAT_MODEL
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 450,
      input: buildChatInput(recipe, messages),
    }),
    signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
  })

  const payload = (await response.json()) as OpenAIResponsePayload

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'OpenAI recipe chat failed.')
  }

  return extractResponseText(payload)
}
