import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { Armchair } from 'lucide-react';
import LoginForm from '../components/pages/login/LoginForm';
import '../styles/pages/Login.css';

const REMEMBERED_EMAIL_KEY = 'remembered_email';
const REMEMBER_ME_KEY = 'remember_me';

export default function Login() {
  // Load remembered email on mount (NOT password for security)
  const [email, setEmail] = useState(() => {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, token, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if already logged in
  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  // Don't render login form if already authenticated
  if (token) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginApi(email, password, rememberMe);
      
      // Save or clear email based on rememberMe (NOT password for security)
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
      
      login(res.data.token, res.data.user, rememberMe);
      navigate('/');
    } catch {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    // If unchecking, clear saved email (password is never saved)
    if (!checked) {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Armchair className="login-logo" />
          <h1 className="login-title">FurniCare</h1>
        </div>
        <p className="login-subtitle">Warranty Management System</p>
        
        <LoginForm
          email={email}
          password={password}
          showPassword={showPassword}
          rememberMe={rememberMe}
          error={error}
          loading={loading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onRememberMeChange={handleRememberMeChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

