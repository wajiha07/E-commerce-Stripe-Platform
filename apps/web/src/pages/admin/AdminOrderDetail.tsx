import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, money } from '../../lib/api';

export function AdminOrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => api<any>(`/admin/orders/${id}`),
  });
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const update = useMutation({
    mutationFn: () =>
      api(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: status || data.status,
          trackingNumber: trackingNumber || undefined,
          fulfillmentStatus: status === 'SHIPPED' ? 'fulfilled' : undefined,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-order', id] }),
  });

  const refund = useMutation({
    mutationFn: () => api(`/admin/orders/${id}/refund`, { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-order', id] }),
  });

  if (!data) return <div>Loading…</div>;

  return (
    <div className="admin-page">
      <h1>{data.orderNumber}</h1>
      <p>
        {data.email} · {data.status} · {money(data.total)}
      </p>
      <ul>
        {data.items.map((i: any) => (
          <li key={i.id}>
            {i.productName} ({i.size}/{i.color}) × {i.quantity}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <select value={status || data.status} onChange={(e) => setStatus(e.target.value)}>
          {['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          placeholder="Tracking number"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
        />
        <button className="btn" onClick={() => update.mutate()}>
          Update status
        </button>
        <button className="btn btn-outline" onClick={() => refund.mutate()}>
          Refund
        </button>
      </div>
      {data.payment ? (
        <p className="muted" style={{ marginTop: '1rem' }}>
          Payment: {data.payment.status} · Intent {data.payment.stripePaymentIntentId || '—'}
        </p>
      ) : null}
    </div>
  );
}
