import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api<any>('/admin/dashboard'),
  });

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>
      <p className="muted">Sales overview for the last 30 days</p>
      <div className="stat-grid">
        <div className="stat">
          <span>Revenue</span>
          <strong>{money(data?.revenueLast30Days || 0)}</strong>
        </div>
        <div className="stat">
          <span>Orders</span>
          <strong>{data?.salesLast30Days ?? '—'}</strong>
        </div>
        <div className="stat">
          <span>Pending</span>
          <strong>{data?.pendingOrders ?? '—'}</strong>
        </div>
        <div className="stat">
          <span>Customers</span>
          <strong>{data?.customerCount ?? '—'}</strong>
        </div>
      </div>

      <h2>Recent orders</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Email</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {(data?.recentOrders || []).map((o: any) => (
            <tr key={o.id}>
              <td>
                <Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
              </td>
              <td>{o.email}</td>
              <td>{o.status}</td>
              <td>{money(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '2rem' }}>Top products</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {(data?.topProducts || []).map((p: any) => (
            <tr key={p.productName}>
              <td>{p.productName}</td>
              <td>{p.quantity}</td>
              <td>{money(p.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
