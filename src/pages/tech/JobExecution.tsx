import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, AlertTriangle, Camera, Check } from 'lucide-react';

export default function JobExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  
  // Step: 'detail' | 'capture' | 'confirmed'
  const [step, setStep] = useState<'detail' | 'capture' | 'confirmed'>('detail');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
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

  if (!job) return <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>;

  // Header Component (Shared across steps)
  const Header = ({ title, showBack = false }: { title: string, showBack?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
      {showBack && (
        <button onClick={() => step === 'capture' ? setStep('detail') : navigate('/tech/jobs')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginRight: '1rem' }}>
          <ArrowLeft size={20} />
        </button>
      )}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, flex: 1 }}>{title}</h2>
      {step === 'detail' && <span className="badge badge-blue">Installation</span>}
    </div>
  );

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '4rem' }}>
      
      {/* ==================================================== */}
      {/* STEP 1: JOB DETAIL (READ ONLY)                         */}
      {/* ==================================================== */}
      {step === 'detail' && (
        <>
          <Header title={`WO-${job.id?.substring(0, 4) || '2264'}`} showBack={true} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Pre-loaded from system • read only</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Customer</span>
              <span style={{ fontWeight: 500 }}>{job.customer_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Address</span>
              <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{job.physical_address}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Meter point</span>
              <span style={{ fontWeight: 500 }}>{job.meter_serial_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Municipality ref.</span>
              <span style={{ fontWeight: 500 }}>{job.account_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Scheduled</span>
              <span style={{ fontWeight: 500 }}>{formatTime(job.scheduled_date)}</span>
            </div>
          </div>

          <div style={{ background: 'var(--color-warning-bg)', borderLeft: '4px solid var(--color-warning)', padding: '1rem', borderRadius: '4px', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ color: 'var(--color-warning)', fontSize: '0.9rem', fontWeight: 500 }}>Old prepaid meter — confirm before removal</p>
          </div>

          <button className="btn btn-primary" onClick={() => setStep('capture')}>
            Start job
          </button>
        </>
      )}

      {/* ==================================================== */}
      {/* STEP 2: CAPTURE FORM                                 */}
      {/* ==================================================== */}
      {step === 'capture' && (
        <form onSubmit={handleSubmit}>
          <Header title={`Capture — WO-${job.id?.substring(0, 4) || '2264'}`} showBack={true} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Step 2 of 3 — new meter</p>

          <div className="input-group">
            <label>Old meter reading (kWh)</label>
            <input type="number" step="0.1" className="input-field" value={oldReading} onChange={e => setOldReading(e.target.value)} required />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label>Old meter photo</label>
            <label className="btn" style={{ 
              background: oldPhoto ? 'var(--color-success-hover)' : 'transparent', 
              border: oldPhoto ? 'none' : '1px solid var(--color-border)', 
              color: oldPhoto ? 'white' : 'var(--color-text-muted)',
              borderStyle: oldPhoto ? 'none' : 'dashed'
            }}>
              {oldPhoto ? <Check size={18} /> : <Camera size={18} />}
              {oldPhoto ? 'Photo captured' : 'Tap to photograph'}
              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => setOldPhoto(e.target.files?.[0] || null)} required />
            </label>
          </div>

          <div className="input-group">
            <label>New meter serial number</label>
            <input type="text" className="input-field" value={newSerial} onChange={e => setNewSerial(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>New meter reading (kWh)</label>
            <input type="number" step="0.1" className="input-field" value={newReading} onChange={e => setNewReading(e.target.value)} placeholder="0.00 · auto-filled" required />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label>New meter photo</label>
            <label className="btn" style={{ 
              background: newPhoto ? 'var(--color-success-hover)' : 'transparent', 
              border: newPhoto ? 'none' : '1px solid var(--color-border)', 
              color: newPhoto ? 'white' : 'var(--color-text-muted)',
              borderStyle: newPhoto ? 'none' : 'dashed'
            }}>
              {newPhoto ? <Check size={18} /> : <Camera size={18} />}
              {newPhoto ? 'Photo captured' : 'Tap to photograph'}
              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => setNewPhoto(e.target.files?.[0] || null)} required />
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Uploading Data...' : 'Submit — complete all fields'}
          </button>
        </form>
      )}

      {/* ==================================================== */}
      {/* STEP 3: CONFIRMED                                    */}
      {/* ==================================================== */}
      {step === 'confirmed' && (
        <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-success)', marginBottom: '1.5rem' }}>
            <Check size={32} color="white" />
          </div>
          
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Job submitted</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            WO-{job.id?.substring(0, 4)} • {job.customer_name}
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Synced to database • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>

          <div className="glass-panel" style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Old reading</span>
              <span style={{ fontWeight: 500 }}>{oldReading} kWh</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>New serial</span>
              <span style={{ fontWeight: 500 }}>{newSerial}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>New reading</span>
              <span style={{ fontWeight: 500 }}>{newReading} kWh</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Job card PDF</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>Generating...</span>
            </div>
          </div>

          <Link to="/tech/jobs" className="btn btn-outline" style={{ color: 'var(--color-success)', borderColor: 'var(--color-success-bg)' }}>
            View job card ↗
          </Link>
          
          <Link to="/tech/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Jobs
          </Link>
        </div>
      )}

    </div>
  );
}
