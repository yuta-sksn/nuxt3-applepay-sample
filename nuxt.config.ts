// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width',
      htmlAttrs: {
        lang: 'ja',
      },
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' }
      ],
    },
  },
  modules: [
    '@nuxtjs/robots'
  ],
  robots: {
    UserAgent: '*',
    Disallow: '/'
  }
})
