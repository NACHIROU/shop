import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit2, Trash2, Receipt, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import type { Expense, ExpenseCategory } from '@/types';
import { formatCurrency, getExpenseCategoryLabel, formatDate, expensesApi, statsApi } from '@/services/api';
import { PageLoader } from '@/components/ui/loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: 'transport', label: 'Transport' },
  { value: 'utilities', label: 'Factures (eau, électricité)' },
  { value: 'rent', label: 'Loyer' },
  { value: 'supplies', label: 'Fournitures' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'salary', label: 'Salaires' },
  { value: 'other', label: 'Autre' },
];

const getCategoryColor = (category: ExpenseCategory): string => {
  const colors: Record<ExpenseCategory, string> = {
    transport: 'bg-blue-500/10 text-blue-500',
    utilities: 'bg-yellow-500/10 text-yellow-500',
    rent: 'bg-purple-500/10 text-purple-500',
    supplies: 'bg-green-500/10 text-green-500',
    marketing: 'bg-pink-500/10 text-pink-500',
    salary: 'bg-orange-500/10 text-orange-500',
    other: 'bg-gray-500/10 text-gray-500',
  };
  return colors[category];
};

export default function Expenses() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch expenses
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', currentPage, searchQuery, categoryFilter],
    queryFn: () => expensesApi.getAll(currentPage, 50, searchQuery, categoryFilter === 'all' ? undefined : categoryFilter),
    placeholderData: (previousData) => previousData,
  });

  // Fetch stats (global and monthly)
  const { data: monthlyStats, isLoading: statsLoading } = useQuery({
    queryKey: ['expense-stats'],
    queryFn: () => statsApi.getMonthly(),
  });

  const expenseList = expensesData?.items || [];
  const totalPages = expensesData?.pages || 1;
  const totalCount = expensesData?.total || 0;
  const totalAmount = expensesData?.total_amount || 0;
  const isLoading = expensesLoading || statsLoading;

  const addExpenseMutation = useMutation({
    mutationFn: (payload: any) => expensesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      toast.success('Dépense ajoutée avec succès');
      setIsAddDialogOpen(false);
    },
    onError: () => toast.error("Erreur lors de l'ajout de la dépense")
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => expensesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      toast.success('Dépense modifiée avec succès');
      setEditingExpense(null);
    },
    onError: () => toast.error("Erreur lors de la modification")
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      toast.success('Dépense supprimée');
    },
    onError: () => toast.error("Erreur lors de la suppression")
  });

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addExpenseMutation.mutate({
      amount: Number(formData.get('amount')),
      category: formData.get('category') as ExpenseCategory,
      date: formData.get('date') as string,
      note: formData.get('note') as string || undefined,
    });
  };

  const handleEditExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExpense) return;
    const formData = new FormData(e.currentTarget);
    updateExpenseMutation.mutate({
      id: editingExpense.id,
      payload: {
        amount: Number(formData.get('amount')),
        category: formData.get('category') as ExpenseCategory,
        date: formData.get('date') as string,
        note: formData.get('note') as string || undefined,
      }
    });
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;
    deleteExpenseMutation.mutate(id);
  };

  const ExpenseForm = ({ expense, onSubmit }: { expense?: Expense; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) => (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Montant (FCFA) *</Label>
          <Input id="amount" name="amount" type="number" defaultValue={expense?.amount} placeholder="50000" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Catégorie *</Label>
          <Select name="category" defaultValue={expense?.category || 'other'}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date">Date *</Label>
          <Input id="date" name="date" type="date" defaultValue={expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="note">Note (optionnel)</Label>
          <Textarea id="note" name="note" defaultValue={expense?.note} placeholder="Description de la dépense..." />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => expense ? setEditingExpense(null) : setIsAddDialogOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">{expense ? 'Modifier' : 'Ajouter'}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold">Gestion des dépenses</h1>
            <p className="text-muted-foreground">Suivez vos dépenses pour calculer le profit net</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary">
                <Plus className="w-4 h-4" />
                Nouvelle dépense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nouvelle dépense</DialogTitle>
                <DialogDescription>
                  Enregistrez une nouvelle dépense.
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm onSubmit={handleAddExpense} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total dépenses (page)</p>
            </div>
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <p className="text-sm text-muted-foreground">Mois en cours</p>
            </div>
            <p className="text-2xl font-bold text-destructive font-mono">
              {monthlyStats ? formatCurrency(monthlyStats.totalExpenses) : '...'}
            </p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground mb-2">Nombre total</p>
            <p className="text-2xl font-bold font-mono">{totalCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une dépense..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ExpenseCategory | 'all')}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {expenseCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expenses Table */}
        {isLoading ? (
          <PageLoader />
        ) : expenseList.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Aucune dépense</h3>
            <p className="text-muted-foreground mb-4">Commencez par enregistrer votre première dépense.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle dépense
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseList.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">{formatDate(expense.date)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(expense.category)}>
                        {getExpenseCategoryLabel(expense.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expense.note ? (
                        <span className="text-sm text-muted-foreground line-clamp-1">{expense.note}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive font-mono">
                      -{formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingExpense(expense)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 animate-fade-in">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <div className="px-3 py-1 bg-muted rounded-md text-sm font-medium">
              Page {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier la dépense</DialogTitle>
              <DialogDescription>
                Modifiez les informations de la dépense.
              </DialogDescription>
            </DialogHeader>
            {editingExpense && <ExpenseForm expense={editingExpense} onSubmit={handleEditExpense} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
