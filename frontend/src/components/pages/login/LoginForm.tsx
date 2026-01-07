import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import Button from '../../Button';
import '../../../styles/components/pages/login/LoginForm.css';
import type { LoginFormProps } from '../../../types/components/pages/Login';

export default function LoginForm({ 
  email, 
  password, 
  showPassword, 
  rememberMe,
  error, 
  loading,
  onEmailChange, 
  onPasswordChange, 
  onTogglePassword,
  onRememberMeChange,
  onSubmit 
}: LoginFormProps) {
  return (
    <>
      {error && (
        <div className="login-error" role="alert">
          <AlertCircle className="login-error-icon" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      
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
              autoComplete="email"
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
              autoComplete="current-password"
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
        <div className="login-remember-me">
          <label htmlFor="remember_me" className="login-remember-me-label">
            <input
              id="remember_me"
              name="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={e => onRememberMeChange(e.target.checked)}
              disabled={loading}
              className="login-remember-me-checkbox"
            />
            <span>Remember Me</span>
          </label>
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
