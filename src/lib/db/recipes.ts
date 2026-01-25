import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function searchRecipes(query?: string) {
  const supabase = createSupabaseServerClient()

  let request = supabase
    .from('recipes')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (query && query.trim().length > 0) {
    request = request.ilike('title', `%${query.trim()}%`)
  }

  const { data, error } = await request
  if (error) throw new Error(error.message)
  return data ?? []
}
