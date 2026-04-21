export type TransactionKind = "income" | "expense"

export type PaymentMethod =
  | "cash"
  | "debit"
  | "transfer"
  | "credit_card"
  | "credit_loan"

export interface Category {
  id: string
  name: string
  kind: TransactionKind
  icon: string
  color: string
  isDefault?: boolean
  createdAt: number
}

export interface Transaction {
  id: string
  kind: TransactionKind
  amount: number
  categoryId: string
  description: string
  date: number
  paymentMethod: PaymentMethod
  cardId?: string | null
  creditId?: string | null
  installments?: number
  installmentsPaid?: number
  createdAt: number
}

export interface CreditCard {
  id: string
  name: string
  bank: string
  lastFour: string
  creditLimit: number
  cutoffDay: number
  paymentDay: number
  color: string
  createdAt: number
}

export interface Credit {
  id: string
  name: string
  lender: string
  totalAmount: number
  monthlyPayment: number
  startDate: number
  endDate: number
  interestRate: number
  paymentDay: number
  installmentsTotal: number
  installmentsPaid: number
  createdAt: number
}

export interface InstallmentView {
  transactionId: string
  cardId?: string | null
  creditId?: string | null
  description: string
  categoryId: string
  totalInstallments: number
  installmentNumber: number
  amount: number
  dueDate: number
  paid: boolean
}
