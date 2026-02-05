import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import './Auth.css';

const Profile = () => {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signout();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      toast.error(message);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <div className="profile-card">
        <div className="profile-section">
          <h2>Account Information</h2>
          
          <div className="profile-info">
            <div className="profile-field">
              <label>Email</label>
              <p>{user.email}</p>
            </div>
            
            <div className="profile-field">
              <label>Account Created</label>
              <p>{format(new Date(user.created_at), 'PPP')}</p>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button 
            className="btn-secondary" 
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
