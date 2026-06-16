import { useEffect, useState } from 'react';
import { MapPin, Bell, CheckCircle, Clock } from 'lucide-react';
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
            {isCompleted ? 'Completed' : 'Installation'}
          </span>
        </div>
        
        <div className="job-card-address">
          <MapPin size={14} />
          <span>{job.physical_address || "Address not provided"}</span>
        </div>

        <div className="job-card-footer">
          <span className="job-card-meta">{job.account_number}</span>
          <span className="job-card-time">{job.scheduled_date ? formatTime(job.scheduled_date) : "Unscheduled"}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="job-list-container">
      {/* Header */}
      <div className="job-list-header">
        <div>
          <h2 className="job-list-greeting">Good morning, Sipho</h2>
          <p className="job-list-subtitle">{jobs.length} jobs assigned today</p>
        </div>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={20} />
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-value outstanding-value">{outstanding.length}</div>
          <div className="metric-label">Outstanding</div>
        </div>
        <div className="metric-card">
          <div className="metric-value completed-value">{completed.length}</div>
          <div className="metric-label">Completed today</div>
        </div>
      </div>

      {/* Outstanding Section */}
      <div className="jobs-section">
        <div className="section-header">
          <Clock size={16} />
          <h4>Outstanding</h4>
        </div>
        {outstanding.length === 0 && (
          <div className="empty-state">No outstanding jobs.</div>
        )}
        {outstanding.map(j => renderJobCard(j, false))}
      </div>

      {/* Completed Section */}
      <div className="jobs-section">
        <div className="section-header">
          <CheckCircle size={16} />
          <h4>Completed</h4>
        </div>
        {completed.length === 0 && (
          <div className="empty-state">No completed jobs yet.</div>
        )}
        {completed.map(j => renderJobCard(j, true))}
      </div>
    </div>
  );
}
