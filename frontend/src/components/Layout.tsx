import { BarChart3, BookMarked, BrainCircuit, ChevronRight, ClipboardCheck, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Sparkles, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../store/AuthContext";

const links = [
  ["/dashboard", "Dashboard", LayoutDashboard], ["/mock-tests", "Mock tests", ClipboardCheck], ["/practice", "Practice", BrainCircuit], ["/pyq", "PYQ library", BookMarked], ["/analytics", "Analytics", BarChart3],
] as const;

export function AppShell() {
  const { session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const examRoute = /^\/mock-tests\/[^/]+$/.test(location.pathname);
  if (examRoute) return <Outlet />;
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="Main navigation">
      <Link to="/dashboard" className="brand"><span className="brand-mark"><Sparkles size={18} /></span><span>JECA<br /><b>Prep Hub</b></span></Link>
      <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X /></button>
      <nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><Icon size={18} />{label}</NavLink>)}</nav>
      <div className="sidebar-bottom"><NavLink to="/settings" className="nav-link"><Settings size={18} />Settings</NavLink>{session?.user.role === "ADMIN" && <NavLink to="/admin" className="nav-link"><ShieldCheck size={18} />Admin</NavLink>}<button className="nav-link" onClick={logout}><LogOut size={18} />Sign out</button></div>
    </aside>
    {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div className="breadcrumb"><span>Prep workspace</span><ChevronRight size={14} /><b>{location.pathname === "/dashboard" ? "Dashboard" : "Focused practice"}</b></div><div className="topbar-user"><span className="avatar">{session?.user.name.slice(0, 1).toUpperCase()}</span><div><b>{session?.user.name}</b><small>{session?.mode === "local" ? "Local explorer" : "Learner"}</small></div></div></header>
      <Outlet />
    </main>
  </div>;
}
