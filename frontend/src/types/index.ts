// ============= Core Types for API-first architecture =============

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}
export interface SupplierInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  imei?: string;
  purchasePrice: number;
  stock: number;
  category: string;
  supplierId?: string;
  supplierName?: string;
  isArchived?: boolean;
  sellingPrice?: number;
  clientName?: string;
  soldBy?: string;
  soldAt?: string;
  createdAt: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  tasksCompleted: number;
  tasksInProgress: number;
  joinedAt: string;
  isActive: boolean;
  avatar?: string;
}

export type UserRole = 'admin' | 'collaborator' | 'manager' | 'editor' | 'viewer';

export type TaskStatus = 'in_progress' | 'in_delivery' | 'completed' | 'cancelled';
export type TaskType = 'vente' | 'troc' | 'delivery' | 'client_visit' | 'repair' | 'exchange' | 'purchase' | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  assignedTo: string;
  assignedToName: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  clientName?: string;
  clientPhone?: string;
  date: string; // Operation date
  createdAt: string;
  updatedAt: string;

  // Sale-specific fields
  sellingPrice?: number;
  client?: string;

  // Trade-specific fields
  outgoingProductId?: string;
  outgoingProductPrice?: number;
  incomingProductName?: string;
  incomingProductImei?: string;
  incomingProductPrice?: number;
  incomingProductCategory?: string;
  recoveredFrom?: string;
}

export type ExpenseCategory = 'transport' | 'utilities' | 'rent' | 'supplies' | 'marketing' | 'salary' | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
  createdAt: string;
}

export interface DailyStats {
  date: string;
  sales: number;
  purchases: number;
  profit: number;
  tasks: number;
  expenses: number;
}

export interface MonthlyStats {
  totalSales: number;
  totalPurchases: number;
  globalBalance: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  cancelledTasks: number;
}

export interface DailyOverview {
  sales: number;
  purchases: number;
  globalBalance: number;
  profit: number;
  expenses: number;
  netProfit: number;
  newTasks: number;
  completedTasks: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  total_value?: number;
  total_amount?: number;
}

export interface InviteLink {
  invite_token: string;
  invite_url: string;
  collaborator_id: string;
}
