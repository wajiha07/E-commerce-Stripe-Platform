import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function AdminSellers() {
  const { data } = useQuery({
    queryKey: ['admin-sellers'],
    queryFn: () => api<any[]>('/admin/sellers'),
  });

  return (
    <div className="admin-page">
      <h1>Sellers (Connect)</h1>
      <p className="muted">Connected accounts and onboarding status</p>
      <table className="table">
        <thead>
          <tr>
            <th>Store</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Charges</th>
            <th>Fee %</th>
            <th>Products</th>
            <th>Account</th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((s) => (
            <tr key={s.id}>
              <td>{s.storeName}</td>
              <td>{s.user?.email}</td>
              <td>{s.status}</td>
              <td>{s.chargesEnabled ? 'Yes' : 'No'}</td>
              <td>{s.platformFeePercent}</td>
              <td>{s._count?.products ?? 0}</td>
              <td style={{ fontSize: '0.8rem' }}>{s.stripeAccountId || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
