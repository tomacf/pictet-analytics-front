import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Landing from './pages/auth/Landing';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import Profile from './pages/auth/Profile';
import Teams from './pages/teams/Teams';
import Rooms from './pages/rooms/Rooms';
import Juries from './pages/juries/Juries';
import Sessions from './pages/sessions/Sessions';
import SessionDetail from './pages/sessions/SessionDetail';
import SessionWizard from './pages/sessions/SessionWizard';
import Analytics from './pages/analytics/Analytics';
import DocumentInspector from './pages/documentInspector/DocumentInspector';
// import RoomSessions from './pages/roomSessions/RoomSessions'; // No longer used - managed in SessionDetail
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
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
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="profile" element={<Profile />} />
            <Route path="teams" element={<Teams />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="juries" element={<Juries />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
            <Route path="sessions/wizard" element={<SessionWizard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="document-inspector" element={<DocumentInspector />} />
            {/* Room Sessions are now managed inside Session Detail pages */}
            {/* <Route path="room-sessions" element={<RoomSessions />} /> */}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
