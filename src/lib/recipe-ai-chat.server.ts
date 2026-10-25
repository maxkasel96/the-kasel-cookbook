import { z } from 'zod'

import type { RecipeAssistantResponse } from '@/lib/recipe-ai-types'

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

const recipeAssistantResponseSchema = z.object({
  answer: z.string().trim().min(1),
  proposal: z
    .object({
      summary: z.array(z.string().trim().min(1)).min(1),
      recipe: z.object({
        title: z.string().trim().min(1),
        description: z.string(),
        prepMinutes: z.number().finite().nonnegative().nullable(),
        cookMinutes: z.number().finite().nonnegative().nullable(),
        servings: z.number().finite().positive().nullable(),
        tags: z.array(z.string()),
        categories: z.array(z.string()),
        ingredients: z
          .array(
            z.object({
              ingredientText: z.string().trim().min(1),
              quantity: z.string(),
              unit: z.string(),
              note: z.string(),
              isOptional: z.boolean(),
            })
          )
          .min(1),
        steps: z
          .array(
            z.object({
              content: z.string().trim().min(1),
              ingredientPositions: z.array(z.number().int().positive()),
            })
          )
          .min(1),
      }),
    })
    .nullable(),
})

const recipeAssistantResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['answer', 'proposal'],
  properties: {
    answer: { type: 'string' },
    proposal: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['summary', 'recipe'],
          properties: {
            summary: {
              type: 'array',
              items: { type: 'string' },
            },
            recipe: {
              type: 'object',
              additionalProperties: false,
              required: [
                'title',
                'description',
                'prepMinutes',
                'cookMinutes',
                'servings',
                'tags',
                'categories',
                'ingredients',
                'steps',
              ],
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                prepMinutes: { type: ['number', 'null'] },
                cookMinutes: { type: ['number', 'null'] },
                servings: { type: ['number', 'null'] },
                tags: { type: 'array', items: { type: 'string' } },
                categories: { type: 'array', items: { type: 'string' } },
                ingredients: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: [
                      'ingredientText',
                      'quantity',
                      'unit',
                      'note',
                      'isOptional',
                    ],
                    properties: {
                      ingredientText: { type: 'string' },
                      quantity: { type: 'string' },
                      unit: { type: 'string' },
                      note: { type: 'string' },
                      isOptional: { type: 'boolean' },
                    },
                  },
                },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['content', 'ingredientPositions'],
                    properties: {
                      content: { type: 'string' },
                      ingredientPositions: {
                        type: 'array',
                        items: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
} as const

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

function buildChatInput(
  recipe: RecipeChatContext,
  messages: RecipeChatMessage[],
  allowEdits: boolean
) {
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
            allowEdits
              ? [
                  'You may propose recipe edits when the user asks to improve, adapt, rewrite, or apply advice to the recipe.',
                  'A proposal must contain the complete revised recipe, preserving every unchanged field and item.',
                  'Use decimal numeric strings or an empty string for ingredient quantities; do not use fraction strings such as 1/2.',
                  'ingredientPositions are 1-based indexes into the proposed ingredients array.',
                  'Summarize only the material changes. Never say changes were saved; say they are ready for review.',
                  'For ordinary questions that do not request a recipe change, return a null proposal.',
                ].join(' ')
              : 'You cannot propose, update, edit, save, or modify the recipe. Always return a null proposal.',
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
  messages: RecipeChatMessage[],
  options: { allowEdits: boolean }
): Promise<RecipeAssistantResponse> {
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
      max_output_tokens: options.allowEdits ? 2600 : 650,
      input: buildChatInput(recipe, messages, options.allowEdits),
      text: {
        format: {
          type: 'json_schema',
          name: 'recipe_assistant_response',
          strict: true,
          schema: recipeAssistantResponseJsonSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
  })

  const payload = (await response.json()) as OpenAIResponsePayload

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'OpenAI recipe chat failed.')
  }

  const responseText = await extractResponseText(payload)

  try {
    return recipeAssistantResponseSchema.parse(
      JSON.parse(responseText)
    ) as RecipeAssistantResponse
  } catch {
    throw new Error('OpenAI returned an invalid recipe edit proposal.')
  }
}
