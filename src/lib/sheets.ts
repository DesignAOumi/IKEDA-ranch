import { sheetsGet, sheetsUpdate, sheetsAppend, sheetsClear } from './google-auth'
import type { InventoryItem, Company, AlertHistory, AdminUser } from './types'

const SHEET = {
  INVENTORY: '在庫',
  COMPANIES: '飼料会社アカウント',
  ALERT_HISTORY: 'アラート履歴',
  ADMIN: '管理者アカウント',
} as const

const ID = process.env.SPREADSHEET_ID!

// ── 在庫 ──────────────────────────────────────────────

export async function getInventory(): Promise<InventoryItem[]> {
  const rows = await sheetsGet(ID, `${SHEET.INVENTORY}!A2:L`)
  return rows.map((r) => ({
    id: r[0] ?? '',
    category: (r[1] ?? '') as InventoryItem['category'],
    name: r[2] ?? '',
    stock: Number(r[3]) || 0,
    unit: r[4] ?? 'パレット',
    pricePerKg: r[5] ? Number(r[5]) : null,
    minLot: Number(r[6]) || 10,
    minLotPrice: r[7] ? Number(r[7]) : null,
    alertThreshold: Number(r[8]) || 5,
    updatedAt: r[9] ?? '',
    updatedBy: r[10] ?? '',
    company: r[11] ?? '',
  }))
}

/**
 * 在庫の「担当会社」セルの値（会社名）から飼料会社アカウントを引く。
 * 会社名で照合し、見つからなければ旧データの会社ID でも照合する（後方互換）。
 */
export function resolveCompany(value: string, companies: Company[]): Company | undefined {
  if (!value) return undefined
  return companies.find((c) => c.name === value) ?? companies.find((c) => c.id === value)
}

export async function addInventoryItem(
  data: Pick<InventoryItem, 'category' | 'name' | 'stock' | 'unit' | 'pricePerKg' | 'minLot' | 'minLotPrice' | 'alertThreshold'>,
  updatedBy: string
): Promise<void> {
  const items = await getInventory()
  const maxNum = items.reduce((max, item) => {
    const n = parseInt(item.id.replace('inv_', '')) || 0
    return n > max ? n : max
  }, 0)
  const newId = `inv_${String(maxNum + 1).padStart(3, '0')}`
  const now = new Date().toISOString()

  await sheetsAppend(ID, `${SHEET.INVENTORY}!A:L`, [[
    newId,
    data.category,
    data.name,
    data.stock,
    data.unit,
    data.pricePerKg ?? '',
    data.minLot,
    data.minLotPrice ?? '',
    data.alertThreshold,
    now,
    updatedBy,
    '', // 担当会社はスプレッドシートで設定する
  ]])
}

export async function updateInventoryItem(
  id: string,
  data: Partial<Pick<InventoryItem, 'stock' | 'pricePerKg' | 'minLot' | 'minLotPrice' | 'alertThreshold'>>,
  updatedBy: string
): Promise<void> {
  const items = await getInventory()
  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) throw new Error('Item not found')

  const row = idx + 2
  const item = items[idx]
  const now = new Date().toISOString()

  await sheetsUpdate(ID, `${SHEET.INVENTORY}!A${row}:L${row}`, [[
    item.id,
    item.category,
    item.name,
    data.stock ?? item.stock,
    item.unit,
    data.pricePerKg !== undefined ? (data.pricePerKg ?? '') : (item.pricePerKg ?? ''),
    data.minLot ?? item.minLot,
    data.minLotPrice !== undefined ? (data.minLotPrice ?? '') : (item.minLotPrice ?? ''),
    data.alertThreshold ?? item.alertThreshold,
    now,
    updatedBy,
    item.company, // 担当会社はスプレッドシートで設定するため既存値を保持
  ]])
}

// ── 飼料会社アカウント ──────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
  const rows = await sheetsGet(ID, `${SHEET.COMPANIES}!A2:F`)
  return rows.map((r) => ({
    id: r[0] ?? '',
    name: r[1] ?? '',
    passwordHash: r[2] ?? '',
    createdAt: r[3] ?? '',
    lastLogin: r[4] ?? '',
    email: r[5] ?? '',
  }))
}

export async function addCompany(company: Omit<Company, 'lastLogin'>): Promise<void> {
  await sheetsAppend(ID, `${SHEET.COMPANIES}!A:F`, [
    [company.id, company.name, company.passwordHash, company.createdAt, '', company.email ?? '']
  ])
}

export async function updateCompanyEmail(id: string, email: string): Promise<void> {
  const companies = await getCompanies()
  const idx = companies.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error('Company not found')
  await sheetsUpdate(ID, `${SHEET.COMPANIES}!F${idx + 2}`, [[email]])
}

export async function updateCompanyLastLogin(id: string): Promise<void> {
  const companies = await getCompanies()
  const idx = companies.findIndex((c) => c.id === id)
  if (idx === -1) return
  await sheetsUpdate(ID, `${SHEET.COMPANIES}!E${idx + 2}`, [[new Date().toISOString()]])
}

export async function deleteCompany(id: string): Promise<void> {
  const companies = await getCompanies()
  const idx = companies.findIndex((c) => c.id === id)
  if (idx === -1) return
  await sheetsClear(ID, `${SHEET.COMPANIES}!A${idx + 2}:F${idx + 2}`)
}

// ── アラート履歴 ────────────────────────────────────────

export async function addAlertHistory(entry: AlertHistory): Promise<void> {
  await sheetsAppend(ID, `${SHEET.ALERT_HISTORY}!A:E`, [
    [entry.id, entry.productName, entry.stock, entry.threshold, entry.sentAt]
  ])
}

export async function getTodayAlertHistory(): Promise<AlertHistory[]> {
  const rows = await sheetsGet(ID, `${SHEET.ALERT_HISTORY}!A2:E`)
  const today = new Date().toISOString().slice(0, 10)
  return rows
    .map((r) => ({
      id: r[0] ?? '',
      productName: r[1] ?? '',
      stock: Number(r[2]) || 0,
      threshold: Number(r[3]) || 0,
      sentAt: r[4] ?? '',
    }))
    .filter((e) => e.sentAt.startsWith(today))
}

// ── 管理者アカウント ────────────────────────────────────

export async function getAdminUsers(): Promise<AdminUser[]> {
  const rows = await sheetsGet(ID, `${SHEET.ADMIN}!A2:C`)
  return rows.map((r) => ({
    id: r[0] ?? '',
    username: r[1] ?? '',
    passwordHash: r[2] ?? '',
  }))
}
