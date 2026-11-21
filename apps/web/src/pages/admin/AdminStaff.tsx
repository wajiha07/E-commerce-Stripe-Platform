import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function AdminStaff() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: () => api<any[]>('/admin/staff'),
    enabled: user?.role === 'ADMIN',
  });
  const [form, setForm] = useState({
    email: '',
    password: 'Password123!',
    firstName: '',
    lastName: '',
    role: 'SUPPORT',
  });
  const create = useMutation({
    mutationFn: () => api('/admin/staff', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-staff'] }),
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="admin-page">
        <h1>Staff & roles</h1>
        <p className="muted">Only ADMIN users can manage staff accounts.</p>
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="admin-page">
      <h1>Admin users & roles</h1>
      <p className="muted">Roles: ADMIN (full), MANAGER (catalog/orders), SUPPORT (view/update orders)</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 480, margin: '1rem 0' }}>
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="ADMIN">ADMIN</option>
          <option value="MANAGER">MANAGER</option>
          <option value="SUPPORT">SUPPORT</option>
        </select>
        <button className="btn" type="submit">
          Create staff user
        </button>
      </form>
      {error ? <p className="error-text">{(error as Error).message}</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((s) => (
            <tr key={s.id}>
              <td>
                {s.firstName} {s.lastName}
              </td>
              <td>{s.email}</td>
              <td>{s.role}</td>
              <td>{s.isActive ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
