import { FormEvent, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function AdminSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api<any>('/admin/settings'),
  });
  const [store, setStore] = useState({
    name: 'LUNAIRE',
    tagline: '',
    email: '',
    phone: '',
    address: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (data?.store) setStore((s) => ({ ...s, ...data.store }));
  }, [data]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (user?.role !== 'ADMIN') {
      setMessage('Only ADMIN can update settings');
      return;
    }
    await api('/admin/settings/store', {
      method: 'PATCH',
      body: JSON.stringify({ value: store }),
    });
    qc.invalidateQueries({ queryKey: ['admin-settings'] });
    setMessage('Settings saved. Payment keys remain in environment variables.');
  }

  return (
    <div className="admin-page">
      <h1>Settings</h1>
      <p className="muted">Store information. Stripe keys are configured via environment only.</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 520 }}>
        {Object.entries(store).map(([key, value]) => (
          <div className="field" key={key}>
            <label>{key}</label>
            <input
              value={value}
              onChange={(e) => setStore({ ...store, [key]: e.target.value })}
            />
          </div>
        ))}
        <button className="btn" type="submit">
          Save
        </button>
        {message ? <p style={{ color: 'var(--color-olive)' }}>{message}</p> : null}
      </form>
    </div>
  );
}
