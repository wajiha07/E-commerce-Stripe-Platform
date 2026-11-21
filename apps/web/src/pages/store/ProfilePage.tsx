import { FormEvent, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          password: form.password || undefined,
        }),
      });
      await refreshUser();
      setMessage('Profile updated');
      setForm((f) => ({ ...f, password: '' }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: 480 }}>
      <h1>Profile</h1>
      <p className="muted">{user?.email}</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
        <div className="field">
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            placeholder="Leave blank to keep"
          />
        </div>
        {message ? <p style={{ color: 'var(--color-olive)' }}>{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" type="submit">
          Save
        </button>
      </form>
    </div>
  );
}
