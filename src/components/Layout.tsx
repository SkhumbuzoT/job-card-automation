import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  role: 'admin' | 'tech';
}

function Layout({ role }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="app-container">
      {role === 'admin' ? (
        <>
          {/* Admin Navigation */}
          <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: 'white',
            borderBottom: '1px solid var(--color-border)',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Prime Chain Control Tower</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Operations Intelligence Platform</p>
              </div>
              <Link
                to="/admin/dashboard"
                className={
                  location.pathname.includes('/admin/dashboard')
                    ? 'btn btn-primary'
                    : 'btn btn-outline'
                }
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            </div>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={18} />
              Sign Out
            </button>
          </nav>
          
          <main className="main-content">
            <Outlet />
          </main>
        </>
      ) : (
        <>
          {/* Tech View */}
          <main style={{
            padding: '32px',
            width: '100%',
            paddingBottom: '100px' // Space for mobile nav
          }}>
            <Outlet />
          </main>
          
          {/* Mobile Navigation */}
          <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '0.75rem 0',
            zIndex: 100
          }}>
            <Link
              to="/tech/jobs"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: location.pathname.includes('/tech/jobs') ? 'var(--color-primary)' : 'var(--color-text-muted)',
                textDecoration: 'none',
                fontSize: '0.75rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <LayoutDashboard size={20} />
              <span>Jobs</span>
            </Link>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <Wrench size={20} />
              <span>My Stats</span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <LogOut size={20} />
              <span>Profile</span>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

export default Layout;
