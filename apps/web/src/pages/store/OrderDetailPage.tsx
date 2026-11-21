import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

const steps = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function OrderDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api<any>(`/orders/mine/${id}`),
  });

  if (isLoading || !data)
    return <div className="container" style={{ padding: '4rem 0' }}>Loading…</div>;

  const idx = steps.indexOf(data.status);

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: 800 }}>
      <h1>{data.orderNumber}</h1>
      <p>
        Status: <strong>{data.status}</strong>
        {data.trackingNumber ? ` · Tracking ${data.trackingNumber}` : ''}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1.25rem 0' }}>
        {steps.map((s, i) => (
          <span
            key={s}
            style={{
              padding: '0.35rem 0.6rem',
              border: '1px solid var(--color-line)',
              background: i <= idx && idx >= 0 ? 'rgba(61,74,44,0.15)' : 'transparent',
              fontSize: '0.8rem',
            }}
          >
            {s}
          </span>
        ))}
      </div>
      <h2>Items</h2>
      <ul>
        {data.items.map((item: any) => (
          <li key={item.id}>
            {item.productName} — {item.color}/{item.size} × {item.quantity} ({money(item.lineTotal)})
          </li>
        ))}
      </ul>
      <h2>Shipping</h2>
      <p>
        {data.shippingName}
        <br />
        {data.shippingLine1}
        {data.shippingLine2 ? `, ${data.shippingLine2}` : ''}
        <br />
        {data.shippingCity}
        {data.shippingState ? `, ${data.shippingState}` : ''} {data.shippingPostal}
        <br />
        {data.shippingCountry}
      </p>
      <p>
        <strong>Total: {money(data.total)}</strong>
      </p>
    </div>
  );
}
