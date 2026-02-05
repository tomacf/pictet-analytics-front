import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { Calendar, Shield, CheckCircle } from 'lucide-react';
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

  // Generate schedule grid cells pattern
  const generateGridCells = () => {
    const cells = [];
    const activePattern = [
      [0, 1, 1, 0, 1, 0],
      [1, 0, 1, 1, 0, 1],
      [0, 1, 0, 1, 1, 0],
      [1, 1, 0, 0, 1, 1],
      [0, 0, 1, 1, 0, 1],
    ];
    const highlightCells = [[1, 2], [2, 3], [3, 4]];

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        const isActive = activePattern[row][col] === 1;
        const isHighlight = highlightCells.some(([r, c]) => r === row && c === col);
        cells.push(
          <div
            key={`${row}-${col}`}
            className={`grid-cell ${isActive ? 'active' : ''} ${isHighlight ? 'highlight' : ''}`}
            style={{ animationDelay: `${(row * 6 + col) * 0.05}s` }}
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="landing-page">
      {/* Top Navigation Bar */}
      <nav className="landing-topbar">
        <div className="landing-logo">
          <img src="/logo.png" alt="Competition Platform Logo" />
          <span className="landing-logo-text">Competition Platform</span>
        </div>
        <button
          className="btn-signin-outline"
          onClick={() => navigate('/signin')}
        >
          Sign in
        </button>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-text">
            <h1 className="landing-hero-title">
              Competition Scheduling &amp; Analytics
              <br />
              Built for real-world events.
            </h1>
            <p className="landing-hero-subtitle">
              Ensure fairness, determinism, and reliability during live international competitions. 
              A professional platform designed for operational clarity and institutional trust.
            </p>
            <button
              className="landing-hero-cta"
              onClick={() => navigate('/signin')}
            >
              Sign in to the platform
            </button>
          </div>
          <div className="landing-hero-visual">
            <div className="schedule-grid-visual">
              {generateGridCells()}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="landing-trust">
        <div className="landing-trust-content">
          <div className="trust-pillar">
            <div className="trust-pillar-icon">
              <Calendar />
            </div>
            <h3 className="trust-pillar-title">Deterministic Scheduling</h3>
            <p className="trust-pillar-text">
              Reproducible, auditable schedules generated with full transparency.
            </p>
          </div>
          <div className="trust-pillar">
            <div className="trust-pillar-icon">
              <CheckCircle />
            </div>
            <h3 className="trust-pillar-title">Conflict-Free Validation</h3>
            <p className="trust-pillar-text">
              Automatic detection and prevention of scheduling conflicts.
            </p>
          </div>
          <div className="trust-pillar">
            <div className="trust-pillar-icon">
              <Shield />
            </div>
            <h3 className="trust-pillar-title">Event-Critical Reliability</h3>
            <p className="trust-pillar-text">
              Built to perform under pressure during live multi-day events.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
