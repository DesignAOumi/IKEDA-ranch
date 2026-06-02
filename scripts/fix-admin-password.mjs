import { google } from 'googleapis'
import { readFileSync } from 'fs'
import bcrypt from 'bcryptjs'

const env = readFileSync('.env.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '')
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })
const SPREADSHEET_ID = process.env.SPREADSHEET_ID

const password = 'ikeda2024'
const hash = await bcrypt.hash(password, 10)

await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: '管理者アカウント!C2',
  valueInputOption: 'RAW',
  requestBody: { values: [[hash]] },
})

console.log('✅ 管理者パスワードを bcrypt ハッシュに更新しました')
console.log('  パスワード:', password)
