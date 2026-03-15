# Analytics/GTM Audit

## Scope

Reviewed the current analytics implementation against the target GTM setup:

- Base tag: `TAG – GA4 – Base`
- Dynamic GA4 event tag: `TAG – GA4 – dynamic_event`
- Trigger: `TR – event – app_events`
- Data Layer Variables:
  - `category`
  - `completed`
  - `event_name`
  - `item_name`
  - `method`
  - `publish_status`
  - `quantity`
  - `recipe_id`
  - `recipe_slug`
  - `recipe_title`
  - `results_count`
  - `search_term`
  - `source`
  - `tags`
  - `unit`

## 1) Current analytics/data layer implementation

- Analytics events are enumerated in `src/lib/analytics/events.ts`.
- Event pushes flow through a single helper `pushEvent` in `src/lib/analytics/pushEvent.ts`.
- Domain-specific tracking wrappers live in `src/lib/analytics/track.ts` and call `pushEvent`.
- `pushEvent` currently pushes objects in this shape:
  - `{ event, ...payload }`

## 2) Mismatches between pushed keys and GTM variable names

### ✅ Matches

All payload keys currently defined in `src/lib/analytics/events.ts` are compatible with the GTM variable list:

- `category`
- `completed`
- `item_name`
- `method`
- `publish_status`
- `quantity`
- `recipe_id`
- `recipe_slug`
- `recipe_title`
- `results_count`
- `search_term`
- `source`
- `tags`
- `unit`

### ⚠️ Gap

- `event_name` is listed as a required GTM variable but is not included in current pushes.

## 3) Events missing `event` or `event_name`

- `event`: present in all pushes because `pushEvent` always includes `event`.
- `event_name`: missing in all pushes because `pushEvent` does not add it and payload types do not require it.

## 4) Direct GA4 calls bypassing GTM

No direct GA4 calls found in `src`:

- No `gtag(...)`
- No `ga(...)`

Analytics appears to route through `window.dataLayer.push(...)` via `pushEvent`.

## 5) Recommended shared helper structure

To enforce consistency and reduce drift from GTM expectations, keep one canonical helper and central schema.

### Recommended contract

- Continue using a single `pushEvent(event, payload)` function.
- Ensure helper always pushes:
  - `event`
  - `event_name` (mirrors `event` by default)
- Restrict payload keys to the approved GTM variable set.
- Optionally allow explicit `event_name` override for rare cases.

### Suggested TypeScript shape

```ts
// gtmVariables.ts
export type GtmVariablePayload = {
  category?: string
  completed?: boolean
  item_name?: string
  method?: string
  publish_status?: 'draft' | 'published'
  quantity?: number
  recipe_id?: string
  recipe_slug?: string
  recipe_title?: string
  results_count?: number
  search_term?: string
  source?: string
  tags?: string[]
  unit?: string
}

// pushEvent.ts
export function pushEvent<TEvent extends AnalyticsEventName>(
  event: TEvent,
  payload: AnalyticsEventPayloadMap[TEvent],
  options?: { event_name?: string }
) {
  const event_name = options?.event_name ?? event

  window.dataLayer?.push({
    event,
    event_name,
    ...payload,
  })
}
```

### Recommended guardrails

- Add unit tests to assert every push includes both `event` and `event_name`.
- Add an integration test (or lightweight runtime assertion in non-prod) to verify no unsupported keys are pushed.
- Keep event-specific wrappers (`trackRecipeView`, etc.) so calling sites remain simple and typed.
