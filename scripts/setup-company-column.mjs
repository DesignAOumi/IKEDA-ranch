// 「在庫」シートのL列を担当会社の設定列にする：
//   1. L1 に「担当会社」の見出しを設定
//   2. 旧データの会社ID（comp_xxx）が入っていれば会社名へ移行
//   3. L2:L に「飼料会社アカウント」の会社名から選べるプルダウン（入力規則）を設定
//
// ランタイムと同じ jose + fetch 方式で認証する（googleapis 不要）。
// 実行: node scripts/setup-company-column.mjs
import { SignJWT, importPKCS8 } from 'jose'
import { readFileSync } from 'fs'

// .env.local を読み込む
const env = readFileSync('.env.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '')
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const INVENTORY = '在庫'
const COMPANIES = '飼料会社アカウント'
const COMPANY_COL_INDEX = 11 // L列（0始まり）
const MAX_ROWS = 1000 // プルダウンを適用する最終行

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  const privateKey = await importPKCS8(
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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
  const data = await res.json()
  if (!data.access_token) throw new Error('アクセストークン取得失敗: ' + JSON.stringify(data))
  return data.access_token
}

async function api(token, path, init = {}) {
  const res = await fetch(`${BASE}/${SPREADSHEET_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`API ${res.status}: ${text}`)
  return text ? JSON.parse(text) : {}
}

async function main() {
  console.log('担当会社カラムのセットアップを開始...\n')
  const token = await getAccessToken()

  // シートID を取得
  const meta = await api(token, '')
  const invSheet = meta.sheets.find((s) => s.properties.title === INVENTORY)
  const compSheet = meta.sheets.find((s) => s.properties.title === COMPANIES)
  if (!invSheet) throw new Error(`「${INVENTORY}」シートが見つかりません`)
  if (!compSheet) throw new Error(`「${COMPANIES}」シートが見つかりません`)
  const invSheetId = invSheet.properties.sheetId
  console.log(`  ✓ シート確認: ${INVENTORY} / ${COMPANIES}`)

  // 1. 見出し L1 = 担当会社
  await api(token, `/values/${encodeURIComponent(`${INVENTORY}!L1`)}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: [['担当会社']] }),
  })
  console.log('  ✓ 見出し設定: L1 = 担当会社')

  // 2. 旧データの会社ID → 会社名 へ移行
  const compRows = (await api(token, `/values/${encodeURIComponent(`${COMPANIES}!A2:B`)}`)).values ?? []
  const idToName = new Map(compRows.map((r) => [r[0] ?? '', r[1] ?? '']))
  const companyNames = compRows.map((r) => r[1] ?? '').filter(Boolean)

  const invRows = (await api(token, `/values/${encodeURIComponent(`${INVENTORY}!A2:L`)}`)).values ?? []
  if (invRows.length > 0) {
    let migrated = 0
    const columnL = invRows.map((r) => {
      const v = r[COMPANY_COL_INDEX] ?? ''
      if (v && idToName.has(v)) {
        migrated++
        return [idToName.get(v)]
      }
      return [v]
    })
    await api(token, `/values/${encodeURIComponent(`${INVENTORY}!L2:L${invRows.length + 1}`)}?valueInputOption=RAW`, {
      method: 'PUT',
      body: JSON.stringify({ values: columnL }),
    })
    console.log(`  ✓ 担当会社の移行: ${migrated}件を会社IDから会社名へ変換（在庫${invRows.length}行）`)
  } else {
    console.log('  - 在庫データなし（移行スキップ）')
  }

  // 3. プルダウン（入力規則）を L2:L に設定
  const validationValue = `=${COMPANIES.includes("'") ? COMPANIES : `'${COMPANIES}'`}!$B$2:$B$${MAX_ROWS}`
  await api(token, ':batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          setDataValidation: {
            range: {
              sheetId: invSheetId,
              startRowIndex: 1,
              endRowIndex: MAX_ROWS,
              startColumnIndex: COMPANY_COL_INDEX,
              endColumnIndex: COMPANY_COL_INDEX + 1,
            },
            rule: {
              condition: {
                type: 'ONE_OF_RANGE',
                values: [{ userEnteredValue: validationValue }],
              },
              showCustomUi: true, // プルダウン矢印を表示
              strict: false, // リストにない値も許容（警告のみ・拒否しない）
            },
          },
        },
      ],
    }),
  })
  console.log(`  ✓ プルダウン設定: L2:L${MAX_ROWS} ← ${COMPANIES} の会社名`)
  if (companyNames.length === 0) {
    console.log('    ※ 飼料会社アカウントが未登録です。会社を追加するとプルダウンに反映されます。')
  } else {
    console.log(`    選択肢: ${companyNames.join(' / ')}`)
  }

  console.log('\n✅ セットアップ完了！スプレッドシートのL列「担当会社」で会社を選べます。')
}

main().catch((e) => {
  console.error('エラー:', e.message)
  process.exit(1)
})
