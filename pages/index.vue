<template>
  <div>
    <button v-if="isDisplayApplePay" @click="handleOnTapCheckoutApplePay">Apple Pay</button>
  </div>
</template>

<script setup lang="ts">
import { initFincode, type PaymentObject } from '@fincode/js'

const runtimeConfig = useRuntimeConfig()

const isDisplayApplePay = ref<boolean>(false)
const applePaySession = ref<any | null>(null)
const encodedTokenByApple = ref<string>('')

const handleOnCallbackPayments = (status: number, res: PaymentObject) => {
  if (!applePaySession.value) return

  if (status !== 200) {
    console.error('FAILURE')

    // ApplePaySession を failure で終了
    // @ts-ignore
    return applePaySession.value.completePayment(ApplePaySession.STATUS_FAILURE)
  }

  // @ts-ignore
  const acsUrl = res.acs_url

  // @ts-ignore
  applePaySession.value.completePayment(ApplePaySession.STATUS_SUCCESS)
}

const handleOnCallbackPaymentsError = () => {
  console.log('Error by payments')
}

const payments = () => {
  $fetch('/api/createCart', {
    method: 'POST',
  }).then(async (result) => {
    if (!result) return
    console.log(result)

    const fincde = await initFincode({
      publicKey: runtimeConfig.public.fincodePublicKey as string,
      isLiveMode: false,
    })

    fincde.payments(
      {
        // @ts-ignore
        pay_type: 'Applepay',
        access_id: result.access_id,
        id: result.id,
        token: encodedTokenByApple.value,
        method: '1',
      },
      handleOnCallbackPayments,
      handleOnCallbackPaymentsError
    )
  })
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
  applePaySession.value = new ApplePaySession(15, request)

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
    console.log('Apple Pay Token:', token)
    console.log('Apple Pay Token JSON String:', JSON.stringify(token.paymentData))
    encodedTokenByApple.value = btoa(JSON.stringify(token.paymentData))
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