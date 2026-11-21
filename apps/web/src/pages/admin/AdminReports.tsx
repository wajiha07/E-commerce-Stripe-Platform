import { useQuery } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function AdminReports() {
  const dash = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api<any>('/admin/dashboard'),
  });
  const sales = useQuery({
    queryKey: ['admin-sales'],
    queryFn: () => api<any[]>('/admin/reports/sales?days=30'),
  });

  return (
    <div className="admin-page">
      <h1>Reports & analytics</h1>
      <div className="stat-grid">
        <div className="stat">
          <span>30-day revenue</span>
          <strong>{money(dash.data?.revenueLast30Days || 0)}</strong>
        </div>
        <div className="stat">
          <span>Successful payments</span>
          <strong>{dash.data?.successfulPayments ?? '—'}</strong>
        </div>
      </div>
      <h2>Daily revenue</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {(sales.data || []).map((row) => (
            <tr key={row.date}>
              <td>{row.date}</td>
              <td>{money(row.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Product performance</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {(dash.data?.topProducts || []).map((p: any) => (
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
