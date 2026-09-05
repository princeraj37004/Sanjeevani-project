import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Activity, 
  MapPin, 
  AlertTriangle, 
  LogOut, 
  Menu, 
  X,
  User,
  Users,
  Shield,
  Wifi,
  WifiOff,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ isCollapsed, onToggle }) {
  const { user, logout, isDemo, refreshBackendConnection } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'supervisor' ? [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Register Worker', path: '/register-worker', icon: UserPlus },
  { name: 'Communities', path: '/communities', icon: MapPin },
  { name: 'Critical Cases', path: '/alerts', icon: AlertTriangle },
] : [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'My Activity Logs', path: '/my-activities', icon: Activity },
  { name: 'Community Map', path: '/communities', icon: MapPin },
  { name: 'Critical Cases', path: '/alerts', icon: AlertTriangle },
];

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="mobile-navbar">
        <div className="brand">
          <img src="/src/assets/logo.svg" alt="Sanjeevani Logo" className="logo" />
          <span>Sanjeevani</span>
        </div>
        <button className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle navigation menu">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`sidebar-wrapper ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Desktop Collapse Toggle Button */}
        <button 
          className="desktop-collapse-btn" 
          onClick={onToggle} 
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="sidebar-header">
          <div className="brand-logo" title="Sanjeevani Rural Health Tracker">
            <img src="/src/assets/logo.svg" alt="Sanjeevani Logo" className="brand-img" />
            <div className="brand-text">
              <h2>Sanjeevani</h2>
              <span>Rural Health Tracker</span>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="user-profile-card" title={`${user?.name || 'User'} (${user?.role === 'supervisor' ? 'Medical Supervisor' : 'Health Worker'})`}>
          <div className="avatar-wrapper">
            {user?.role === 'supervisor' ? (
              <Shield className="avatar-icon supervisor" size={24} />
            ) : (
              <User className="avatar-icon worker" size={24} />
            )}
          </div>
          <div className="user-info">
            <h4 className="user-name">{user?.name || 'Loading...'}</h4>
            <span className="user-role">{user?.role === 'supervisor' ? 'Medical Supervisor' : 'Health Worker'}</span>
            <span className="user-village">{user?.village || 'District Office'}</span>
          </div>
        </div>

        {/* Demo / Connection Badge */}
        <div 
          className={`connection-badge ${isDemo ? 'demo' : 'live'}`} 
          onClick={refreshBackendConnection} 
          title={isDemo ? "Demo Mode (Local DB) - Click to refresh connection" : "Live Sync Connected - Click to refresh connection"}
        >
          {isDemo ? (
            <>
              <WifiOff size={16} className="badge-icon" />
              <span className="badge-text">Demo Mode (Local DB)</span>
            </>
          ) : (
            <>
              <Wifi size={16} className="badge-icon" />
              <span className="badge-text">Live Sync Connected</span>
            </>
          )}
        </div>

        {/* Navigation links */}
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item, index) => (
              <li key={index}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                  title={item.name}
                >
                  <item.icon size={20} className="nav-icon" />
                  <span className="nav-label">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} className="logout-icon" />
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* CSS specific to Sidebar */}
      <style>{`
        .mobile-navbar {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0 1.5rem;
          align-items: center;
          justify-content: space-between;
          z-index: 1000;
        }

        .mobile-navbar .brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1.25rem;
          color: hsl(var(--primary));
        }

        .mobile-navbar .logo {
          width: 32px;
          height: 32px;
        }

        .mobile-toggle {
          background: none;
          border: none;
          color: hsl(var(--text-primary));
          cursor: pointer;
        }

        .sidebar-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          padding: 2rem 1.25rem;
          display: flex;
          flex-direction: column;
          z-index: 999;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform var(--transition-normal), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-wrapper.collapsed {
          width: 76px;
          padding: 2rem 0.75rem;
        }

        .desktop-collapse-btn {
          position: absolute;
          top: 1.75rem;
          right: -14px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: hsl(var(--text-primary));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1001;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          transition: background var(--transition-fast), transform var(--transition-fast), color var(--transition-fast);
        }

        .desktop-collapse-btn:hover {
          background: hsl(var(--primary));
          color: hsl(var(--bg-secondary));
          transform: scale(1.1);
        }

        .sidebar-header {
          margin-bottom: 2rem;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          overflow: hidden;
          white-space: nowrap;
        }

        .sidebar-wrapper.collapsed .brand-logo {
          justify-content: center;
        }

        .brand-img {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
        }

        .brand-text {
          transition: opacity 0.2s ease, width 0.2s ease;
          white-space: nowrap;
        }

        .sidebar-wrapper.collapsed .brand-text {
          opacity: 0;
          width: 0;
          visibility: hidden;
          display: none;
        }

        .brand-text h2 {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #2dd4bf, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-text span {
          display: block;
          font-size: 0.675rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: hsl(var(--text-muted));
          margin-top: -2px;
        }

        .user-profile-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          margin-bottom: 1.25rem;
          overflow: hidden;
          transition: padding 0.3s ease;
        }

        .sidebar-wrapper.collapsed .user-profile-card {
          padding: 0.5rem;
          justify-content: center;
          background: transparent;
          border-color: transparent;
        }

        .avatar-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .avatar-icon.supervisor { color: hsl(var(--accent)); }
        .avatar-icon.worker { color: hsl(var(--primary)); }

        .user-info {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          transition: opacity 0.2s ease, width 0.2s ease;
        }

        .sidebar-wrapper.collapsed .user-info {
          opacity: 0;
          width: 0;
          display: none;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--text-primary));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          display: block;
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
        }

        .user-village {
          display: block;
          font-size: 0.65rem;
          color: hsl(var(--primary));
          font-weight: 500;
        }

        .connection-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.4rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          margin-bottom: 1.5rem;
          transition: var(--transition-fast);
          overflow: hidden;
          white-space: nowrap;
        }

        .badge-icon {
          flex-shrink: 0;
        }

        .badge-text {
          transition: opacity 0.2s ease, width 0.2s ease;
        }

        .sidebar-wrapper.collapsed .badge-text {
          opacity: 0;
          width: 0;
          display: none;
        }

        .sidebar-wrapper.collapsed .connection-badge {
          padding: 0.5rem;
          justify-content: center;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          margin: 0 auto 1.5rem auto;
        }

        .connection-badge.demo {
          background: rgba(217, 119, 6, 0.15);
          color: hsl(var(--warning));
          border: 1px solid rgba(217, 119, 6, 0.25);
        }

        .connection-badge.live {
          background: rgba(34, 197, 94, 0.1);
          color: hsl(var(--success));
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .connection-badge:hover {
          transform: scale(1.02);
        }

        .sidebar-nav {
          flex: 1;
        }

        .sidebar-nav ul {
          list-style: none;
        }

        .sidebar-nav li {
          margin-bottom: 0.5rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: hsl(var(--text-secondary));
          border-radius: var(--radius-sm);
          font-weight: 500;
          font-size: 0.95rem;
          transition: var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-wrapper.collapsed .nav-link {
          padding: 0.75rem 0.85rem;
          justify-content: center;
        }

        .nav-link:hover {
          color: hsl(var(--text-primary));
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-link.active {
          color: hsl(var(--bg-secondary));
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
          box-shadow: 0 4px 12px hsla(var(--primary), 0.25);
        }

        .nav-icon {
          flex-shrink: 0;
          transition: transform var(--transition-normal);
        }

        .nav-label {
          transition: opacity 0.2s ease;
        }

        .sidebar-wrapper.collapsed .nav-label {
          opacity: 0;
          display: none;
        }

        .nav-link:hover .nav-icon {
          transform: translateX(2px);
        }

        .sidebar-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1rem;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          color: hsl(var(--danger));
          border-radius: var(--radius-sm);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-wrapper.collapsed .logout-btn {
          padding: 0.75rem;
          justify-content: center;
        }

        .logout-icon {
          flex-shrink: 0;
        }

        .logout-label {
          transition: opacity 0.2s ease;
        }

        .sidebar-wrapper.collapsed .logout-label {
          opacity: 0;
          display: none;
        }

        .logout-btn:hover {
          background: rgba(244, 63, 94, 0.08);
        }

        @media (max-width: 768px) {
          .desktop-collapse-btn {
            display: none;
          }
          .mobile-navbar {
            display: flex;
          }
          .sidebar-wrapper {
            transform: translateX(-100%);
            top: 64px;
            width: 100% !important;
            border-right: none;
            padding: 2rem 1.25rem !important;
          }
          .sidebar-wrapper.collapsed {
            width: 100% !important;
          }
          .sidebar-wrapper.collapsed .brand-text,
          .sidebar-wrapper.collapsed .user-info,
          .sidebar-wrapper.collapsed .badge-text,
          .sidebar-wrapper.collapsed .nav-label,
          .sidebar-wrapper.collapsed .logout-label {
            opacity: 1 !important;
            display: block !important;
            width: auto !important;
            visibility: visible !important;
          }
          .sidebar-wrapper.collapsed .user-profile-card {
            padding: 1rem !important;
            justify-content: flex-start !important;
            background: rgba(255, 255, 255, 0.03) !important;
            border-color: rgba(255, 255, 255, 0.05) !important;
          }
          .sidebar-wrapper.collapsed .connection-badge {
            width: 100% !important;
            height: auto !important;
            border-radius: var(--radius-sm) !important;
            padding: 0.4rem !important;
          }
          .sidebar-wrapper.collapsed .nav-link,
          .sidebar-wrapper.collapsed .logout-btn {
            justify-content: flex-start !important;
          }
          .sidebar-wrapper.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
