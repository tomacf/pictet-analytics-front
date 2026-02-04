import {Link, Outlet, useLocation} from 'react-router-dom';
import {useState, useEffect} from 'react';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const [isConfigurationExpanded, setIsConfigurationExpanded] = useState(true);
  
  // Initialize sidebar collapsed state from localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Persist sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const isConfigurationActive = () => {
    return isActive('/teams') || isActive('/rooms') || isActive('/juries');
  };

  const isAnalyticsActive = () => {
    return isActive('/analytics');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="layout">
      <div className="topbar">
        <button 
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? '☰' : '‹'}
        </button>
        <img src="/logo1.png" alt="Pictet Analytics Logo" className="topbar-logo" />
        <h1>Pictet Analytics Admin</h1>
      </div>
      <div className="main-container">
        <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <ul>
            <li className={`parent-item ${isConfigurationActive() ? 'active' : ''}`}>
              <button 
                className="parent-toggle"
                onClick={() => setIsConfigurationExpanded(!isConfigurationExpanded)}
                aria-expanded={isConfigurationExpanded}
                aria-label="Toggle Configuration menu"
                title="Configuration"
              >
                <span className={`arrow ${isConfigurationExpanded ? 'expanded' : ''}`}>▶</span>
                <span className="icon">⚙️</span>
                <span className="menu-text">Configuration</span>
              </button>
              {isConfigurationExpanded && !isSidebarCollapsed && (
                <ul className="sub-items">
                  <li className={isActive('/teams') ? 'active' : ''}>
                    <Link to="/teams" title="Teams">
                      <span className="menu-text">Teams</span>
                    </Link>
                  </li>
                  <li className={isActive('/rooms') ? 'active' : ''}>
                    <Link to="/rooms" title="Rooms">
                      <span className="menu-text">Rooms</span>
                    </Link>
                  </li>
                  <li className={isActive('/juries') ? 'active' : ''}>
                    <Link to="/juries" title="Juries">
                      <span className="menu-text">Juries</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li className={isActive('/sessions') ? 'active' : ''}>
              <Link to="/sessions" title="Sessions">
                <span className="icon">📅</span>
                <span className="menu-text">Sessions</span>
              </Link>
            </li>
            <li className={isAnalyticsActive() ? 'active' : ''}>
              <Link to="/analytics" title="Analytics">
                <span className="icon">📊</span>
                <span className="menu-text">Analytics</span>
              </Link>
            </li>
          </ul>
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
