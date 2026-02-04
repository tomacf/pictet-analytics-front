import {Link, Outlet, useLocation} from 'react-router-dom';
import { useState } from 'react';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const [isConfigurationOpen, setIsConfigurationOpen] = useState(true);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const isConfigurationActive = () => {
    return isActive('/teams') || isActive('/rooms') || isActive('/juries');
  };

  return (
    <div className="layout">
      <div className="topbar">
        <h1>Pictet Analytics Admin</h1>
      </div>
      <div className="main-container">
        <nav className="sidebar">
          <ul>
            <li className={`parent-item ${isConfigurationActive() ? 'active' : ''}`}>
              <button 
                className="parent-toggle"
                onClick={() => setIsConfigurationOpen(!isConfigurationOpen)}
                aria-expanded={isConfigurationOpen}
              >
                <span className={`arrow ${isConfigurationOpen ? 'open' : ''}`}>▶</span>
                Configuration
              </button>
              {isConfigurationOpen && (
                <ul className="sub-items">
                  <li className={isActive('/teams') ? 'active' : ''}>
                    <Link to="/teams">Teams</Link>
                  </li>
                  <li className={isActive('/rooms') ? 'active' : ''}>
                    <Link to="/rooms">Rooms</Link>
                  </li>
                  <li className={isActive('/juries') ? 'active' : ''}>
                    <Link to="/juries">Juries</Link>
                  </li>
                </ul>
              )}
            </li>
            <li className={isActive('/sessions') ? 'active' : ''}>
              <Link to="/sessions">Sessions</Link>
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
