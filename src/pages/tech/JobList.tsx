import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, AlertTriangle, Camera, Check, ClipboardList, Image, Wrench } from 'lucide-react';

export default function JobExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  
  const [step, setStep] = useState<'detail' | 'capture' | 'confirmed'>('detail');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [oldReading, setOldReading] = useState('');
  const [newReading, setNewReading] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [oldPhoto, setOldPhoto] = useState<File | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase.from('work_orders').select('*').eq('id', id).single();
      if (data) setJob(data);
    };
    fetchJob();
  }, [id]);

  const handlePhotoUpload = async (file: File, prefix: string) => {
    const fileName = `${prefix}_${id}_${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('meter_photos').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('meter_photos').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let oldPhotoUrl = '';
      let newPhotoUrl = '';
      if (oldPhoto) oldPhotoUrl = await handlePhotoUpload(oldPhoto, 'old_meter');
      if (newPhoto) newPhotoUrl = await handlePhotoUpload(newPhoto, 'new_meter');

      const { error: execError } = await supabase.from('job_executions').insert([{
        work_order_id: id,
        old_meter_reading: oldReading ? parseFloat(oldReading) : null,
        new_meter_reading: newReading ? parseFloat(newReading) : null,
        new_meter_serial: newSerial,
        old_meter_photo_url: oldPhotoUrl,
        new_meter_photo_url: newPhotoUrl,
        job_outcome: 'completed',
      }]);
      if (execError) throw execError;

      const { error: updateError } = await supabase.from('work_orders')
        .update({ status: 'completed' })
        .eq('id', id);
      if (updateError) throw updateError;

      setStep('confirmed');
    } catch (err: any) {
      alert('Error submitting job: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "TBD";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' • ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!job) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading job details...</p>
    </div>
  );

  const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: string[] }) => (
    <div className="step-indicator">
      {steps.map((label, idx) => (
        <div key={idx} className={`step ${idx === currentStep ? 'active' : idx < currentStep ? 'completed' : ''}`}>
          <div className="step-circle">
            {idx < currentStep ? <Check size={14} /> : idx + 1}
          </div>
          <span className="step-label">{label}</span>
          {idx < steps.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="job-execution-container">
      {/* Header */}
      <div className="execution-header">
        <button 
          onClick={() => step === 'capture' ? setStep('detail') : navigate('/tech/jobs')} 
          className="back-button"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="execution-title">
          <h2>Work Order</h2>
          <p className="execution-id">WO-{job.id?.substring(0, 6) || '2264'}</p>
        </div>
        <div className="header-spacer" />
      </div>

      {/* Step 1: Job Details */}
      {step === 'detail' && (
        <div className="execution-step">
          <StepIndicator currentStep={0} steps={['Details', 'Capture', 'Confirm']} />
          
          <div className="info-banner">
            <p>Pre‑loaded from system • read only</p>
          </div>

          <div className="details-grid">
            <div className="detail-row">
              <span className="detail-label">Customer</span>
              <span className="detail-value">{job.customer_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Address</span>
              <span className="detail-value">{job.physical_address}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Meter point</span>
              <span className="detail-value">{job.meter_serial_number}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Municipality ref.</span>
              <span className="detail-value">{job.account_number}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Scheduled</span>
              <span className="detail-value">{formatTime(job.scheduled_date)}</span>
            </div>
          </div>

          <div className="warning-card">
            <AlertTriangle size={18} />
            <p>Old prepaid meter — confirm before removal</p>
          </div>

          <button className="btn-primary" onClick={() => setStep('capture')}>
            <Wrench size={16} />
            Start Installation
          </button>
        </div>
      )}

      {/* Step 2: Capture Form */}
      {step === 'capture' && (
        <form onSubmit={handleSubmit} className="execution-step">
          <StepIndicator currentStep={1} steps={['Details', 'Capture', 'Confirm']} />
          
          <div className="form-section">
            <div className="input-group">
              <label>Old meter reading (kWh)</label>
              <input 
                type="number" 
                step="0.1" 
                className="input-field" 
                value={oldReading} 
                onChange={e => setOldReading(e.target.value)} 
                required 
                placeholder="0.0"
              />
            </div>

            <div className="photo-upload-group">
              <label>Old meter photo</label>
              <button 
                type="button"
                className={`photo-button ${oldPhoto ? 'photo-captured' : ''}`}
                onClick={() => document.getElementById('old-photo-input')?.click()}
              >
                {oldPhoto ? <Check size={18} /> : <Camera size={18} />}
                {oldPhoto ? 'Photo captured' : 'Tap to photograph'}
              </button>
              <input 
                id="old-photo-input"
                type="file" 
                accept="image/*" 
                capture="environment" 
                style={{ display: 'none' }} 
                onChange={e => setOldPhoto(e.target.files?.[0] || null)} 
                required 
              />
            </div>

            <div className="input-group">
              <label>New meter serial number</label>
              <input 
                type="text" 
                className="input-field" 
                value={newSerial} 
                onChange={e => setNewSerial(e.target.value)} 
                required 
                placeholder="e.g. 24A6789"
              />
            </div>

            <div className="input-group">
              <label>New meter reading (kWh)</label>
              <input 
                type="number" 
                step="0.1" 
                className="input-field" 
                value={newReading} 
                onChange={e => setNewReading(e.target.value)} 
                required 
                placeholder="0.00 (auto-filled after photo)"
              />
            </div>

            <div className="photo-upload-group">
              <label>New meter photo</label>
              <button 
                type="button"
                className={`photo-button ${newPhoto ? 'photo-captured' : ''}`}
                onClick={() => document.getElementById('new-photo-input')?.click()}
              >
                {newPhoto ? <Check size={18} /> : <Camera size={18} />}
                {newPhoto ? 'Photo captured' : 'Tap to photograph'}
              </button>
              <input 
                id="new-photo-input"
                type="file" 
                accept="image/*" 
                capture="environment" 
                style={{ display: 'none' }} 
                onChange={e => setNewPhoto(e.target.files?.[0] || null)} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Submit & Complete Job'}
          </button>
        </form>
      )}

      {/* Step 3: Confirmed */}
      {step === 'confirmed' && (
        <div className="confirmation-step">
          <div className="confirmation-icon">
            <Check size={32} />
          </div>
          
          <h2>Job submitted</h2>
          <p className="confirmation-subtitle">
            WO-{job.id?.substring(0, 4)} • {job.customer_name}
          </p>
          <p className="confirmation-time">
            Synced to database • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>

          <div className="summary-card">
            <h4>Job Summary</h4>
            <div className="summary-row">
              <span>Old reading</span>
              <span>{oldReading} kWh</span>
            </div>
            <div className="summary-row">
              <span>New serial</span>
              <span>{newSerial}</span>
            </div>
            <div className="summary-row">
              <span>New reading</span>
              <span>{newReading} kWh</span>
            </div>
            <div className="summary-row">
              <span>Job card PDF</span>
              <span className="pdf-status">Generating...</span>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/tech/jobs" className="btn-outline">
              View Job Card ↗
            </Link>
            <Link to="/tech/jobs" className="btn-primary">
              Back to Jobs
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
