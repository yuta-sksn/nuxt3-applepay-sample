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
  runtimeConfig: {
    public: {
      applePayMerchantIdentifier: process.env.APPLE_PAY_MERCHANT_IDENTIFIER,
      applePayDomainName: process.env.APPLE_PAY_DOMAIN_NAME,
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
