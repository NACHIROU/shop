// ============= API Service Layer =============
// This file provides the interface for all data operations.
// Replace implementations with actual API calls when backend is ready.

import type {
  Supplier,
  Product,
  Collaborator,
  Task,
  TaskStatus,
  Expense,
  ExpenseCategory,
  DailyStats,
  MonthlyStats,
  DailyOverview,
} from '@/types';

// Base API URL - replace with actual backend URL
const API_BASE_URL = '/api';

// Generic fetch wrapper for future API implementation
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

// ============= Suppliers API =============
export const suppliersApi = {
  getAll: (): Promise<Supplier[]> => apiFetch('/suppliers'),
  getById: (id: string): Promise<Supplier> => apiFetch(`/suppliers/${id}`),
  create: (data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> =>
    apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Supplier>): Promise<Supplier> =>
    apiFetch(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/suppliers/${id}`, { method: 'DELETE' }),
};

// ============= Products API =============
export const productsApi = {
  getAll: (): Promise<Product[]> => apiFetch('/products'),
  getById: (id: string): Promise<Product> => apiFetch(`/products/${id}`),
  create: (data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> =>
    apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Product>): Promise<Product> =>
    apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/products/${id}`, { method: 'DELETE' }),
};

// ============= Collaborators API =============
export const collaboratorsApi = {
  getAll: (): Promise<Collaborator[]> => apiFetch('/collaborators'),
  getById: (id: string): Promise<Collaborator> => apiFetch(`/collaborators/${id}`),
  create: (data: Omit<Collaborator, 'id' | 'joinedAt' | 'tasksCompleted' | 'tasksInProgress'>): Promise<Collaborator> =>
    apiFetch('/collaborators', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Collaborator>): Promise<Collaborator> =>
    apiFetch(`/collaborators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/collaborators/${id}`, { method: 'DELETE' }),
};

// ============= Tasks API =============
export const tasksApi = {
  getAll: (): Promise<Task[]> => apiFetch('/tasks'),
  getById: (id: string): Promise<Task> => apiFetch(`/tasks/${id}`),
  getByCollaborator: (collaboratorId: string): Promise<Task[]> =>
    apiFetch(`/tasks?collaboratorId=${collaboratorId}`),
  create: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> =>
    apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Task>): Promise<Task> =>
    apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: TaskStatus): Promise<Task> =>
    apiFetch(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
};

// ============= Expenses API =============
export const expensesApi = {
  getAll: (): Promise<Expense[]> => apiFetch('/expenses'),
  getById: (id: string): Promise<Expense> => apiFetch(`/expenses/${id}`),
  getByDateRange: (startDate: string, endDate: string): Promise<Expense[]> =>
    apiFetch(`/expenses?startDate=${startDate}&endDate=${endDate}`),
  create: (data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> =>
    apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Expense>): Promise<Expense> =>
    apiFetch(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/expenses/${id}`, { method: 'DELETE' }),
};

// ============= Stats API =============
export const statsApi = {
  getDaily: (): Promise<DailyOverview> => apiFetch('/stats/daily'),
  getMonthly: (): Promise<MonthlyStats> => apiFetch('/stats/monthly'),
  getWeekly: (): Promise<DailyStats[]> => apiFetch('/stats/weekly'),
};

// ============= Utility Functions =============
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-BJ', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    in_progress: 'En cours',
    in_delivery: 'En livraison',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status];
}

export function getStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    in_progress: 'bg-info text-info-foreground',
    in_delivery: 'bg-warning text-warning-foreground',
    completed: 'bg-success text-success-foreground',
    cancelled: 'bg-destructive text-destructive-foreground',
  };
  return colors[status];
}

export function getTaskTypeLabel(type: Task['type']): string {
  const labels: Record<Task['type'], string> = {
    sale: 'Vente',
    delivery: 'Livraison',
    client_visit: 'Visite client',
    exchange: 'Échange',
    purchase: 'Achat',
    other: 'Autre',
  };
  return labels[type];
}

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    transport: 'Transport',
    utilities: 'Factures',
    rent: 'Loyer',
    supplies: 'Fournitures',
    marketing: 'Marketing',
    salary: 'Salaires',
    other: 'Autre',
  };
  return labels[category];
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-BJ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ============= Combined API Export =============
export const api = {
  suppliers: suppliersApi,
  products: productsApi,
  collaborators: collaboratorsApi,
  tasks: tasksApi,
  expenses: expensesApi,
  stats: statsApi,
};
