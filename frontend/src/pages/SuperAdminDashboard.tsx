import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { statsApi } from '@/services/api';
import {
    Users,
    TrendingUp,
    DollarSign,
    Briefcase,
    ArrowUpRight,
    Store,
    Activity
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function SuperAdminDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['globalStats'],
        queryFn: statsApi.getGlobalStats,
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </DashboardLayout>
        );
    }

    const statCards = [
        {
            title: "Marchands Totaux",
            value: stats?.totalMerchants || 0,
            icon: Store,
            color: "text-blue-600",
            bg: "bg-blue-100",
            description: "Comptes enregistrés"
        },
        {
            title: "Marchands Actifs",
            value: stats?.activeMerchants30d || 0,
            icon: Activity,
            color: "text-green-600",
            bg: "bg-green-100",
            description: "Sur les 30 derniers jours"
        },
        {
            title: "Volume Global (Ventes)",
            value: formatCurrency(stats?.totalVolumeAllTime || 0),
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-100",
            description: "Chiffre d'affaires total"
        },
        {
            title: "Profit Plateforme",
            value: formatCurrency(stats?.totalProfitAllTime || 0),
            icon: DollarSign,
            color: "text-amber-600",
            bg: "bg-amber-100",
            description: "Marge brute totale générée"
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord Global</h1>
                    <p className="text-muted-foreground">Vue d'ensemble de l'activité sur EasyManaging</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, index) => (
                        <Card key={index} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-bold">{stat.value}</h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                                    </div>
                                    <div className={`${stat.bg} ${stat.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                                        <stat.icon size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Growth Chart */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Croissance de la Plateforme</CardTitle>
                            <CardDescription>Évolution du nombre de marchands et du volume de ventes</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.growth}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(value: any, name: string) => [
                                            name === 'volume' ? formatCurrency(value) : value,
                                            name === 'volume' ? 'Volume Ventes' : 'Marchands'
                                        ]}
                                    />
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="volume"
                                        stroke="#6366f1"
                                        fillOpacity={1}
                                        fill="url(#colorVolume)"
                                        strokeWidth={3}
                                    />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="merchantCount"
                                        stroke="#10b981"
                                        fill="transparent"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Merchants List */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Top Marchands</CardTitle>
                                <CardDescription>Meilleures performances par volume de ventes</CardDescription>
                            </div>
                            <ArrowUpRight className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {stats?.topMerchants?.map((merchant: any, index: number) => (
                                    <div key={merchant.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold group-hover:text-primary transition-colors">{merchant.name}</p>
                                                <p className="text-xs text-muted-foreground">{merchant.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(merchant.totalSales)}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {merchant.activeTasks} tâches en cours
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.topMerchants || stats.topMerchants.length === 0) && (
                                    <p className="text-center text-muted-foreground py-10">Aucune donnée disponible</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
