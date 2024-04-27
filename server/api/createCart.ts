import { createFincode } from "@fincode/node"

export default defineEventHandler(async (event) => {
  const fincode = createFincode({
    apiKey: process.env.FINCODE_API_KEY as string,
    isLiveMode: false
  })

  return await fincode.payments.create({
    pay_type: "Applepay",
    job_code: "CAPTURE",
    amount: "10"
})
});