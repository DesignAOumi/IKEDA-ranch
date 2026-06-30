export type Category = '粗飼料' | '濃厚飼料' | '添加剤'

export interface InventoryItem {
  id: string
  category: Category
  name: string
  stock: number
  unit: string
  pricePerKg: number | null
  minLot: number
  minLotPrice: number | null
  alertThreshold: number
  /** 担当会社（スプレッドシートで設定。会社名を保持。旧データのID も許容） */
  company: string
  updatedAt: string
  updatedBy: string
}

export interface Company {
  id: string
  name: string
  passwordHash: string
  email: string
  createdAt: string
  lastLogin: string
}

export interface AlertHistory {
  id: string
  productName: string
  stock: number
  threshold: number
  sentAt: string
}

export interface AdminUser {
  id: string
  username: string
  passwordHash: string
}

export interface AuthPayload {
  id: string
  role: 'admin' | 'company'
  name: string
}
