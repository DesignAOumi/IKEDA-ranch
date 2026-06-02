import { google } from 'googleapis'
import type { InventoryItem, Company, Proposal, AlertHistory, AdminUser } from './types'

const SHEET_NAMES = {
  INVENTORY: '在庫',
  COMPANIES: '飼料会社アカウント',
  PROPOSALS: '新商材提案',
  ALERT_HISTORY: 'アラート履歴',
  ADMIN: '管理者アカウント',
} as const

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!

// ── 在庫 ──────────────────────────────────────────────

export async function getInventory(): Promise<InventoryItem[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.INVENTORY}!A2:K`,
  })
  const rows = res.data.values ?? []
  return rows.map((r) => ({
    id: r[0] ?? '',
    category: r[1] ?? '',
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

export async function updateInventoryItem(
  id: string,
  data: Partial<Pick<InventoryItem, 'stock' | 'pricePerKg' | 'minLot' | 'minLotPrice' | 'alertThreshold'>>,
  updatedBy: string
): Promise<void> {
  const sheets = getSheets()
  const items = await getInventory()
  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) throw new Error('Item not found')

  const row = idx + 2
  const item = items[idx]
  const now = new Date().toISOString()

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.INVENTORY}!A${row}:K${row}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        item.id,
        item.category,
        item.name,
        data.stock ?? item.stock,
        item.unit,
        data.pricePerKg ?? item.pricePerKg ?? '',
        data.minLot ?? item.minLot,
        data.minLotPrice ?? item.minLotPrice ?? '',
        data.alertThreshold ?? item.alertThreshold,
        now,
        updatedBy,
      ]],
    },
  })
}

// ── 飼料会社アカウント ──────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.COMPANIES}!A2:E`,
  })
  const rows = res.data.values ?? []
  return rows.map((r) => ({
    id: r[0] ?? '',
    name: r[1] ?? '',
    passwordHash: r[2] ?? '',
    createdAt: r[3] ?? '',
    lastLogin: r[4] ?? '',
  }))
}

export async function addCompany(company: Omit<Company, 'lastLogin'>): Promise<void> {
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.COMPANIES}!A:E`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[company.id, company.name, company.passwordHash, company.createdAt, '']],
    },
  })
}

export async function updateCompanyLastLogin(id: string): Promise<void> {
  const sheets = getSheets()
  const companies = await getCompanies()
  const idx = companies.findIndex((c) => c.id === id)
  if (idx === -1) return
  const row = idx + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.COMPANIES}!E${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[new Date().toISOString()]] },
  })
}

export async function deleteCompany(id: string): Promise<void> {
  const sheets = getSheets()
  const companies = await getCompanies()
  const idx = companies.findIndex((c) => c.id === id)
  if (idx === -1) return
  const row = idx + 2
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.COMPANIES}!A${row}:E${row}`,
  })
}

// ── 新商材提案 ──────────────────────────────────────────

export async function getProposals(): Promise<Proposal[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.PROPOSALS}!A2:J`,
  })
  const rows = res.data.values ?? []
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
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.PROPOSALS}!A:J`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
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
      ]],
    },
  })
}

export async function updateProposalStatus(id: string, status: Proposal['status']): Promise<void> {
  const sheets = getSheets()
  const proposals = await getProposals()
  const idx = proposals.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error('Proposal not found')
  const row = idx + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.PROPOSALS}!I${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  })
}

// ── アラート履歴 ────────────────────────────────────────

export async function addAlertHistory(entry: AlertHistory): Promise<void> {
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.ALERT_HISTORY}!A:E`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[entry.id, entry.productName, entry.stock, entry.threshold, entry.sentAt]],
    },
  })
}

export async function getTodayAlertHistory(): Promise<AlertHistory[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.ALERT_HISTORY}!A2:E`,
  })
  const rows = res.data.values ?? []
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
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.ADMIN}!A2:C`,
  })
  const rows = res.data.values ?? []
  return rows.map((r) => ({
    id: r[0] ?? '',
    username: r[1] ?? '',
    passwordHash: r[2] ?? '',
  }))
}
