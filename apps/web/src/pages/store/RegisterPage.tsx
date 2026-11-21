import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/shop');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: 440 }}>
      <h1>Create account</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
        {(['firstName', 'lastName', 'email', 'password'] as const).map((key) => (
          <div className="field" key={key}>
            <label htmlFor={key}>{key}</label>
            <input
              id={key}
              type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
              minLength={key === 'password' ? 8 : undefined}
            />
          </div>
        ))}
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" type="submit">
          Register
        </button>
      </form>
      <p className="muted" style={{ marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
