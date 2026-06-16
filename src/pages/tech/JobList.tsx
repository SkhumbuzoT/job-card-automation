import { useEffect, useState } from 'react';
import { MapPin, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function JobList() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('scheduled_date', { ascending: true });
      
      if (!error && data) {
        setJobs(data);
      }
    };
    fetchJobs();
  }, []);

  const outstanding = jobs.filter(j => j.status === 'pending');
  const completed = jobs.filter(j => j.status === 'completed');

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "TBD";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderJobCard = (job: any, isCompleted: boolean) => (
    <Link to={`/tech/jobs/${job.id}`} key={job.id} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{job.customer_name}</h3>
          <span className={`badge ${isCompleted ? 'badge-green' : 'badge-blue'}`}>
            {isCompleted ? 'Done' : 'Installation'}
          </span>
        </div>
        
        <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <MapPin size={14} />
          {job.physical_address || "Address not provided"}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          <span>{job.account_number}</span>
          <span>{job.scheduled_date ? formatTime(job.scheduled_date) : "Unscheduled"}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="animate-slide-up">
      {/* Header section matching mockup */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Good morning, Sipho</h2>
        <Bell size={20} color="var(--color-text-muted)" />
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        {jobs.length} jobs assigned today
      </p>

      {/* Summary Metrics */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#FBBF24' }}>{outstanding.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Outstanding</div>
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4ADE80' }}>{completed.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Completed today</div>
        </div>
      </div>

      {/* Outstanding List */}
      <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>
        Outstanding
      </h4>
      {outstanding.length === 0 && <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No outstanding jobs.</p>}
      {outstanding.map(j => renderJobCard(j, false))}

      {/* Completed List */}
      <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem', marginTop: '2rem', letterSpacing: '1px' }}>
        Completed
      </h4>
      {completed.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No completed jobs yet.</p>}
      {completed.map(j => renderJobCard(j, true))}
    </div>
  );
}
