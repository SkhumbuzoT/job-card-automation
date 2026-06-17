import { Outlet, Link, useLocation } from 'react-router-dom';

import {

LayoutDashboard,

Wrench,

LogOut

} from 'lucide-react';

interface LayoutProps {

role:'admin'|'tech';

}

function Layout({ role }: LayoutProps){

const location = useLocation();

return(

<div className="app-container">

{role === 'admin' ? (

<>

<nav className="top-nav">

<div className="nav-left">

<div>

<h2>Prime Chain Control Tower</h2>

<p>Operations Intelligence Platform</p>

</div>

<Link

to="/admin/dashboard"

className={

location.pathname.includes('/admin/dashboard')

? 'btn btn-primary'

: 'btn btn-outline'

}

>

<LayoutDashboard size={18}/>

Dashboard

</Link>

</div>

<button className="btn btn-outline">

<LogOut size={18}/>

Sign Out

</button>

</nav>

<main className="main-content">

<Outlet/>

</main>

</>

):(


<>

<main className="main-content tech-container">

<Outlet/>

</main>

<nav className="mobile-nav">

<Link

to="/tech/jobs"

className="mobile-link"

>

<LayoutDashboard size={20}/>

<span>Jobs</span>

</Link>

<div className="mobile-link">

<Wrench size={20}/>

<span>My Stats</span>

</div>

<div className="mobile-link">

<LogOut size={20}/>

<span>Profile</span>

</div>

</nav>

</>

)}

</div>

);

}

export default Layout;
