import {Link, Outlet, useLocation} from 'react-router-dom';
import './Layout.css';

const Layout = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout">
      <div className="topbar">
        <h1>Pictet Analytics Admin</h1>
      </div>
      <div className="main-container">
        <nav className="sidebar">
          <ul>
            <li className={isActive('/teams') ? 'active' : ''}>
              <Link to="/teams">Teams</Link>
            </li>
            <li className={isActive('/rooms') ? 'active' : ''}>
              <Link to="/rooms">Rooms</Link>
            </li>
            <li className={isActive('/juries') ? 'active' : ''}>
              <Link to="/juries">Juries</Link>
            </li>
            {/* Room Sessions are now managed inside Session Detail pages */}
            {/* <li className={isActive('/room-sessions') ? 'active' : ''}>
              <Link to="/room-sessions">Room Sessions</Link>
            </li> */}
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
