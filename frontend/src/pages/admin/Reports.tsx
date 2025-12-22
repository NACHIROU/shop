import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { statsApi } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Download, Mail, Filter, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { usePrivacy } from '@/contexts/PrivacyContext';

const Reports = () => {
    const [startDate, setStartDate] = useState(
        new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isEmailing, setIsEmailing] = useState(false);
    const { isPrivate } = usePrivacy();

    const { data: reportData, isLoading, refetch } = useQuery({
        queryKey: ['treasury-report', startDate, endDate],
        queryFn: () => statsApi.getReport(startDate, endDate),
    });

    const handleEmailReport = async () => {
        if (!window.confirm("Voulez-vous vraiment envoyer ce rapport par email ?")) return;
        const email = window.prompt("Entrez l'adresse email pour l'envoi du rapport:");
        if (!email) return;

        try {
            setIsEmailing(true);
            const res = await statsApi.emailReport(email, startDate, endDate);
            if (res.success) {
                toast.success("Rapport envoyé avec succès !");
            } else {
                toast.error("Échec de l'envoi. Vérifiez la configuration SMTP.");
            }
        } catch (error) {
            toast.error("Erreur lors de l'envoi du rapport");
        } finally {
            setIsEmailing(false);
        }
    };

    const [isDownloading, setIsDownloading] = useState(false);
    const handleDownloadPDF = async () => {
        try {
            setIsDownloading(true);
            const blob = await statsApi.getReportPdf(startDate, endDate);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rapport_Tresorerie_${startDate}_${endDate}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Rapport téléchargé !");
        } catch (error) {
            toast.error("Erreur lors du téléchargement du PDF");
            console.error(error);
        } finally {
            setIsDownloading(false);
        }
    };

    const summary = reportData?.summary;

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Rapports de Trésorerie</h1>
                        <p className="text-muted-foreground">Analysez la santé financière de votre commerce</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleEmailReport} disabled={isEmailing || !summary}>
                            <Mail className="w-4 h-4 mr-2" />
                            Emailer le rapport
                        </Button>
                        <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloading || !summary}>
                            {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            Exporter PDF
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-border/50">
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date de début</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date de fin</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Button onClick={() => refetch()} className="gap-2">
                                <Filter className="w-4 h-4" />
                                Actualiser
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : summary ? (
                    <>
                        {/* Primary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="overflow-hidden border-border/50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">Profit Net (Reel)</CardTitle>
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-primary">{isPrivate ? "••••••" : formatCurrency(summary.net_profit)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Profit Opérationnel - Dépenses
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border-border/50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">Solde Global</CardTitle>
                                    <Wallet className="w-4 h-4 text-indigo-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{isPrivate ? "••••••" : formatCurrency(summary.global_balance)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Total Entrées - Total Sorties
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border-border/50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">Profit Opérationnel</CardTitle>
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-emerald-500">{isPrivate ? "••••••" : formatCurrency(summary.operational_profit)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Marge brute sur les ventes
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Badges */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-border/50">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-success/5 border border-success/10">
                                        <div>
                                            <p className="text-sm font-medium opacity-70">Total Ventes</p>
                                            <p className="text-2xl font-bold text-success">{formatCurrency(summary.total_sales)}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                            {summary.sales_count} ventes
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                        <div>
                                            <p className="text-sm font-medium opacity-70">Achats de Stock</p>
                                            <p className="text-xl font-bold text-blue-500">{isPrivate ? "••••••" : formatCurrency(summary.total_purchases)}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                            {summary.purchases_count} achats
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                                        <div>
                                            <p className="text-sm font-medium opacity-70">Dépenses Opérationnelles</p>
                                            <p className="text-xl font-bold text-destructive">{formatCurrency(summary.total_expenses)}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                            {summary.expenses_count} dépenses
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sales List Table */}
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Détails des Ventes</CardTitle>
                                <CardDescription>Liste exhaustive des ventes sur la période sélectionnée</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Date</th>
                                                <th className="px-4 py-3 text-left font-medium">Produit</th>
                                                <th className="px-4 py-3 text-left font-medium">IMEI</th>
                                                <th className="px-4 py-3 text-right font-medium">Qte</th>
                                                <th className="px-4 py-3 text-right font-medium">Montant</th>
                                                <th className="px-4 py-3 text-right font-medium">Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {reportData?.sales?.length > 0 ? (
                                                reportData.sales.map((sale: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {new Date(sale.date).toLocaleDateString('fr-BJ')}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium">{sale.product_name}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{sale.product_imei || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-right">{sale.quantity}</td>
                                                        <td className="px-4 py-3 text-right">{formatCurrency(sale.amount)}</td>
                                                        <td className="px-4 py-3 text-right text-emerald-500 font-medium">
                                                            {formatCurrency(sale.profit)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                        Aucune vente enregistrée sur cette période
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Filter className="w-12 h-12 mb-4 opacity-20" />
                        <p>Aucune donnée disponible pour cette période</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Reports;
