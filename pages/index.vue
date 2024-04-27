<template>
  <div>
    <button v-if="isDisplayApplePay" @click="handleOnTapCheckoutApplePay">Apple Pay</button>
  </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()

const isDisplayApplePay = ref<boolean>(false)
const applePaySession = ref<any | null>(null)
const encodedTokenByApple = ref<string>('')

const payments = () => {
  $fetch('/api/createCard', {
    method: 'POST',
  }).then((result) => {
    console.log(result)
  })

  // @ts-ignore
  applePaySession.value.completePayment(ApplePaySession.STATUS_SUCCESS)
}

const handleOnTapCheckoutApplePay = () => {
  const request = {
    countryCode: 'JP',
    currencyCode: 'JPY',
    supportedNetworks: ['visa', 'masterCard', 'jcb', 'amex'],
    merchantCapabilities: ['supports3DS'],
    requiredBillingContactFields: ['postalAddress'],
    total: {
      label: 'My Store',
      amount: 10,
    },
  }

  // @ts-ignore
  applePaySession.value = new ApplePaySession(10, request)

  // Apple Pay のセッションが開始されたら実行
  applePaySession.value.onvalidatemerchant = (
    // @ts-ignore
    event
  ) => {
    try {
      const validationURL = event.validationURL
      const merchantIdentifier = runtimeConfig.public.applePayMerchantIdentifier
      const domainName = runtimeConfig.public.applePayDomainName
      const displayName = 'My Store'

      console.log('Validate Merchant')
      $fetch('/api/validateMerchant', {
        method: 'POST',
        body: {
          validationURL,
          merchantIdentifier,
          domainName,
          displayName,
        },
      }).then((merchantSession) => {
        console.log('Merchant Session:', merchantSession)
        applePaySession.value.completeMerchantValidation(merchantSession)
        console.log('called')
      })
    } catch (error) {
      console.error('Error fetching merchant session:', error)
    }
  }

  applePaySession.value.onpaymentmethodselected = (
    // @ts-ignore
    event
  ) => {
    console.log('onpaymentmethodselected')
  
    const myPaymentMethod = event.paymentMethod
    console.log(myPaymentMethod)

    applePaySession.value.completePaymentMethodSelection({
      newTotal: {
        label: 'My Store',
        amount: 10,
        type: 'final',
      },
      newLineItems: [],
    })
  }

  applePaySession.value.onpaymentauthorized = (
    // @ts-ignore
    event
  ) => {
    const token = event.payment.token
    encodedTokenByApple.value = btoa(JSON.stringify(token))
    console.log(encodedTokenByApple.value)

    payments()
  }

  applePaySession.value.oncancel = (
    // @ts-ignore
    event
  ) => {
    console.log(event)
  }

  applePaySession.value.begin()
}

onMounted(async () => {
  // @ts-ignore
  if (window.ApplePaySession) {
    // FYI: https://developer.apple.com/documentation/apple_pay_on_the_web/applepaysession/1778000-canmakepaymentswithactivecard
    // @ts-ignore
    const result = (await ApplePaySession.canMakePaymentsWithActiveCard(
      runtimeConfig.public.applePayMerchantIdentifier
    )) as boolean

    // When Apple Pay is available.
    if (result) {
      isDisplayApplePay.value = true
    }
  }
})
</script>