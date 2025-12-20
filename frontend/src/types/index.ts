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
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  category: string;
  supplierId?: string;
  supplierName?: string;
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
  avatar?: string;
}

export type UserRole = 'admin' | 'manager' | 'editor' | 'viewer';

export type TaskStatus = 'in_progress' | 'in_delivery' | 'completed' | 'cancelled';
export type TaskType = 'sale' | 'delivery' | 'client_visit' | 'exchange' | 'purchase' | 'other';

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
  profit: number;
  tasks: number;
  expenses: number;
}

export interface MonthlyStats {
  totalSales: number;
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
  total_profit?: number;
  total_amount?: number;
}
