'use client';
import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

function genRevChart(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      revenue: Math.floor(Math.random() * 20000) + 5000,
      bookings: Math.floor(Math.random() * 30) + 5,
    };
  });
}

const TOP_WORKERS = [
  { name: 'Suresh Kumar', jobs: 48, rating: 4.9 },
  { name: 'Ramesh Das', jobs: 42, rating: 4.8 },
  { name: 'Bikash Panda', jobs: 39, rating: 4.7 },
  { name: 'Tapas Jena', jobs: 35, rating: 4.8 },
  { name: 'Sanjay Nayak', jobs: 31, rating: 4.6 },
];
const TOP_CUSTOMERS = [
  { name: 'Arjun Sharma', spend: 28400, bookings: 12 },
  { name: 'Priya Patel', spend: 22100, bookings: 9 },
  { name: 'Rahul Nayak', spend: 18900, bookings: 8 },
  { name: 'Sunita Mishra', spend: 15700, bookings: 7 },
  { name: 'Deepak Das', spend: 12300, bookings: 6 },
];
const TOP_SERVICES = [
  { name: 'Plumbing', count: 420, color: '#3b82f6' },
  { name: 'Electrical', count: 380, color: '#8b5cf6' },
  { name: 'Cleaning', count: 320, color: '#10b981' },
  { name: 'Carpentry', count: 200, color: '#f59e0b' },
  { name: 'AC Repair', count: 180, color: '#ef4444' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('30');
  const [chartData, setChartData] = useState(genRevChart(30));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setChartData(genRevChart(+period));
  }, [period]);

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = chartData.reduce((s, d) => s + d.bookings, 0);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          {[['7', '7 Days'], ['30', '30 Days'], ['90', '90 Days']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === v ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-slate-500">Total Revenue: <strong className="text-slate-800">{formatCurrency(totalRevenue)}</strong></span>
          <span className="text-slate-500">Total Bookings: <strong className="text-slate-800">{totalBookings}</strong></span>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <span className="text-sm font-bold text-blue-600">{formatCurrency(totalRevenue)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={+period === 7 ? 0 : 4} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bookings & Services row */}
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Daily Bookings</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.slice(-14)} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Services</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={TOP_SERVICES} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                  dataKey="count" nameKey="name" paddingAngle={2}>
                  {TOP_SERVICES.map(s => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Workers & Customers */}
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Top Workers</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {TOP_WORKERS.map((w, i) => (
                <div key={w.name} className="flex items-center gap-3 px-6 py-3">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">#{i + 1}</span>
                  <Avatar name={w.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{w.name}</p>
                    <p className="text-xs text-slate-400">{w.jobs} jobs · ⭐ {w.rating}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(w.jobs / TOP_WORKERS[0].jobs) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {TOP_CUSTOMERS.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 px-6 py-3">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">#{i + 1}</span>
                  <Avatar name={c.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.bookings} bookings</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(c.spend)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
