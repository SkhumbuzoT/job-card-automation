// pages/admin/Dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, ChevronDown, Users, ClipboardList, AlertTriangle, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ pending: 0, completed: 0, exceptions: 0, total: 0 });
  
  // Fetch basic stats from Supabase
  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase.from('work_orders').select('status');
      if (!error && data) {
        let pending = 0, completed = 0, exceptions = 0;
        data.forEach((o: any) => {
          if (o.status === 'pending') pending++;
          else if (o.status === 'completed') completed++;
          else exceptions++;
        });
        setStats({ pending, completed, exceptions, total: data.length });
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600' }}>Operational Intelligence Command Centre</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Real-time insights and analytics across all field operations</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Search...</span>
          </div>
        </div>
      </header>

      {/* 2. KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <StatCard title="Total Work Orders" value={stats.total.toLocaleString()} sub="8.6% vs last month" icon={ClipboardList} color="var(--color-primary)" trend="up" />
        <StatCard title="Completed Jobs" value={stats.completed.toLocaleString()} sub="87.5% completion rate" icon={ClipboardList} color="#3b82f6" trend="neutral" />
        <StatCard title="Active Technicians" value="24" sub="Currently online" icon={Users} color="var(--color-success)" trend="neutral" />
        <StatCard title="Avg. Completion Time" value="42 mins" sub="12% vs last month" icon={BarChart3} color="var(--color-warning)" trend="down" />
        <StatCard title="Failed Jobs" value={stats.exceptions.toLocaleString()} sub="Requires attention" icon={AlertTriangle} color="var(--color-danger)" trend="up" />
      </div>

      {/* 3. Middle Grid: Charts & Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 3fr 3fr 2fr', gap: '16px', minHeight: '300px' }}>
        {/* Work Order Trend (Chart Placeholder) */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500' }}>Work Order Trend</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>This week <ChevronDown size={14} /></span>
          </div>
          {/* Simulated Curved Chart using SVG */}
          <svg width="100%" height="120" viewBox="0 0 300 120" preserveAspectRatio="none">
            <path d="M0,80 Q50,60 100,40 T200,50 T300,30" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
            <path d="M0,100 Q50,80 100,90 T200,80 T300,60" fill="none" stroke="#3b82f6" strokeWidth="2" />
          </svg>
          <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></div> Created</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div> Assigned</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></div> Completed</span>
          </div>
        </div>

        {/* Job Outcome Distribution (Donut Placeholder) */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Job Outcome Distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center', height: '100px' }}>
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'conic-gradient(var(--color-success) 0% 62%, var(--color-warning) 62% 80%, var(--color-danger) 80% 92%, #8b5cf6 92% 100%)', position: 'relative', marginRight: '24px' }}>
                <div style={{ position: 'absolute', top: '25px', left: '25px', width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-card)' }}></div>
             </div>
             <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100px' }}><span style={{ color: 'var(--text-secondary)' }}>Successful</span><span>62%</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100px' }}><span style={{ color: 'var(--text-secondary)' }}>Meter Replaced</span><span>18%</span></div>
             </div>
          </div>
        </div>

        {/* Live Operations Map (Placeholder) */}
        <div className="glass-panel" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Live Operations Map</h3>
          <div style={{ height: '140px', background: 'radial-gradient(circle at center, #1e263a 0%, #0a0e17 100%)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
             <div style={{ width: '4px', height: '4px', background: 'var(--color-success)', borderRadius: '50%', boxShadow: '0 0 10px var(--color-success)', position: 'absolute', top: '30px', left: '30px' }}></div>
             <div style={{ width: '4px', height: '4px', background: 'var(--color-danger)', borderRadius: '50%', boxShadow: '0 0 10px var(--color-danger)', position: 'absolute', bottom: '40px', right: '40px' }}></div>
             <div style={{ width: '4px', height: '4px', background: 'var(--color-warning)', borderRadius: '50%', boxShadow: '0 0 10px var(--color-warning)', position: 'absolute', top: '50px', right: '60px' }}></div>
             <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Map View</span>
          </div>
        </div>

        {/* AI Insights */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><span style={{ color: '#8b5cf6' }}>✨</span> AI Insights</h3>
           <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>Johannesburg South region is underperforming with 17% lower completion rate.</p>
           <div style={{ background: 'var(--bg-card-hover)', padding: '8px', borderRadius: '6px', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: '500' }}>Recommendation:</p>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Assign 2 additional technicians to this region.</p>
           </div>
           <button className="btn btn-outline" style={{ width: '100%', padding: '6px 0', fontSize: '12px', justifyContent: 'center' }}>View Full Report</button>
        </div>
      </div>

      {/* 4. Bottom Row: Tables & Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {/* Leaderboard */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Technician Leaderboard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', color: 'var(--text-muted)', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
              <span>Technician</span><span style={{ textAlign: 'center' }}>Jobs</span><span style={{ textAlign: 'right' }}>Rate</span>
            </div>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>{i}</span>
                  Technician {i}
                </span>
                <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{80 - i*5}</span>
                <span style={{ textAlign: 'right', color: 'var(--color-success)' }}>98%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Executions */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Recent Job Executions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', color: 'var(--text-muted)', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
              <span>Work Order</span><span>Customer</span><span style={{ textAlign: 'center' }}>Status</span>
            </div>
            {[1,2,3,4].map((i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr' }}>
                <span style={{ color: '#3b82f6' }}>WO-{12450 + i}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Customer {i}</span>
                <span style={{ textAlign: 'center' }}>
                  <span style={{ background: i % 2 === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)', color: i % 2 === 0 ? 'var(--color-success)' : '#3b82f6', padding: '2px 8px', borderRadius: '99px', fontSize: '10px' }}>
                    {i % 2 === 0 ? 'Completed' : 'In Progress'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Forecasting / Stats */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Meter Replacements</h3>
          <div>
             <h4 style={{ fontSize: '28px', fontWeight: 'bold' }}>1,248</h4>
             <p style={{ fontSize: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>▲ 14.6% <span style={{ color: 'var(--text-muted)' }}>vs last month</span></p>
          </div>
          {/* Simple Bar Chart SVG */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px', marginTop: '12px' }}>
             {[40, 60, 30, 80, 50, 45, 70, 40, 90, 60, 40, 20].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--color-primary)', borderRadius: '4px 4px 0 0', opacity: 0.7 }}></div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Component for KPI Cards ---
function StatCard({ title, value, sub, icon: Icon, color, trend }: any) {
  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{title}</p>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</h3>
          <p style={{ fontSize: '10px', color: trend === 'up' ? 'var(--color-success)' : trend === 'down' ? 'var(--color-danger)' : 'var(--text-muted)' }}>
             {sub}
          </p>
        </div>
        <div style={{ background: `${color}20`, padding: '8px', borderRadius: '8px', color: color }}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
