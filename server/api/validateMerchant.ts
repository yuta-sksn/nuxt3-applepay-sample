export default defineEventHandler(async (event) => {
  console.log(await readBody(event))
  const body = await readBody(event)

  const validationUrl = body.validationURL as string

  const requestBody = {
    merchantIdentifier: body.merchantIdentifier,
    domainName: body.domainName,
    displayName: body.displayName,
  }

  console.log(`Post to ${validationUrl}`)

  try {
    const response = await $fetch(validationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    })

    console.log(response)

    return response
  } catch (error) {
    console.error('Error validating merchant:', error)
    return createError({
      statusCode: 500,
      statusMessage: 'Server error during merchant validation',
    })
  }
})
