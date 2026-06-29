'use client'

import { useMemo, useRef, useState } from 'react'

import { trackRecipeAiChatSubmitted } from '@/lib/analytics/track'

type RecipeAiChatProps = {
  recipeId: string
  recipeSlug: string
  recipeTitle: string
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type ChatResponse = {
  answer?: string
  error?: string
}

const QUICK_PROMPTS = [
  'Explain this recipe',
  'Help me substitute an ingredient',
  'What should I prep first?',
  'Troubleshoot this step',
]

const createMessageId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`

export default function RecipeAiChat({
  recipeId,
  recipeSlug,
  recipeTitle,
}: RecipeAiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const canSubmit = useMemo(
    () => Boolean(draft.trim()) && !isSubmitting,
    [draft, isSubmitting]
  )

  const submitQuestion = async (question: string) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isSubmitting) return

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmedQuestion,
    }
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setDraft('')
    setError(null)
    setIsSubmitting(true)

    trackRecipeAiChatSubmitted({
      recipe_id: recipeId,
      recipe_title: recipeTitle,
      recipe_slug: recipeSlug,
    })

    try {
      const response = await fetch(`/api/recipes/${recipeSlug}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      })

      const payload = (await response.json()) as ChatResponse

      if (!response.ok || !payload.answer) {
        throw new Error(
          payload.error ?? 'Unable to answer that recipe question right now.'
        )
      }

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: payload.answer ?? '',
        },
      ])
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to answer that recipe question right now.'
      )
    } finally {
      setIsSubmitting(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitQuestion(draft)
  }

  return (
    <section className="recipe-detail-panel recipe-assistant-panel">
      <div className="recipe-assistant-panel__header">
        <div>
          <p className="recipe-panel-heading__kicker">
            Cooking Assistant
          </p>
          <h2>
            Ask about this recipe
          </h2>
          <p>
            Ask for substitutions, technique help, timing, or troubleshooting.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setDraft(prompt)
              inputRef.current?.focus()
            }}
            className="recipe-chat-quick-prompt px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div
        className="recipe-chat-messages mt-5 space-y-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={`recipe-chat-message recipe-chat-message--${message.role} rounded-2xl px-4 py-3 text-sm leading-6`}
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))
        ) : (
          <p className="recipe-chat-empty rounded-2xl px-4 py-3 text-sm">
            Start with a question like what to prep first or how to tell when a
            step is done.
          </p>
        )}
        {isSubmitting ? (
          <div className="recipe-chat-message recipe-chat-message--assistant rounded-2xl px-4 py-3 text-sm leading-6">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
              Assistant
            </p>
            <p>Thinking through the recipe...</p>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <label
          htmlFor="recipe-ai-chat-input"
          className="text-sm font-medium text-foreground"
        >
          Your question
        </label>
        <textarea
          ref={inputRef}
          id="recipe-ai-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void submitQuestion(draft)
            }
          }}
          rows={3}
          disabled={isSubmitting}
          placeholder="Can I prep anything ahead while the oven heats?"
          className="recipe-detail-input min-h-28 w-full resize-y rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Press Enter to send. Press Shift+Enter for a new line.
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="recipe-detail-primary-action px-5 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Asking...' : (
              <>
                Ask
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
