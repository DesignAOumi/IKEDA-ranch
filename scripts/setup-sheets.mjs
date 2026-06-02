import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'
import { randomUUID } from 'crypto'

// Load .env.local manually
const env = readFileSync('.env.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '')
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })

const SHEETS = [
  { title: '在庫', index: 0 },
  { title: '飼料会社アカウント', index: 1 },
  { title: '新商材提案', index: 2 },
  { title: 'アラート履歴', index: 3 },
  { title: '管理者アカウント', index: 4 },
]

const INITIAL_INVENTORY = [
  ['粗飼料', 'オーツ', 12, 'パレット', 65, '', 10, '', 5],
  ['粗飼料', 'アルファルファ', 3, 'パレット', 72, '', 10, '', 5],
  ['粗飼料', 'チモシー', 7, 'パレット', 86, '', 10, '', 5],
  ['粗飼料', 'WCS（Jアグリ）', 4, 'パレット', '', '', 10, '', 5],
  ['粗飼料', 'ドライCS', 2, 'パレット', 81, '', 10, '', 5],
  ['濃厚飼料', 'ドラコン300Y', 6, 'パレット', 80, '', 10, '', 5],
  ['濃厚飼料', '醤油粕', 8, 'パレット', '', '', 10, '', 5],
  ['濃厚飼料', '大豆の皮', 9, 'パレット', 50, '', 10, '', 5],
  ['濃厚飼料', '大豆粕', 7, 'パレット', 91, '', 10, '', 5],
  ['濃厚飼料', 'コーンフレーク', 5, 'パレット', 60, '', 10, '', 5],
  ['濃厚飼料', 'ふすま', 4, 'パレット', 42, '', 10, '', 5],
  ['濃厚飼料', 'ビートパルプ', 7, 'パレット', 69, '', 10, '', 5],
  ['濃厚飼料', 'カーフマンナ', 8, 'パレット', '', '', 10, '', 5],
  ['添加剤', '炭酸カルシウム（タンカル）', 8, 'パレット', 21.6, '', 10, '', 5],
  ['添加剤', '脂肪酸カルシウム', 5, 'パレット', 300, '', 10, '', 5],
  ['添加剤', '重曹', 4, 'パレット', 103, '', 10, '', 5],
  ['添加剤', 'ビタミン（クリスタルミックス）', 3, 'パレット', 550, '', 10, '', 5],
]

async function getExistingSheets() {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  return res.data.sheets.map((s) => s.properties.title)
}

async function createSheet(title, index) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title, index } } }],
    },
  })
  console.log(`  ✓ シート作成: ${title}`)
}

async function renameSheet(oldTitle, newTitle) {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = res.data.sheets.find((s) => s.properties.title === oldTitle)
  if (!sheet) return
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        updateSheetProperties: {
          properties: { sheetId: sheet.properties.sheetId, title: newTitle },
          fields: 'title',
        },
      }],
    },
  })
  console.log(`  ✓ シート名変更: ${oldTitle} → ${newTitle}`)
}

async function writeHeaders(sheetTitle, headers) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetTitle}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  })
}

async function setup() {
  console.log('スプレッドシートのセットアップを開始...\n')

  const existing = await getExistingSheets()
  console.log('既存シート:', existing)

  // シート1: 在庫（既存シートを流用またはリネーム）
  if (!existing.includes('在庫')) {
    if (existing[0]) {
      await renameSheet(existing[0], '在庫')
    } else {
      await createSheet('在庫', 0)
    }
  }

  // シート②〜⑤ 作成
  for (const s of SHEETS.slice(1)) {
    if (!existing.includes(s.title)) {
      await createSheet(s.title, s.index)
    } else {
      console.log(`  - スキップ（既存）: ${s.title}`)
    }
  }

  // ヘッダー書き込み
  console.log('\nヘッダーを設定中...')
  await writeHeaders('在庫', ['ID', '種類', '商品名', '在庫数', '単位', '単価(円/kg)', '最低ロット', '最低ロット単価', 'アラート基準', '最終更新日時', '更新者'])
  await writeHeaders('飼料会社アカウント', ['ID', '会社名', 'パスワードハッシュ', '作成日', '最終ログイン'])
  await writeHeaders('新商材提案', ['ID', '会社名', '商品名', '種類', '説明', '提案価格(円/kg)', '最低ロット', '連絡先', 'ステータス', '提案日時'])
  await writeHeaders('アラート履歴', ['ID', '商品名', '在庫数', 'アラート基準', '通知日時'])
  await writeHeaders('管理者アカウント', ['ID', 'ユーザー名', 'パスワードハッシュ'])
  console.log('  ✓ 全ヘッダー設定完了')

  // 在庫データ書き込み
  console.log('\n在庫データを書き込み中...')
  const now = new Date().toISOString()
  const inventoryRows = INITIAL_INVENTORY.map((r, i) => [
    `inv_${String(i + 1).padStart(3, '0')}`,
    r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8],
    now,
    'システム初期化',
  ])
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: '在庫!A2',
    valueInputOption: 'RAW',
    requestBody: { values: inventoryRows },
  })
  console.log(`  ✓ ${inventoryRows.length}件の在庫データを書き込み`)

  // 管理者アカウント作成
  console.log('\n管理者アカウントを作成中...')
  const adminPassword = 'ikeda2024'
  const adminHash = createHash('sha256').update(adminPassword).digest('hex')
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: '管理者アカウント!A2',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[randomUUID(), 'admin', adminHash]],
    },
  })
  console.log(`  ✓ 管理者アカウント作成`)
  console.log(`    ユーザー名: admin`)
  console.log(`    パスワード: ${adminPassword}  ← 後で変更してください`)

  console.log('\n✅ セットアップ完了！')
}

setup().catch((e) => {
  console.error('エラー:', e.message)
  process.exit(1)
})
