import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ClipboardList, Users, AlertTriangle, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  // Real stats from your DB
  const [stats, setStats] = useState({ pending: 0, completed: 0, exceptions: 0, total: 0 });
  const [activeTechs, setActiveTechs] = useState(0);
  const [avgCompletionTime, setAvgCompletionTime] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    // 1. Fetch Work Orders stats
    const { data: workOrders, error: woError } = await supabase.from('work_orders').select('status');
    if (!woError && workOrders) {
      let pending = 0, completed = 0, exceptions = 0;
      workOrders.forEach((o: any) => {
        if (o.status === 'pending') pending++;
        else if (o.status === 'completed') completed++;
        else exceptions++;
      });
      setStats({ pending, completed, exceptions, total: workOrders.length });
    }

    // 2. Fetch Active Technicians (Assuming you have a 'technicians' table with an 'is_online' boolean)
    const { data: techs, error: techError } = await supabase
      .from('technicians')
      .select('id')
      .eq('is_online', true);
    
    if (!techError && techs) {
      setActiveTechs(techs.length);
    }

    // 3. Fetch Avg Completion Time
    const { data: avgData, error: avgError } = await supabase
      .from('job_executions')
      .select('duration_minutes');
      
    if (!avgError && avgData && avgData.length > 0) {
      const totalDuration = avgData.reduce((sum, job) => sum + (job.duration_minutes || 0), 0);
      setAvgCompletionTime(Math.round(totalDuration / avgData.length));
    }

    // 4. Fetch Technician Leaderboard
    const { data: topTechs, error: leadError } = await supabase
      .from('technicians')
      .select('name, total_jobs, success_rate, avg_time')
      .order('total_jobs', { ascending: false })
      .limit(5);

    if (!leadError && topTechs) {
      setLeaderboard(topTechs);
    }

    // 5. Fetch Recent Jobs
    const { data: recent, error: recError } = await supabase
      .from('work_orders')
      .select('id, customer_name, assigned_technician, status, created_at')
      .order('created_at', { ascending: false })
      .limit(4);

    if (!recError && recent) {
      setRecentJobs(recent);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600' }}>Operational Intelligence Command Centre</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Real-time insights and analytics across all field operations</p>
        </div>
      </header>

      {/* 2. KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <StatCard title="Total Work Orders" value={stats.total.toLocaleString()} sub={`${stats.pending} pending`} icon={ClipboardList} color="var(--color-primary)" trend="up" />
        <StatCard title="Completed Jobs" value={stats.completed.toLocaleString()} sub={`${Math.round((stats.completed / (stats.total || 1)) * 100)}% completion rate`} icon={ClipboardList} color="#3b82f6" trend="neutral" />
        <StatCard title="Active Technicians" value={activeTechs.toString()} sub="Currently online" icon={Users} color="var(--color-success)" trend="neutral" />
        <StatCard title="Avg. Completion Time" value={`${avgCompletionTime} mins`} sub="Based on recent jobs" icon={BarChart3} color="var(--color-warning)" trend="down" />
        <StatCard title="Failed Jobs" value={stats.exceptions.toLocaleString()} sub="Requires attention" icon={AlertTriangle} color="var(--color-danger)" trend="up" />
      </div>

      {/* 3. Middle Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 3fr 3fr 2fr', gap: '16px', minHeight: '300px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500' }}>Work Order Trend</h3>
          </div>
          <svg width="100%" height="120" viewBox="0 0 300 120" preserveAspectRatio="none">
            <path d="M0,80 Q50,60 100,40 T200,50 T300,30" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
          </svg>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Job Outcome Distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center', height: '100px' }}>
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `conic-gradient(var(--color-success) 0% ${(stats.completed / (stats.total || 1)) * 100}%, var(--color-danger) ${(stats.completed / (stats.total || 1)) * 100}% 100%)`, position: 'relative', marginRight: '24px' }}>
                <div style={{ position: 'absolute', top: '25px', left: '25px', width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-card)' }}></div>
             </div>
             <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100px' }}><span style={{ color: 'var(--text-secondary)' }}>Completed</span><span>{Math.round((stats.completed / (stats.total || 1)) * 100)}%</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100px' }}><span style={{ color: 'var(--text-secondary)' }}>Failed</span><span>{Math.round((stats.exceptions / (stats.total || 1)) * 100)}%</span></div>
             </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Live Operations Map</h3>
          <div style={{ height: '140px', background: 'radial-gradient(circle at center, #1e263a 0%, #0a0e17 100%)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
             <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Map View</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><span style={{ color: '#8b5cf6' }}>✨</span> AI Insights</h3>
           <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>Analyzing performance metrics...</p>
           <button className="btn btn-outline" style={{ width: '100%', padding: '6px 0', fontSize: '12px', justifyContent: 'center' }}>View Full Report</button>
        </div>
      </div>

      {/* 4. Bottom Row: Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Technician Leaderboard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', color: 'var(--text-muted)', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
              <span>Technician</span><span style={{ textAlign: 'center' }}>Jobs</span><span style={{ textAlign: 'right' }}>Rate</span>
            </div>
            {leaderboard.length > 0 ? (
              leaderboard.map((tech, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>{i+1}</span>
                    {tech.name || `Tech ${i+1}`}
                  </span>
                  <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{tech.total_jobs || 0}</span>
                  <span style={{ textAlign: 'right', color: 'var(--color-success)' }}>{tech.success_rate || 98}%</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No technician data loaded.</p>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Recent Job Executions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', color: 'var(--text-muted)', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
              <span>Work Order</span><span>Customer</span><span style={{ textAlign: 'center' }}>Status</span>
            </div>
            {recentJobs.length > 0 ? (
              recentJobs.map((job, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr' }}>
                  <span style={{ color: '#3b82f6' }}>{job.id}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{job.customer_name}</span>
                  <span style={{ textAlign: 'center' }}>
                    <span style={{ background: job.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)', color: job.status === 'completed' ? 'var(--color-success)' : '#3b82f6', padding: '2px 8px', borderRadius: '99px', fontSize: '10px' }}>
                      {job.status || 'Pending'}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No recent jobs.</p>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Meter Replacements</h3>
          <div>
             <h4 style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.completed}</h4>
             <p style={{ fontSize: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>▲ {Math.round((stats.completed / (stats.total || 1)) * 100)}% <span style={{ color: 'var(--text-muted)' }}>completion rate</span></p>
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
