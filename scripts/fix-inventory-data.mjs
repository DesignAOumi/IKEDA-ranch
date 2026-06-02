import { google } from 'googleapis'
import { readFileSync } from 'fs'

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

// 正しいフォーマット: [category, name, stock, unit, pricePerKg, minLot, minLotPrice, alertThreshold]
const INVENTORY = [
  ['粗飼料',  'オーツ',                     12, 'パレット',  65,    10, null,  5],
  ['粗飼料',  'アルファルファ',               3, 'パレット',  72,    10, null,  5],
  ['粗飼料',  'チモシー',                     7, 'パレット',  86,    10, null,  5],
  ['粗飼料',  'WCS（Jアグリ）',               4, 'パレット',  null,  10, null,  5],
  ['粗飼料',  'ドライCS',                     2, 'パレット',  81,    10, null,  5],
  ['濃厚飼料', 'ドラコン300Y',                6, 'パレット',  80,    10, null,  5],
  ['濃厚飼料', '醤油粕',                      8, 'パレット',  null,  10, null,  5],
  ['濃厚飼料', '大豆の皮',                    9, 'パレット',  50,    10, null,  5],
  ['濃厚飼料', '大豆粕',                      7, 'パレット',  91,    10, null,  5],
  ['濃厚飼料', 'コーンフレーク',               5, 'パレット',  60,    10, null,  5],
  ['濃厚飼料', 'ふすま',                      4, 'パレット',  42,    10, null,  5],
  ['濃厚飼料', 'ビートパルプ',                 7, 'パレット',  69,    10, null,  5],
  ['濃厚飼料', 'カーフマンナ',                 8, 'パレット',  null,  10, null,  5],
  ['添加剤',  '炭酸カルシウム（タンカル）',     8, 'パレット',  21.6,  10, null,  5],
  ['添加剤',  '脂肪酸カルシウム',              5, 'パレット', 300,    10, null,  5],
  ['添加剤',  '重曹',                         4, 'パレット', 103,    10, null,  5],
  ['添加剤',  'ビタミン（クリスタルミックス）',  3, 'パレット', 550,    10, null,  5],
]

const now = new Date().toISOString()

const rows = INVENTORY.map((r, i) => [
  `inv_${String(i + 1).padStart(3, '0')}`, // A: ID
  r[0],    // B: 種類
  r[1],    // C: 商品名
  r[2],    // D: 在庫数
  r[3],    // E: 単位
  r[4] ?? '', // F: 単価(円/kg)
  r[5],    // G: 最低ロット
  r[6] ?? '', // H: 最低ロット単価
  r[7],    // I: アラート基準
  now,     // J: 最終更新日時
  'システム初期化', // K: 更新者
])

await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: '在庫!A2',
  valueInputOption: 'RAW',
  requestBody: { values: rows },
})

console.log(`✅ 在庫データを正しい列フォーマットで書き直しました (${rows.length}件)`)
