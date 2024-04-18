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
    supportedNetworks: ['visa', 'masterCard', 'jcb', 'amex'],
    merchantCapabilities: ['supports3DS'],
    requiredBillingContactFields: ['postalAddress'],
    total: {
      label: 'My Store',
      amount: 10,
    },
  }

  // @ts-ignore
  const session = new ApplePaySession(10, request)

  // Apple Pay のセッションが開始されたら実行
  session.onvalidatemerchant = (
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
        session.completeMerchantValidation(merchantSession)
        console.log('called')
      })
    } catch (error) {
      console.error('Error fetching merchant session:', error)
    }
  }

  session.onpaymentmethodselected = (
    // @ts-ignore
    event
  ) => {
    console.log('onpaymentmethodselected')
  
    const myPaymentMethod = event.paymentMethod
    console.log(myPaymentMethod)

    session.completePaymentMethodSelection({
      newTotal: {
        label: 'My Store',
        amount: 10,
        type: 'final',
      },
      newLineItems: [],
    })
  }

  session.onpaymentauthorized = (
    // @ts-ignore
    event
  ) => {
    const token = event.payment.token
    const encodedToken = btoa(JSON.stringify(token))
    console.log(encodedToken)
    session.completePayment(ApplePaySession.STATUS_SUCCESS)
  }

  session.oncancel = (
    // @ts-ignore
    event
  ) => {
    console.log(event)
  }

  session.begin()
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