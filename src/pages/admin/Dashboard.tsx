import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { generateJobCard } from '../../lib/pdfGenerator';
import { Download } from 'lucide-react';

export default function Dashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, exceptions: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchWorkOrders = async () => {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching data", error);
    } else if (data) {
      setWorkOrders(data);
      
      // Calculate Stats
      let pending = 0;
      let completed = 0;
      let exceptions = 0;
      
      data.forEach(order => {
        if (order.status === 'pending') pending++;
        else if (order.status === 'completed') completed++;
        else exceptions++;
      });
      
      setStats({ pending, completed, exceptions });
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet) as any[];

      const formattedOrders = rows.map(row => {
        // Construct address
        const addressParts = [];
        if (row["House No"]) addressParts.push(String(row["House No"]).trim());
        if (row["Street"]) addressParts.push(String(row["Street"]).trim());
        if (row["Complex"]) addressParts.push(String(row["Complex"]).trim());
        if (row["City"]) addressParts.push(String(row["City"]).trim());

        // Parse DD/MM/YYYY date
        let isoDate = null;
        if (row["Installation Date"]) {
          const dStr = String(row["Installation Date"]);
          const parts = dStr.split('/');
          if (parts.length === 3) {
            const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
            if (!isNaN(parsed.getTime())) isoDate = parsed.toISOString();
          } else {
            const parsed = new Date(dStr);
            if (!isNaN(parsed.getTime())) isoDate = parsed.toISOString();
          }
        }

        return {
          customer_name: String(row["Customer Name"] || "Unknown Customer"),
          account_number: String(row["Contract Account"] || "").split('.')[0],
          physical_address: addressParts.join(" "),
          meter_serial_number: String(row["Device"] || ""),
          scheduled_date: isoDate,
          status: 'pending'
        };
      }).filter(order => order.account_number && order.account_number !== "undefined");

      if (formattedOrders.length > 0) {
        const { error } = await supabase.from('work_orders').insert(formattedOrders);
        if (error) throw error;
        alert(`Successfully uploaded ${formattedOrders.length} work orders!`);
        fetchWorkOrders();
      } else {
        alert("No valid rows found in spreadsheet.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error parsing or uploading file: " + (err.message || JSON.stringify(err)));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadPDF = async (order: any) => {
    // Fetch execution data
    const { data: execData, error } = await supabase
      .from('job_executions')
      .select('*')
      .eq('work_order_id', order.id)
      .single();
      
    if (error) {
      console.error("Could not fetch execution details", error);
      alert("Could not fetch field execution details for this job.");
      return;
    }
    
    await generateJobCard(order, execData);
  };

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Operations Dashboard</h2>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          style={{ display: 'none' }} 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button 
          className="btn btn-primary" 
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Work Orders"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-warning)' }}>
          <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Pending Jobs</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.pending}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-success)' }}>
          <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Completed Today</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--color-success)' }}>{stats.completed}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-danger)' }}>
          <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Exceptions / Missed SLA</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--color-danger)' }}>{stats.exceptions}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Recent Work Orders</h3>
          <button className="btn btn-outline" onClick={fetchWorkOrders}>Refresh Data</button>
        </div>
        
        {workOrders.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No work orders loaded yet. Upload an Excel file to get started.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '0.75rem 0' }}>Account</th>
                  <th style={{ padding: '0.75rem 0' }}>Address</th>
                  <th style={{ padding: '0.75rem 0' }}>Meter Serial</th>
                  <th style={{ padding: '0.75rem 0' }}>Status</th>
                  <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.slice(0, 20).map((order, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                    <td style={{ padding: '0.75rem 0', fontWeight: '500' }}>{order.account_number}</td>
                    <td style={{ padding: '0.75rem 0' }}>{order.customer_name}</td>
                    <td style={{ padding: '0.75rem 0' }}>{order.meter_serial_number}</td>
                    <td style={{ padding: '0.75rem 0' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem',
                        backgroundColor: order.status === 'pending' ? 'var(--color-warning)' : (order.status === 'completed' ? 'var(--color-success)' : 'var(--color-danger)'),
                        color: 'white'
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                      {order.status === 'completed' && (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleDownloadPDF(order)}
                        >
                          <Download size={14} /> PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
