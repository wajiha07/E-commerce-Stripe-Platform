import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api<any[]>('/orders/mine'),
  });

  if (isLoading) return <div className="container" style={{ padding: '4rem 0' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h1>Order history</h1>
      {!data?.length ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/orders/${o.id}`}>{o.orderNumber}</Link>
                </td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>{o.status}</td>
                <td>{money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
