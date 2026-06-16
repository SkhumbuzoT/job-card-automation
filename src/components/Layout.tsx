import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, LogOut } from 'lucide-react';

interface LayoutProps {
  role: 'admin' | 'tech';
}

export default function Layout({ role }: LayoutProps) {
  const location = useLocation();

  return (
    <div className={`app-container ${role === 'tech' ? 'tech-theme' : ''}`}>
      {role === 'admin' ? (
        <>
          <nav className="glass-panel" style={{ borderRadius: 0, borderBottom: 'var(--glass-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>Prime Chain Admin</h1>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/admin/dashboard" className={`btn ${location.pathname.includes('/admin/dashboard') ? 'btn-primary' : 'btn-outline'}`}>
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
              </div>
            </div>
            <button className="btn btn-outline" style={{ color: 'var(--color-text-muted)' }}>
              <LogOut size={18} />
              Sign Out
            </button>
          </nav>
          <main className="main-content animate-fade-in">
            <Outlet />
          </main>
        </>
      ) : (
        <>
          <main className="main-content animate-fade-in" style={{ paddingBottom: '80px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </main>
          {/* Mobile Bottom Nav */}
          <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#1C1C1E', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'space-around', padding: '0.75rem 0', zIndex: 50 }}>
            <Link to="/tech/jobs" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: location.pathname.includes('/tech/jobs') ? 'white' : '#9CA3AF', textDecoration: 'none', gap: '4px' }}>
              <LayoutDashboard size={20} />
              <span style={{ fontSize: '0.7rem' }}>Jobs</span>
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9CA3AF', gap: '4px' }}>
              <Wrench size={20} />
              <span style={{ fontSize: '0.7rem' }}>My stats</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9CA3AF', gap: '4px' }}>
              <LogOut size={20} />
              <span style={{ fontSize: '0.7rem' }}>Profile</span>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
