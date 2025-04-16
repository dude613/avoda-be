export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  industry?: string
  billingRate: number
  notes?: string
  status: "active" | "archived"
  projects: number
}
