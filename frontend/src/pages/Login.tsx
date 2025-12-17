import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { Armchair } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('cs@demo.com');
  const [password, setPassword] = useState('password');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#0d9488]">
      <div className="card p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Armchair className="w-10 h-10 text-[#0d9488]" />
          <h1 className="text-2xl font-bold text-[#1e3a5f]">FurniCare</h1>
        </div>
        <p className="text-center text-gray-500 mb-6">Warranty Management System</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <button type="submit" className="btn-accent w-full">Login</button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Demo accounts:</p>
          <p>cs@demo.com | tech@demo.com | leader@demo.com</p>
          <p>Password: password</p>
        </div>
      </div>
    </div>
  );
}

