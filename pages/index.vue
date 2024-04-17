<template>
  <div>
    <button v-if="isDisplayApplePay">Apple Pay</button>
  </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()

const isDisplayApplePay = ref<boolean>(false)

onMounted(async () => {
  // @ts-ignore
  if (window.ApplePaySession) {
    // FYI: https://developer.apple.com/documentation/apple_pay_on_the_web/applepaysession/1778000-canmakepaymentswithactivecard
    // @ts-ignore
    let result = (await ApplePaySession.canMakePaymentsWithActiveCard(
      runtimeConfig.public.applePayMerchantIdentifier
    )) as boolean

    // Apple Pay が利用できる場合
    if (result) {
      isDisplayApplePay.value = true
    }
  }
})
</script>