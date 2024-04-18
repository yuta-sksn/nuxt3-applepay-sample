<template>
  <div>
    <button v-if="isDisplayApplePay" @click="handleOnTapCheckoutApplePay">Apple Pay</button>
  </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()

const isDisplayApplePay = ref<boolean>(false)

const handleOnTapCheckoutApplePay = () => {
  const request = {
    countryCode: 'JP',
    currencyCode: 'JPY',
    /* 利用可能なカードブランドの種類 */
    supportedNetworks: ['visa', 'masterCard', 'jcb', 'amex'],
    merchantCapabilities: ['supports3DS'],
    total: {
      label: '商品名',
      amount: '10',
    },
  }

  // @ts-ignore
  const session = new ApplePaySession(15, request)

  // Apple Pay のセッションが開始されたら実行
  session.onvalidatemerchant = async (
    // @ts-ignore
    event
  ) => {
    console.log('Call session on validate merchant.')
    try {
      const validationURL = event.validationURL // Apple Pay から提供される URL
      console.log('Validation URL')
      console.log(validationURL)
      const merchantIdentifier = runtimeConfig.public.applePayMerchantIdentifier
      const domainName = runtimeConfig.public.applePayDomainName
      const displayName = 'テストショップ'

      console.log('Validate Merchant')
      const merchantSession = await $fetch('/api/validateMerchant', {
        method: 'POST',
        body: {
          validationURL,
          merchantIdentifier,
          domainName,
          displayName,
        },
      })

      console.log('Merchant Session:', merchantSession)
      session.completeMerchantValidation(merchantSession)
      console.log('called')
    } catch (error) {
      console.error('Error fetching merchant session:', error)
    }
  }

  session.onpaymentauthorized = (
    // @ts-ignore
    event
  ) => {
    // console.log('called')
    const token = event.payment.token
    // console.log(token)

    /* base64エンコードしたトークンをfincodeの決済実行APIのtokenに設定する */
    const encodedToken = btoa(JSON.stringify(token))
    console.log(encodedToken)
  }

  session.oncancel = (
    // @ts-ignore
    event
  ) => {
    console.log(event)
  }

  // Apple Pay 決済でエラーが発生した場合
  session.onerror = (
    // @ts-ignore
    event
  ) => {
    console.error('Apple Pay session error:', event.error.message)
  }

  console.log('before session begin')
  session.begin()
  console.log('before session after')
}

onMounted(async () => {
  // @ts-ignore
  if (window.ApplePaySession) {
    // FYI: https://developer.apple.com/documentation/apple_pay_on_the_web/applepaysession/1778000-canmakepaymentswithactivecard
    // @ts-ignore
    let result = (await ApplePaySession.canMakePaymentsWithActiveCard(
      runtimeConfig.public.applePayMerchantIdentifier
    )) as boolean

    // result = true

    // Apple Pay が利用できる場合
    if (result) {
      isDisplayApplePay.value = true
    }
  }
})
</script>