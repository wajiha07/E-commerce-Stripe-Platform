import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, money } from '../../lib/api';

export function AdminOrders() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['admin-orders', status, search],
    queryFn: () =>
      api<any>(
        `/admin/orders?${new URLSearchParams({
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
        })}`,
      ),
  });

  return (
    <div className="admin-page">
      <h1>Orders</h1>
      <div className="toolbar">
        <input
          placeholder="Search order / email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items || []).map((o: any) => (
            <tr key={o.id}>
              <td>
                <Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
              </td>
              <td>{o.email}</td>
              <td>{o.status}</td>
              <td>{money(o.total)}</td>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
