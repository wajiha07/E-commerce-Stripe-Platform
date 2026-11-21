import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function AdminShipping() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-shipping'],
    queryFn: () => api<any[]>('/admin/shipping'),
  });
  const [form, setForm] = useState({ name: '', price: 10, estimatedDaysMin: 3, estimatedDaysMax: 7 });
  const create = useMutation({
    mutationFn: () => api('/admin/shipping', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shipping'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/shipping/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shipping'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="admin-page">
      <h1>Shipping & delivery</h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1rem 0' }}>
        <input
          placeholder="Method name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />
        <button className="btn" type="submit">
          Add method
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>ETA</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(data || []).map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{money(m.price)}</td>
              <td>
                {m.estimatedDaysMin}-{m.estimatedDaysMax} days
              </td>
              <td>{m.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn-ghost" onClick={() => remove.mutate(m.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
