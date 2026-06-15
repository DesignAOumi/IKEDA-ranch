import type { InventoryItem } from './types'

// メールの送信者表示名（受信側の差出人名）
const SENDER_NAME = '池田牧場'

/**
 * GAS（Google Apps Script）のWebアプリ経由でメールを1通送信する。
 * GAS_MAIL_URL / GAS_MAIL_SECRET が未設定の場合は何もしない（LINE通知と同じ思想）。
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const url = process.env.GAS_MAIL_URL
  const secret = process.env.GAS_MAIL_SECRET
  if (!url || !secret || !to) return

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, to, subject, text, name: SENDER_NAME }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('GAS mail send failed:', res.status, body)
  }
}

/**
 * 担当会社へ「在庫が基準値を下回った飼料」の発注依頼メールを送る。
 * メール未設定の会社・対象品目ゼロのときは送信しない。
 */
export async function sendOrderRequestEmail(
  companyName: string,
  to: string,
  items: Pick<InventoryItem, 'name' | 'stock' | 'unit' | 'alertThreshold' | 'minLot'>[]
): Promise<void> {
  if (!to || items.length === 0) return

  const subject = '【池田牧場】飼料の発注依頼（在庫が基準値を下回りました）'
  const text = [
    `${companyName} ご担当者様`,
    '',
    'いつもお世話になっております。池田牧場です。',
    '下記の飼料が在庫基準値を下回りましたので、ご手配をお願いいたします。',
    '',
    ...items.map(
      (i) =>
        `・${i.name}：現在 ${i.stock}${i.unit}（基準 ${i.alertThreshold}${i.unit} / 最小ロット ${i.minLot}${i.unit}）`
    ),
    '',
    '何卒よろしくお願いいたします。',
    '池田牧場',
  ].join('\n')

  await sendEmail(to, subject, text)
}
