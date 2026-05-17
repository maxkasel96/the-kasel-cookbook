import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'The Kasel Cookbook',
    short_name: 'Cookbook',
    description:
      'Browse family recipes, plan meals, save favorites, and build a shared shopping list.',
    start_url: '/recipes',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f6f0e6',
    theme_color: '#555842',
    categories: ['food', 'lifestyle', 'productivity'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Recipes',
        short_name: 'Recipes',
        description: 'Browse the family recipe collection.',
        url: '/recipes',
        icons: [{ src: '/icons/icon.svg', sizes: 'any' }],
      },
      {
        name: 'Favorites',
        short_name: 'Favorites',
        description: 'Open saved favorite recipes.',
        url: '/favorites',
        icons: [{ src: '/icons/icon.svg', sizes: 'any' }],
      },
      {
        name: 'Create Recipe',
        short_name: 'Create',
        description: 'Add a recipe to the cookbook.',
        url: '/admin/recipes/create',
        icons: [{ src: '/icons/icon.svg', sizes: 'any' }],
      },
    ],
  }
}
