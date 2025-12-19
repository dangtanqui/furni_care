import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Armchair, LogOut, User } from 'lucide-react';
import '../styles/components/Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="layout-header">
        <div className="layout-header-content">
          <Link to="/" className="layout-logo-link">
            <Armchair className="layout-logo-icon" />
            <span className="layout-logo-text">FurniCare</span>
          </Link>
          
          <div className="layout-user-section">
            <div className="layout-user-info">
              <User className="layout-user-icon" />
              <span>{user?.name}</span>
              <span className="layout-user-role">{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="layout-logout-button">
              <LogOut className="layout-logout-icon" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

