import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import './Auth.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to admin if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/teams');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="landing-card">
        <div className="landing-header">
          <h1>Pictet Analytics</h1>
          <p className="landing-subtitle">Manage your teams, rooms, juries, and sessions</p>
        </div>
        
        <div className="landing-content">
          <p>
            Welcome to the Pictet Analytics Admin platform. This application helps you
            manage your scheduling, team coordination, and analytics with ease.
          </p>
        </div>

        <div className="landing-actions">
          <button 
            className="btn-primary btn-large" 
            onClick={() => navigate('/signin')}
          >
            Sign In
          </button>
          <button 
            className="btn-secondary btn-large" 
            onClick={() => navigate('/signup')}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
