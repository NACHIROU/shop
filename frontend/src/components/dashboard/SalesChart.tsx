import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, formatCurrency } from '@/services/api';
import { DailyStats } from '@/types';

export function SalesChart() {
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    api.stats.getWeekly().then(setWeeklyStats);
  }, []);

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Flux financiers de la semaine</h3>
        <p className="text-sm text-muted-foreground">Ventes vs Achats (7 derniers jours)</p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="purchasesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(16, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(16, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                boxShadow: 'var(--shadow-lg)',
              }}
              formatter={(value: number, name: string) => [formatCurrency(value), name === 'sales' ? 'Ventes' : 'Achats']}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              fill="url(#salesGradient)"
              name="sales"
            />
            <Area
              type="monotone"
              dataKey="purchases"
              stroke="hsl(16, 100%, 50%)"
              strokeWidth={2}
              fill="url(#purchasesGradient)"
              name="purchases"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
