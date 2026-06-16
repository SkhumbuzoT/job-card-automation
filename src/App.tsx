import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import TechJobList from './pages/tech/JobList';
import JobExecution from './pages/tech/JobExecution';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tech/jobs" replace />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<Layout role="admin" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Tech Routes */}
      <Route path="/tech" element={<Layout role="tech" />}>
        <Route index element={<Navigate to="jobs" replace />} />
        <Route path="jobs" element={<TechJobList />} />
        <Route path="jobs/:id" element={<JobExecution />} />
      </Route>
    </Routes>
  );
}

export default App;
