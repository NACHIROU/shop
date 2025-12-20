import { useState, useEffect } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const [data, monthlyStats] = await Promise.all([
        expensesApi.getAll(currentPage),
        statsApi.getMonthly()
      ]);

      const mappedData = data.items.map((item: any) => ({
        ...item,
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      }));

      setExpenseList(mappedData);
      setTotalPages(data.pages);
      setTotalCount(data.total);
      setTotalExpenses(data.total_amount);
      setMonthlyExpenses(monthlyStats.totalExpenses);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des dépenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentPage]);

  const filteredExpenses = expenseList.filter(expense => {
    const matchesSearch = expense.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getExpenseCategoryLabel(expense.category).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newExpensePayload = {
      amount: Number(formData.get('amount')),
      category: formData.get('category') as ExpenseCategory,
      date: formData.get('date') as string,
      note: formData.get('note') as string || undefined,
    };

    try {
      await expensesApi.create(newExpensePayload);
      toast.success('Dépense ajoutée avec succès');
      setIsAddDialogOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout de la dépense");
    }
  };

  const handleEditExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExpense) return;

    const formData = new FormData(e.currentTarget);
    const updatedPayload: Partial<Expense> = {
      amount: Number(formData.get('amount')),
      category: formData.get('category') as ExpenseCategory,
      date: formData.get('date') as string,
      note: formData.get('note') as string || undefined,
    };

    try {
      await expensesApi.update(editingExpense.id, updatedPayload);
      toast.success('Dépense modifiée avec succès');
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;
    try {
      await expensesApi.delete(id);
      toast.success('Dépense supprimée');
      fetchExpenses();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    }
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
              <p className="text-sm text-muted-foreground">Total dépenses</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalCount)}</p> {/* Total count */}
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <p className="text-sm text-muted-foreground">Ce mois</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(monthlyExpenses)}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground mb-2">Total général</p>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
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
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <Badge variant="secondary">{formatDate(expense.date)}</Badge>
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
                    <TableCell className="text-right font-medium text-destructive">
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
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </span>
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
