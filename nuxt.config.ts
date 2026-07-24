import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false,
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    associationProvider: 'dummy',
    geminiApiKey: '',
    geminiModel: 'gemini-3.5-flash-lite',
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
