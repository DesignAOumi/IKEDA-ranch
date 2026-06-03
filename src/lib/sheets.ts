import { sheetsGet, sheetsUpdate, sheetsAppend, sheetsClear } from './google-auth'
import type { InventoryItem, Company, Proposal, AlertHistory, AdminUser } from './types'

const SHEET = {
  INVENTORY: '在庫',
  COMPANIES: '飼料会社アカウント',
  PROPOSALS: '新商材提案',
  ALERT_HISTORY: 'アラート履歴',
  ADMIN: '管理者アカウント',
} as const

const ID = process.env.SPREADSHEET_ID!

// ── 在庫 ──────────────────────────────────────────────

export async function getInventory(): Promise<InventoryItem[]> {
  const rows = await sheetsGet(ID, `${SHEET.INVENTORY}!A2:K`)
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
  }))
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

  await sheetsAppend(ID, `${SHEET.INVENTORY}!A:K`, [[
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

  await sheetsUpdate(ID, `${SHEET.INVENTORY}!A${row}:K${row}`, [[
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
  ]])
}

// ── 飼料会社アカウント ──────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
  const rows = await sheetsGet(ID, `${SHEET.COMPANIES}!A2:E`)
  return rows.map((r) => ({
    id: r[0] ?? '',
    name: r[1] ?? '',
    passwordHash: r[2] ?? '',
    createdAt: r[3] ?? '',
    lastLogin: r[4] ?? '',
  }))
}

export async function addCompany(company: Omit<Company, 'lastLogin'>): Promise<void> {
  await sheetsAppend(ID, `${SHEET.COMPANIES}!A:E`, [
    [company.id, company.name, company.passwordHash, company.createdAt, '']
  ])
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
  await sheetsClear(ID, `${SHEET.COMPANIES}!A${idx + 2}:E${idx + 2}`)
}

// ── 新商材提案 ──────────────────────────────────────────

export async function getProposals(): Promise<Proposal[]> {
  const rows = await sheetsGet(ID, `${SHEET.PROPOSALS}!A2:J`)
  return rows.map((r) => ({
    id: r[0] ?? '',
    companyName: r[1] ?? '',
    productName: r[2] ?? '',
    category: r[3] ?? '',
    description: r[4] ?? '',
    pricePerKg: r[5] ? Number(r[5]) : null,
    minLot: r[6] ? Number(r[6]) : null,
    contact: r[7] ?? '',
    status: (r[8] as Proposal['status']) ?? 'pending',
    createdAt: r[9] ?? '',
  }))
}

export async function addProposal(proposal: Omit<Proposal, 'status'>): Promise<void> {
  await sheetsAppend(ID, `${SHEET.PROPOSALS}!A:J`, [[
    proposal.id,
    proposal.companyName,
    proposal.productName,
    proposal.category,
    proposal.description,
    proposal.pricePerKg ?? '',
    proposal.minLot ?? '',
    proposal.contact,
    'pending',
    proposal.createdAt,
  ]])
}

export async function updateProposalStatus(id: string, status: Proposal['status']): Promise<void> {
  const proposals = await getProposals()
  const idx = proposals.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error('Proposal not found')
  await sheetsUpdate(ID, `${SHEET.PROPOSALS}!I${idx + 2}`, [[status]])
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
