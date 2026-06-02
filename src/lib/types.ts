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
  updatedAt: string
  updatedBy: string
}

export interface Company {
  id: string
  name: string
  passwordHash: string
  createdAt: string
  lastLogin: string
}

export interface Proposal {
  id: string
  companyName: string
  productName: string
  category: string
  description: string
  pricePerKg: number | null
  minLot: number | null
  contact: string
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  createdAt: string
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
