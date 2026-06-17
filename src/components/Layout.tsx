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

    <div className={`app-container ${role === 'tech' ? 'tech-theme' : ''}`}>

      {role === 'admin' ? (

        <>

          <nav
            className="glass-panel"
            style={{
              height: '72px',
              padding: '0 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px'
              }}
            >

              <div>

                <h2>

                  Prime Chain Control Tower

                </h2>

                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-muted)'
                  }}
                >

                  Operations Intelligence Platform

                </p>

              </div>

              <Link

                to="/admin/dashboard"

                className={
                  location.pathname.includes('/admin/dashboard')
                    ? 'btn btn-primary'
                    : 'btn btn-outline'
                }

              >

                <LayoutDashboard size={18} />

                Dashboard

              </Link>

            </div>

            <button className="btn btn-outline">

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

          <main

            className="main-content animate-fade-in"

            style={{

              paddingBottom: '90px',

              maxWidth: '700px',

              margin: '0 auto',

              width: '100%'

            }}

          >

            <Outlet />

          </main>

          <nav

            style={{

              position: 'fixed',

              bottom: 0,

              left: 0,

              right: 0,

              background: '#0F172A',

              borderTop: '1px solid #1E293B',

              display: 'flex',

              justifyContent: 'space-around',

              padding: '12px 0',

              zIndex: 100

            }}

          >

            <Link

              to="/tech/jobs"

              style={{

                display: 'flex',

                flexDirection: 'column',

                alignItems: 'center',

                gap: '4px',

                textDecoration: 'none',

                color: location.pathname.includes('/tech/jobs')

                  ? '#FFFFFF'

                  : '#94A3B8'

              }}

            >

              <LayoutDashboard size={20} />

              <span style={{ fontSize: '12px' }}>

                Jobs

              </span>

            </Link>

            <div

              style={{

                display: 'flex',

                flexDirection: 'column',

                alignItems: 'center',

                gap: '4px',

                color: '#94A3B8'

              }}

            >

              <Wrench size={20} />

              <span style={{ fontSize: '12px' }}>

                My Stats

              </span>

            </div>

            <div

              style={{

                display: 'flex',

                flexDirection: 'column',

                alignItems: 'center',

                gap: '4px',

                color: '#94A3B8'

              }}

            >

              <LogOut size={20} />

              <span style={{ fontSize: '12px' }}>

                Profile

              </span>

            </div>

          </nav>

        </>

      )}

    </div>

  );

}

export default Layout;
