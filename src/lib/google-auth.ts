import { SignJWT, importPKCS8 } from 'jose'

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getSheetsAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token
  }

  const privateKey = await importPKCS8(
    process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    'RS256'
  )

  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = await res.json() as { access_token: string; expires_in: number }
  if (!data.access_token) throw new Error('Failed to get access token')

  cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) }
  return cachedToken.token
}

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export async function sheetsGet(spreadsheetId: string, range: string): Promise<string[][]> {
  const token = await getSheetsAccessToken()
  const res = await fetch(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json() as { values?: string[][] }
  return data.values ?? []
}

export async function sheetsUpdate(
  spreadsheetId: string,
  range: string,
  values: (string | number | null)[][]
): Promise<void> {
  const token = await getSheetsAccessToken()
  await fetch(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  )
}

export async function sheetsAppend(
  spreadsheetId: string,
  range: string,
  values: (string | number | null)[][]
): Promise<void> {
  const token = await getSheetsAccessToken()
  await fetch(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  )
}

export async function sheetsClear(spreadsheetId: string, range: string): Promise<void> {
  const token = await getSheetsAccessToken()
  await fetch(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  )
}

export async function getSpreadsheetSheetTitles(spreadsheetId: string): Promise<string[]> {
  const token = await getSheetsAccessToken()
  const res = await fetch(
    `${BASE}/${spreadsheetId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json() as { sheets: { properties: { title: string } }[] }
  return data.sheets?.map((s) => s.properties.title) ?? []
}
