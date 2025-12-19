import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { Armchair } from 'lucide-react';
import LoginForm from '../components/pages/login/LoginForm';
import '../styles/pages/Login.css';

export default function Login() {
  const [email, setEmail] = useState('cs@demo.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginApi(email, password);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch {
      setError('Invalid email or password');
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
          error={error}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

