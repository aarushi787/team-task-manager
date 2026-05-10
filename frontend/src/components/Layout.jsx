import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  projects: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  tasks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  team: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5">
              <path d="M9 11l3 3L22 4"/><rect x="3" y="5" width="16" height="16" rx="2" strokeWidth="2"/>
            </svg>
          </div>
          <div className="logo-text">Task<span>Flow</span></div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            {icons.dashboard} Dashboard
          </NavLink>
          <NavLink to="/projects" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            {icons.projects} Projects
          </NavLink>
          <NavLink to="/tasks" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            {icons.tasks} My Tasks
          </NavLink>

          <div className="nav-section-label">People</div>
          <NavLink to="/team" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            {icons.team} Team
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sign out">
              {icons.logout}
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
