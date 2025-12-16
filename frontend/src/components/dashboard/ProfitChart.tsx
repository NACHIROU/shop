import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, formatCurrency } from '@/services/api';
import { DailyStats } from '@/types';

export function ProfitChart() {
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    api.stats.getWeekly().then(setWeeklyStats);
  }, []);

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Profits de la semaine</h3>
        <p className="text-sm text-muted-foreground">Bénéfices par jour</p>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              formatter={(value: number) => [formatCurrency(value), 'Profit']}
            />
            <Bar 
              dataKey="profit" 
              fill="hsl(142, 71%, 45%)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
