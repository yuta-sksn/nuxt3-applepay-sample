import https from 'https';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const validationUrl = new URL(body.validationURL as string);
  const clientCert = process.env.APPLE_PAY_CERT;

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cert: clientCert,
    key: clientCert,
    rejectUnauthorized: false, // 証明書検証を行わない場合のみ必要です
  };

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(validationUrl.href, requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const responseData = JSON.parse(data);
          resolve(responseData); // レスポンスデータを解決して返す
        });
      });

      req.on('error', (error) => {
        reject(error); // エラーが発生した場合はエラーを拒否して返す
      });

      req.write(JSON.stringify({
        merchantIdentifier: body.merchantIdentifier,
        displayName: body.displayName,
        initiative: 'web',
        domainName: body.domainName,
        initiativeContext: body.domainName,
      }));

      req.end();
    });

    // @ts-ignore
    // response.epochTimestamp = Number(String(response.epochTimestamp).slice(0, -3))
    // @ts-ignore
    // response.expiresAt = Number(String(response.expiresAt).slice(0, -3))

    console.log(response)

    return response; // クライアントに返すデータを返す
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Internal Server Error'); // エラーが発生した場合は内部サーバーエラーをスローして返す
  }
});