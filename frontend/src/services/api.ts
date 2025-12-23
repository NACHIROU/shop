// ============= API Service Layer =============
// This file provides the interface for all data operations.
// Now connected to the real backend API.

import type {
  Supplier,
  Product,
  Collaborator,
  Task,
  TaskStatus,
  Expense,
  ExpenseCategory,
  Category,
  DailyStats,
  MonthlyStats,
  DailyOverview,
  PaginatedResponse,
  InviteLink,
} from '@/types';

// Base API URL - proxied to backend
// Remove trailing slash if present to avoid double slashes
const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

// Generic fetch wrapper with auth
async function apiFetch<T>(endpoint: string, options?: RequestInit, returnBlob: boolean = false): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  if (returnBlob) {
    return response.blob() as any;
  }

  return response.json();
}

// ============= Auth API =============
export const authApi = {
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    apiFetch<{ access_token: string; refresh_token: string; token_type: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    apiFetch<{ access_token: string; refresh_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createCollaborator: (data: { name: string; email: string; role: string; phone?: string; password?: string }) =>
    apiFetch<{ id: string; name: string; email: string; phone: string; role: string; is_active: boolean; created_at: string }>('/auth/collaborators', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCollaborators: () =>
    apiFetch<Collaborator[]>('/auth/collaborators'),
  generateInviteLink: (collaboratorId: string) =>
    apiFetch<InviteLink>(`/auth/collaborators/${collaboratorId}/invite-link`, {
      method: 'POST',
    }),
  verifyInviteToken: (token: string) =>
    apiFetch<{ user_id: string; email: string; name: string }>(`/auth/verify-invite/${token}`, {
      method: 'POST',
    }),
  activateAccount: (token: string, newPassword: string) =>
    apiFetch<{ access_token: string; refresh_token: string; token_type: string; user: any }>('/auth/activate', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    }),
  changePassword: (data: { new_password: string }) =>
    apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ new_password: data.new_password }),
    }),
  updateCollaborator: (id: string, data: Partial<Collaborator>) =>
    apiFetch<Collaborator>(`/auth/collaborators/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCollaborator: (id: string) =>
    apiFetch(`/auth/collaborators/${id}`, {
      method: 'DELETE',
    }),
  getMerchants: () =>
    apiFetch<any[]>('/auth/merchants'),
  createMerchant: (data: { name: string; email: string; phone: string }) =>
    apiFetch<any>('/auth/merchants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleUserStatus: (id: string) =>
    apiFetch<{ message: string; is_active: boolean }>(`/auth/users/${id}/toggle-status`, {
      method: 'POST',
    }),
  resetUserPassword: (id: string) =>
    apiFetch<{ message: string }>(`/auth/users/${id}/reset-password`, {
      method: 'POST',
    }),
};
// ============= Suppliers API =============
export const suppliersApi = {
  getAll: (): Promise<Supplier[]> => apiFetch('/suppliers/'),
  getById: (id: string): Promise<Supplier> => apiFetch(`/suppliers/${id}`),
  create: (data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> =>
    apiFetch('/suppliers/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Supplier>): Promise<Supplier> =>
    apiFetch(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/suppliers/${id}`, { method: 'DELETE' }),
};

// ============= Products API =============
export const productsApi = {
  getAll: (page: number = 1, limit: number = 50, search?: string, category?: string, isArchived: boolean = false, startDate?: string, endDate?: string, soldBy?: string): Promise<PaginatedResponse<Product>> => {
    let url = `/products/?page=${page}&size=${limit}&is_archived=${isArchived}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    if (soldBy && soldBy !== 'all') url += `&sold_by=${soldBy}`;
    return apiFetch(url);
  },
  export: (search?: string, category?: string, isArchived: boolean = false, startDate?: string, endDate?: string, soldBy?: string): Promise<Blob> => {
    let url = `/products/export?is_archived=${isArchived}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    if (soldBy && soldBy !== 'all') url += `&sold_by=${soldBy}`;
    return apiFetch(url, {}, true);
  },
  getById: (id: string): Promise<Product> => apiFetch(`/products/${id}`),
  create: (data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> =>
    apiFetch('/products/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Product>): Promise<Product> =>
    apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/products/${id}`, { method: 'DELETE' }),
  bulkAction: (action: 'delete' | 'archive', productIds: string[]): Promise<{ message: string }> =>
    apiFetch('/products/bulk', { method: 'POST', body: JSON.stringify({ action, product_ids: productIds }) }),
};

// ============= Categories API =============
export const categoriesApi = {
  getAll: (): Promise<Category[]> => apiFetch('/categories/'),
  create: (data: { name: string }): Promise<Category> =>
    apiFetch('/categories/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/categories/${id}`, { method: 'DELETE' }),
};

// ============= Collaborators API =============
export const collaboratorsApi = {
  getAll: (): Promise<Collaborator[]> => apiFetch('/collaborators/'),
  getById: (id: string): Promise<Collaborator> => apiFetch(`/collaborators/${id}`),
  create: (data: Omit<Collaborator, 'id' | 'joinedAt' | 'tasksCompleted' | 'tasksInProgress'>): Promise<Collaborator> =>
    apiFetch('/collaborators/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Collaborator>): Promise<Collaborator> =>
    apiFetch(`/collaborators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/collaborators/${id}`, { method: 'DELETE' }),
};

// ============= Tasks API =============
export const tasksApi = {
  getAll: (date?: string, isArchived: boolean = false): Promise<Task[]> => {
    let url = `/tasks/?is_archived=${isArchived}`;
    if (date) url += `&date=${date}`;
    return apiFetch(url);
  },
  getById: (id: string): Promise<Task> => apiFetch(`/tasks/${id}`),
  getByCollaborator: (collaboratorId: string): Promise<Task[]> =>
    apiFetch(`/tasks/?collaborator_id=${collaboratorId}`),
  getMyTasks: (date?: string): Promise<Task[]> => {
    let url = '/tasks/my';
    if (date) url += `?date=${date}`;
    return apiFetch(url);
  },
  create: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> =>
    apiFetch('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Task>): Promise<Task> =>
    apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: TaskStatus): Promise<Task> =>
    apiFetch(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
  cleanup: (): Promise<{ archived_count: number }> =>
    apiFetch('/tasks/cleanup', { method: 'POST' }),
  bulkAction: (action: 'delete' | 'archive', taskIds: string[]): Promise<{ message: string }> =>
    apiFetch('/tasks/bulk', { method: 'POST', body: JSON.stringify({ action, task_ids: taskIds }) }),
};

// ============= Expenses API =============
export const expensesApi = {
  getAll: (page: number = 1, limit: number = 50, startDate?: string, endDate?: string): Promise<PaginatedResponse<Expense>> => {
    let query = `/expenses/?page=${page}&size=${limit}`;
    if (startDate && endDate) {
      query += `&startDate=${startDate}&endDate=${endDate}`;
    }
    return apiFetch(query);
  },
  getById: (id: string): Promise<Expense> => apiFetch(`/expenses/${id}`),
  getByDateRange: (startDate: string, endDate: string): Promise<Expense[]> =>
    apiFetch(`/expenses/?startDate=${startDate}&endDate=${endDate}`),
  create: (data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> =>
    apiFetch('/expenses/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Expense>): Promise<Expense> =>
    apiFetch(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    apiFetch(`/expenses/${id}`, { method: 'DELETE' }),
};

// ============= Stats API =============
export const statsApi = {
  getDaily: () =>
    apiFetch<any>('/analytics/daily'),
  getDailyOverview: () =>
    apiFetch<any>('/analytics/daily'),
  getMonthly: () =>
    apiFetch<any>('/analytics/monthly'),
  getMonthlyStats: () =>
    apiFetch<any>('/analytics/monthly'),
  getWeekly: () =>
    apiFetch<any[]>('/analytics/weekly'),
  getWeeklyStats: () =>
    apiFetch<any[]>('/analytics/weekly'),
  getGlobalStats: () =>
    apiFetch<any>('/analytics/global'),
  getReport: (startDate: string, endDate: string): Promise<any> =>
    apiFetch(`/analytics/report?start_date=${startDate}&end_date=${endDate}`),
  getTreasuryReport: (startDate: string, endDate: string): Promise<any> =>
    apiFetch(`/analytics/report?start_date=${startDate}&end_date=${endDate}`),
  emailReport: (email: string, startDate: string, endDate: string): Promise<{ success: boolean }> =>
    apiFetch('/analytics/report/email', {
      method: 'POST',
      body: JSON.stringify({ email, start_date: startDate, end_date: endDate })
    }),
  getReportPdf: (startDate: string, endDate: string): Promise<Blob> =>
    apiFetch(`/analytics/report/pdf?start_date=${startDate}&end_date=${endDate}`, {}, true),
};

// ============= Notifications API =============
export const notificationsApi = {
  getAll: (): Promise<any[]> => apiFetch('/notifications/'),
  markAsRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
  markAllAsRead: () => apiFetch('/notifications/read-all', { method: 'POST' }),
};

// ============= Audit Logs API =============
export const auditLogsApi = {
  getAll: (merchantId?: string, page = 1, size = 100): Promise<any[]> => {
    const skip = (page - 1) * size;
    let url = `/audit-logs/?limit=${size}&skip=${skip}`;
    if (merchantId) url += `&merchant_id=${merchantId}`;
    return apiFetch(url);
  }
};

// ============= Utility Functions =============
export function formatCurrency(amount: number): string {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('fr-BJ', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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
    vente: 'Vente',
    troc: 'Troc',
    repair: 'Réparation',
    delivery: 'Livraison',
    client_visit: 'Visite client',
    exchange: 'Échange',
    purchase: 'Achat',
    other: 'Autre',
  };
  return labels[type] || type;
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
  notifications: notificationsApi,
};
