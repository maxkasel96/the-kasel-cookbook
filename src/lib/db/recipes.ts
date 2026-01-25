import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getPublishedRecipes() {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
