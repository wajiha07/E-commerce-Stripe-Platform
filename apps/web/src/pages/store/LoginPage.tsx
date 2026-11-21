import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/';
  const [email, setEmail] = useState('customer@lunaire.test');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (['ADMIN', 'MANAGER', 'SUPPORT'].includes(user.role)) navigate('/admin');
      else if (user.role === 'SELLER') navigate('/seller');
      else navigate(from);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: 440 }}>
      <h1>Sign in</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" type="submit">
          Sign in
        </button>
      </form>
      <p className="muted" style={{ marginTop: '1rem' }}>
        No account? <Link to="/register">Create one</Link>
      </p>
      <p className="muted">Demo admin: admin@lunaire.test · seller: seller@lunaire.test · Password123!</p>
    </div>
  );
}
