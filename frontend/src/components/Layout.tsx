import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Armchair, LogOut, User } from 'lucide-react';
import '../styles/components/Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
            <div className="layout-user-info-container" ref={menuRef}>
              <button 
                className="layout-user-icon-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
              >
                <User className="layout-user-icon" />
              </button>
              {showUserMenu && (
                <div className="layout-user-menu">
                  <div className="layout-user-menu-item">
                    <span className="layout-user-menu-name">{user?.name}</span>
                  </div>
                  <div className="layout-user-menu-item">
                    <span className="layout-user-role">{user?.role}</span>
                  </div>
                </div>
              )}
              <div className="layout-user-info-desktop">
                <User className="layout-user-icon" />
                <span>{user?.name}</span>
                <span className="layout-user-role">{user?.role}</span>
              </div>
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

