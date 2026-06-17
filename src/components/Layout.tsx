<nav
className="glass-panel"

style={{

height:'72px',

padding:'0 32px',

display:'flex',

justifyContent:'space-between',

alignItems:'center',

marginBottom:'32px'

}}
>

<div
style={{

display:'flex',

alignItems:'center',

gap:'32px'

}}
>

<div>

<h2>

Prime Chain Control Tower

</h2>

<p
style={{

fontSize:'12px',

color:'var(--color-text-muted)'

}}
>

Operations Intelligence Platform

</p>

</div>

<Link

to="/admin/dashboard"

className='btn btn-primary'

>

<LayoutDashboard size={18}/>

Dashboard

</Link>

</div>

<div

style={{

display:'flex',

alignItems:'center',

gap:'16px'

}}

>

<div>

<p

style={{

fontWeight:600

}}

>

Administrator

</p>

<p

style={{

fontSize:'12px',

color:'var(--color-text-muted)'

}}

>

Operations Control

</p>

</div>

<button className='btn btn-outline'>

<LogOut size={18}/>

Sign Out

</button>

</div>

</nav>
