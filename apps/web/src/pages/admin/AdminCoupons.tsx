import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function AdminCoupons() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api<any[]>('/admin/coupons'),
  });
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 0,
  });
  const create = useMutation({
    mutationFn: () =>
      api('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase(),
          description: form.code,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/coupons/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="admin-page">
      <h1>Discounts & coupons</h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          placeholder="CODE"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          required
        />
        <select
          value={form.discountType}
          onChange={(e) => setForm({ ...form, discountType: e.target.value })}
        >
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed</option>
        </select>
        <input
          type="number"
          value={form.discountValue}
          onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
        />
        <button className="btn" type="submit">
          Create
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Used</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(data || []).map((c) => (
            <tr key={c.id}>
              <td>{c.code}</td>
              <td>{c.discountType}</td>
              <td>{String(c.discountValue)}</td>
              <td>
                {c.usedCount}
                {c.maxUses ? ` / ${c.maxUses}` : ''}
              </td>
              <td>
                <button className="btn-ghost" onClick={() => remove.mutate(c.id)}>
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
