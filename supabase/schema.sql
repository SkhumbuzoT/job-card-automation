-- Create Work Orders table
CREATE TABLE work_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  physical_address TEXT,
  meter_serial_number TEXT,
  scheduled_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cut_off', 'refused', 'not_found')),
  technician_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Job Executions table (Field capture data)
CREATE TABLE job_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES auth.users(id),
  old_meter_reading DECIMAL,
  new_meter_reading DECIMAL,
  new_meter_serial TEXT,
  old_meter_photo_url TEXT,
  new_meter_photo_url TEXT,
  job_outcome TEXT NOT NULL,
  technician_notes TEXT,
  gps_lat DECIMAL,
  gps_lng DECIMAL,
  completion_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(work_order_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_executions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow authenticated full access to work_orders" ON work_orders;
DROP POLICY IF EXISTS "Allow public full access to work_orders" ON work_orders;
DROP POLICY IF EXISTS "Allow anon full access to work_orders" ON work_orders;

DROP POLICY IF EXISTS "Allow authenticated full access to job_executions" ON job_executions;
DROP POLICY IF EXISTS "Allow public full access to job_executions" ON job_executions;
DROP POLICY IF EXISTS "Allow anon full access to job_executions" ON job_executions;

-- Explicitly allow anon role (unauthenticated users)
CREATE POLICY "Allow anon full access to work_orders" ON work_orders
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon full access to job_executions" ON job_executions
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meter_photos', 'meter_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Allow authenticated uploads to meter_photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon uploads to meter_photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to meter_photos" ON storage.objects;

CREATE POLICY "Allow anon uploads to meter_photos" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'meter_photos');

CREATE POLICY "Allow public read access to meter_photos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'meter_photos');
