.app-container{
  min-height:100vh;
  background:#F8FAFC;
}

.main-content{
  padding:32px;
  width:100%;
}

.dashboard-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:32px;
}

.dashboard-title h1{
  font-size:32px;
  font-weight:700;
}

.dashboard-title p{
  color:#64748B;
  margin-top:8px;
}

.dashboard-grid{
  display:grid;
  grid-template-columns:
  repeat(auto-fit,minmax(260px,1fr));

  gap:24px;

  margin-bottom:32px;
}

.dashboard-card{
  background:#fff;

  padding:24px;

  border-radius:18px;

  box-shadow:
  0 8px 24px rgba(15,23,42,.08);

  transition:.3s ease;
}

.dashboard-card:hover{
  transform:translateY(-4px);
}

.dashboard-table{
  background:#fff;

  border-radius:18px;

  box-shadow:
  0 8px 24px rgba(15,23,42,.08);

  padding:24px;
}

.glass-panel{
  background:#fff;

  border-radius:18px;

  box-shadow:
  0 8px 24px rgba(15,23,42,.08);
}

.btn{
  display:flex;

  align-items:center;

  gap:8px;

  padding:12px 18px;

  border:none;

  border-radius:12px;

  font-weight:600;

  cursor:pointer;

  transition:.3s;
}

.btn-primary{

  background:#2563EB;

  color:white;
}

.btn-primary:hover{

  background:#1D4ED8;
}

.btn-outline{

  background:white;

  border:1px solid #E2E8F0;
}

.animate-fade-in{

  animation:fadeIn .4s ease;
}

@keyframes fadeIn{

from{

opacity:0;

transform:translateY(10px);

}

to{

opacity:1;

transform:translateY(0);

}

}
