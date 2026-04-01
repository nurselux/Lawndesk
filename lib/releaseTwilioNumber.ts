export async function releaseTwilioNumber(numberSid: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!
  const authToken = process.env.TWILIO_AUTH_TOKEN!
  const auth = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers/${numberSid}.json`,
    { method: 'DELETE', headers: { Authorization: auth } }
  )

  // 204 = success, 404 = already gone — both are fine
  if (!res.ok && res.status !== 404) {
    const text = await res.text()
    throw new Error(`Twilio release failed (${res.status}): ${text}`)
  }
}
