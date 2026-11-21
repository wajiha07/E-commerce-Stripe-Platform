import { useQuery } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function AdminPayments() {
  const { data } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => api<any>('/admin/payments'),
  });

  return (
    <div className="admin-page">
      <h1>Payments</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Refunded</th>
            <th>Intent</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items || []).map((p: any) => (
            <tr key={p.id}>
              <td>{p.order?.orderNumber}</td>
              <td>{money(p.amount)}</td>
              <td>{p.status}</td>
              <td>{money(p.refundedAmount)}</td>
              <td style={{ fontSize: '0.8rem' }}>{p.stripePaymentIntentId || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
