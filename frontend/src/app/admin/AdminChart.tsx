'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
  name: string;
  revenue: number;
  bookings: number;
}

interface AdminChartProps {
  data: ChartDataItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 backdrop-blur-md">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs font-bold my-1">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name === 'revenue' ? "Chiffre d'Affaires" : 'Réservations'} :
            </span>
            <span className="font-black">
              {entry.name === 'revenue' 
                ? `${Number(entry.value).toLocaleString('fr-DZ')} DA`
                : `${entry.value} réservation(s)`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminChart({ data }: AdminChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'bookings' | 'both'>('both');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-[320px] bg-slate-50/50 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="w-full flex flex-col h-full">
      {/* Chart Metric Selector Header */}
      <div className="flex items-center justify-end mb-4 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveMetric('both')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
            activeMetric === 'both'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Vue Globale
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('revenue')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
            activeMetric === 'revenue'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Revenus (DA)
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('bookings')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
            activeMetric === 'bookings'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Réservations
        </button>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
              dy={10} 
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
              dx={-5} 
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : `${val}`} 
            />
            {activeMetric === 'both' && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#10b981', fontSize: 11, fontWeight: 700 }} 
                dx={5} 
              />
            )}
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
            <Tooltip content={<CustomTooltip />} />
            
            {(activeMetric === 'revenue' || activeMetric === 'both') && (
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                name="revenue"
                stroke="#4f46e5" 
                strokeWidth={3.5} 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 7, strokeWidth: 0, fill: '#4f46e5' }} 
              />
            )}
            
            {(activeMetric === 'bookings' || activeMetric === 'both') && (
              <Area 
                yAxisId={activeMetric === 'both' ? 'right' : 'left'}
                type="monotone" 
                dataKey="bookings" 
                name="bookings"
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorBookings)" 
                activeDot={{ r: 7, strokeWidth: 0, fill: '#10b981' }} 
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
