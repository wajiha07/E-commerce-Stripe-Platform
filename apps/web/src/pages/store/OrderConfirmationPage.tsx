import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function OrderConfirmationPage() {
  const { id } = useParams();
  const email = sessionStorage.getItem('lunaire_checkout_email') || '';
  const { data, isLoading } = useQuery({
    queryKey: ['order-confirmation', id, email],
    queryFn: () =>
      api<any>(
        `/orders/confirmation/${id}${email ? `?email=${encodeURIComponent(email)}` : ''}`,
      ),
    retry: 2,
  });

  if (isLoading) return <div className="container" style={{ padding: '4rem 0' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: 720 }}>
      <p className="badge">Thank you</p>
      <h1>Order confirmed</h1>
      {data ? (
        <>
          <p>
            Order <strong>{data.orderNumber}</strong> — status <strong>{data.status}</strong>
          </p>
          <p className="muted">A confirmation has been associated with {data.email}.</p>
          <p>Total paid / due: {money(data.total)}</p>
          <ul>
            {data.items.map((item: any) => (
              <li key={item.id}>
                {item.productName} ({item.color}/{item.size}) × {item.quantity}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Link className="btn" to={`/orders/${data.id}`}>
              View order
            </Link>
            <Link className="btn btn-outline" to="/shop">
              Continue shopping
            </Link>
          </div>
        </>
      ) : (
        <p>
          If you checked out as a guest, track your order{' '}
          <Link to="/track">here</Link>.
        </p>
      )}
    </div>
  );
}
