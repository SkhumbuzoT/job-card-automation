// src/components/Layout.tsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, Users, BarChart3, 
  Map, Settings, Bell, LogOut, Wrench
} from 'lucide-react';

interface LayoutProps { role: 'admin' | 'tech'; }

function Layout({ role }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  // ----- ADMIN LAYOUT (With Sidebar) -----
  if (role === 'admin') {
    return (
      <div className="app-container">
        {/* SIDEBAR */}
        <aside style={{ 
          width: '240px', minHeight: '100vh', background: 'var(--bg-main)', 
          borderRight: '1px solid var(--border-color)', padding: '24px 16px', 
          display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>F</div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>FieldOps</h2>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Intelligence</p>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <NavItem icon={LayoutDashboard} label="Overview" to="/admin/dashboard" active={location.pathname.includes('/dashboard')} />
            <NavItem icon={ClipboardList} label="Work Orders" to="#" />
            <NavItem icon={Users} label="Technicians" to="#" />
            <NavItem icon={BarChart3} label="Analytics" to="#" />
            <NavItem icon={Map} label="Live Map" to="#" />
            <NavItem icon={Bell} label="Alerts" to="#" badge="6" />
            <NavItem icon={Settings} label="Settings" to="#" />
          </nav>

          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA (Offset to account for fixed sidebar) */}
        <main style={{ flex: 1, padding: '24px 32px', marginLeft: '240px', minHeight: '100vh' }}>
          <Outlet />
        </main>
      </div>
    );
  }

  // ----- TECH LAYOUT (Mobile style header/nav - from your original code) -----
  return (
    <div className="app-container">
      <main className="main-content tech-container" style={{ padding: '24px', width: '100%' }}>
        <Outlet />
      </main>
      <nav className="mobile-nav" style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)',
        display: 'flex', justifyContent: 'space-around', padding: '12px 0', zIndex: 10 
      }}>
        <Link to="/tech/jobs" className="mobile-link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '10px', textDecoration: 'none' }}>
          <LayoutDashboard size={20} />
          <span>Jobs</span>
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '10px' }}>
          <Wrench size={20} />
          <span>My Stats</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '10px' }} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
}

// Helper for sidebar items
function NavItem({ icon: Icon, label, to, active, badge }: any) {
  return (
    <Link to={to} style={{ 
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', 
      borderRadius: '8px', textDecoration: 'none', color: active ? '#fff' : 'var(--text-secondary)',
      background: active ? 'var(--color-primary)' : 'transparent',
      transition: '0.2s'
    }}>
      <Icon size={18} />
      <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
      {badge && <span style={{ marginLeft: 'auto', background: 'var(--color-danger)', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '99px' }}>{badge}</span>}
    </Link>
  );
}

export default Layout;
