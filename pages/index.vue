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
      type: 'final'
    },
  }

  // @ts-ignore
  const session = new ApplePaySession(15, request)

  // Apple Pay のセッションが開始されたら実行
  session.onvalidatemerchant = (
    // @ts-ignore
    event
  ) => {
    try {
      const validationURL = event.validationURL // Apple Pay から提供される URL
      console.log('Validation URL')
      console.log(validationURL)
      const merchantIdentifier = runtimeConfig.public.applePayMerchantIdentifier
      const domainName = runtimeConfig.public.applePayDomainName
      const displayName = 'テストショップ'

      console.log('Validate Merchant')
      $fetch('/api/validateMerchant', {
        method: 'POST',
        body: {
          validationURL,
          merchantIdentifier,
          domainName,
          displayName,
        },
      }).then(async (merchantSession) => {
        console.log('Merchant Session:', merchantSession)
        await session.completeMerchantValidation(merchantSession)
        console.log('called')
      })
    } catch (error) {
      console.error('Error fetching merchant session:', error)
    }
  }

  session.onpaymentauthorized = (
    // @ts-ignore
    event
  ) => {
    const token = event.payment.token

    /* base64エンコードしたトークンをfincodeの決済実行APIのtokenに設定する */
    const encodedToken = btoa(JSON.stringify(token))
    console.log(encodedToken)

    session.completePayment(ApplePaySession.STATUS_SUCCESS)
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
        label: '商品名',    // 請求項目のラベル
        amount: '10',       // 金額
        type: 'final'       // この金額が最終的なものであるかどうか（'final' または 'pending'）
      },
      newLineItems: [],
    });
  };

// session.onshippingmethodselected = event => {
//   console.log('onshippingmethodselected+1')
//   // No updates or errors are needed, pass an empty object.
//   var status = ApplePaySession.STATUS_SUCCESS;
//   session.completeShippingMethodSelection(ApplePaySession.STATUS_SUCCESS, {
//     "label": "After Trial Period",
//     "amount": "50.00",
//     "type": "final",
//     "paymentTiming": "deferred",
//     "deferredPaymentDate": new Date("2023-07-01T00:00:00"),
// }, null);

// };
// session.onshippingcontactselected = event => {
//   console.log('onshippingcontactselected')
//   const update = {
//     newTotal: {
//       label: '商品名',
//       amount: '10',
//     },
//   };
//   session.completeShippingContactSelection(update);
// };


  session.oncancel = (
    // @ts-ignore
    event
  ) => {
    console.log(event)
  }

  // Apple Pay 決済でエラーが発生した場合
  // session.onerror = (
  //   // @ts-ignore
  //   event
  // ) => {
  //   console.error('Apple Pay session error:', event.error.message)
  // }

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

    result = true

    // Apple Pay が利用できる場合
    if (result) {
      isDisplayApplePay.value = true
    }
  }
})
</script>