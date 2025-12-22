import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '@/services/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ScrollText, User, Store, Activity } from 'lucide-react';

export default function AuditLogs() {
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['auditLogs'],
        queryFn: () => auditLogsApi.getAll(),
    });

    const getActionBadge = (action: string) => {
        if (action.includes('create')) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Création</Badge>;
        if (action.includes('update')) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Modification</Badge>;
        if (action.includes('delete')) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Suppression</Badge>;
        if (action.includes('status')) return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">Statut</Badge>;
        return <Badge variant="outline">{action}</Badge>;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Historique d'activité</h1>
                    <p className="text-muted-foreground">Suivi exhaustif des actions effectuées par les marchands et collaborateurs</p>
                </div>

                <Card className="border-none shadow-premium">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Derniers évènements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="py-20 text-center text-muted-foreground animate-pulse">
                                Chargement de l'historique...
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[180px]">Date</TableHead>
                                            <TableHead>Marchand (Shop ID)</TableHead>
                                            <TableHead>Utilisateur</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Ressource</TableHead>
                                            <TableHead className="text-right">Détails</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                    Aucun log trouvé
                                                </TableCell>
                                            </TableRow>
                                        ) : logs.map((log: any) => (
                                            <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-medium text-xs">
                                                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Store className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs font-mono">{log.admin_id.substring(0, 8)}...</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-sm font-medium">{log.user_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getActionBadge(log.action)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                                        {log.resource_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-xs max-w-[200px] truncate">
                                                    {log.details || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
