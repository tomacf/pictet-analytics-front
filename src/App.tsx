import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/layout/Layout';
import Teams from './pages/teams/Teams';
import Rooms from './pages/rooms/Rooms';
import Juries from './pages/juries/Juries';
import Sessions from './pages/sessions/Sessions';
import RoomSessions from './pages/roomSessions/RoomSessions';
import './App.css';

function App() {
  return (
    <Router>
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/teams" replace />} />
          <Route path="teams" element={<Teams />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="juries" element={<Juries />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="room-sessions" element={<RoomSessions />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
