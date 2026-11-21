import { FormEvent, useState } from 'react';
import { api, money } from '../../lib/api';

export function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const data = await api(
        `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`,
        { auth: false },
      );
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError((err as Error).message);
    }
  }

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: 560 }}>
      <h1>Track order</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
        <div className="field">
          <label htmlFor="orderNumber">Order number</label>
          <input id="orderNumber" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button className="btn" type="submit">
          Track
        </button>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
      {order ? (
        <div style={{ marginTop: '1.5rem' }}>
          <p>
            <strong>{order.orderNumber}</strong> — {order.status}
          </p>
          <p>Total: {money(order.total)}</p>
          {order.trackingNumber ? <p>Tracking: {order.trackingNumber}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
