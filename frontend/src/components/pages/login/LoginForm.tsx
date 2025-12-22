import { Eye, EyeOff } from 'lucide-react';
import Button from '../../Button';
import '../../../styles/components/pages/login/LoginForm.css';
import type { LoginFormProps } from '../../../types/components/pages/Login';

export default function LoginForm({ 
  email, 
  password, 
  showPassword, 
  error, 
  loading,
  onEmailChange, 
  onPasswordChange, 
  onTogglePassword, 
  onSubmit 
}: LoginFormProps) {
  return (
    <>
      {error && <div className="login-error">{error}</div>}
      
      <form onSubmit={onSubmit} className="login-form">
        <div>
          <label htmlFor="email" className="login-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => onEmailChange(e.target.value)}
              className="login-input-field"
              required
              disabled={loading}
            />
        </div>
        <div>
          <label htmlFor="password" className="login-label">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              className="login-password-field"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="login-password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="login-password-toggle-icon" /> : <Eye className="login-password-toggle-icon" />}
            </button>
          </div>
        </div>
        <Button type="submit" variant="primary" disabled={loading}>
          Login
        </Button>
      </form>
      
      <div className="login-demo-info">
        <p>Demo accounts:</p>
        <p>cs@demo.com | tech@demo.com | leader@demo.com</p>
        <p>Password: password</p>
      </div>
    </>
  );
}

