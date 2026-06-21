import { NextResponse } from 'next/server'

import {
  askRecipeAssistant,
  type RecipeChatMessage,
} from '@/lib/recipe-ai-chat.server'
import { getCurrentUser } from '@/lib/auth/roles'
import { getRecipeBySlug } from '@/lib/db/recipes'

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

type ChatBody = {
  messages?: RecipeChatMessage[]
}

export const runtime = 'nodejs'

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { slug } = await context.params
  const body = (await request.json()) as ChatBody
  const messages = Array.isArray(body.messages) ? body.messages : []
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && message.content?.trim())

  if (!latestUserMessage) {
    return NextResponse.json(
      { error: 'Enter a question about this recipe.' },
      { status: 400 }
    )
  }

  try {
    const recipe = await getRecipeBySlug(slug)

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 })
    }

    const answer = await askRecipeAssistant(recipe, messages)

    return NextResponse.json({ answer })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to answer that recipe question right now.',
      },
      { status: 500 }
    )
  }
}
