import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: () => api<any>(`/admin/customers?search=${encodeURIComponent(search)}`),
  });
  const detail = useQuery({
    queryKey: ['admin-customer', selected],
    queryFn: () => api<any>(`/admin/customers/${selected}`),
    enabled: !!selected,
  });
  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api(`/admin/customers/${id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-customers'] }),
  });

  return (
    <div className="admin-page">
      <h1>Customers</h1>
      <input
        placeholder="Search customers"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ margin: '1rem 0', maxWidth: 320 }}
      />
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Orders</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(data?.items || []).map((c: any) => (
            <tr key={c.id}>
              <td>
                {c.firstName} {c.lastName}
              </td>
              <td>{c.email}</td>
              <td>{c._count.orders}</td>
              <td>{c.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn-ghost" onClick={() => setSelected(c.id)}>
                  View
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => toggle.mutate({ id: c.id, isActive: !c.isActive })}
                >
                  {c.isActive ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {detail.data ? (
        <div style={{ marginTop: '1.5rem' }}>
          <h2>
            {detail.data.firstName} {detail.data.lastName}
          </h2>
          <p className="muted">{detail.data.email}</p>
          <h3>Order history</h3>
          <ul>
            {detail.data.orders.map((o: any) => (
              <li key={o.id}>
                {o.orderNumber} — {o.status}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
