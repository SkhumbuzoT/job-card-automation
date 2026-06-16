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
    <Link to={`/tech/jobs/${job.id}`} key={job.id} className="job-card-link">
      <div className={`job-card ${isCompleted ? 'job-card-completed' : ''}`}>
        <div className="job-card-header">
          <h3 className="job-card-title">{job.customer_name}</h3>
          <span className={`status-badge ${isCompleted ? 'status-badge-completed' : 'status-badge-pending'}`}>
            {isCompleted ? 'Done' : 'Installation'}
          </span>
        </div>
        
        <p className="job-card-address">
          <MapPin size={14} />
          {job.physical_address}
        </p>
        
        <div className="job-card-footer">
          <span>WO-{job.id?.substring(0, 4) || '2264'}</span>
          <span>{formatTime(job.scheduled_date)}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="job-list-container">
      <div className="job-list-header">
        <div>
          <h1 className="job-list-greeting">Good morning, Sipho</h1>
          <p className="job-list-subtitle">Here's your schedule for today</p>
        </div>
        <button className="icon-button">
          <Bell size={20} color="var(--color-gray-600)" />
        </button>
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-value outstanding-value">{outstanding.length}</div>
          <div className="metric-label">Outstanding</div>
        </div>
        <div className="metric-card">
          <div className="metric-value completed-value">{completed.length}</div>
          <div className="metric-label">Completed</div>
        </div>
      </div>

      <div className="jobs-section">
        <div className="section-header">
          <h4>OUTSTANDING</h4>
          <span>({outstanding.length})</span>
        </div>
        {outstanding.length > 0 ? outstanding.map(job => renderJobCard(job, false)) : (
          <div className="empty-state">No outstanding jobs</div>
        )}
      </div>

      <div className="jobs-section">
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <h4>COMPLETED</h4>
          <span>({completed.length})</span>
        </div>
        {completed.length > 0 ? completed.map(job => renderJobCard(job, true)) : (
          <div className="empty-state">No completed jobs yet</div>
        )}
      </div>
    </div>
  );
}
