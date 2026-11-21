import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function SellerOverview() {
  const seller = useQuery({
    queryKey: ['seller-me'],
    queryFn: () => api<any>('/sellers/me'),
  });
  const orders = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => api<any[]>('/sellers/me/orders'),
  });

  const paid = (orders.data || []).filter((o) =>
    ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status),
  );
  const revenue = paid.reduce((s, o) => s + Number(o.sellerAmount || 0), 0);
  const fees = paid.reduce((s, o) => s + Number(o.platformFeeAmount || 0), 0);

  return (
    <div className="admin-page">
      <h1>{seller.data?.storeName || 'Seller dashboard'}</h1>
      <p className="muted">
        Status: {seller.data?.status || '…'} · Platform fee {seller.data?.platformFeePercent ?? 10}%
      </p>
      {!seller.data?.chargesEnabled ? (
        <p>
          Connect Stripe to accept payments.{' '}
          <Link to="/seller/onboarding">Start onboarding</Link>
        </p>
      ) : (
        <p style={{ color: 'var(--color-olive)' }}>Stripe Connect ready — charges enabled.</p>
      )}
      <div className="stat-grid">
        <div className="stat">
          <span>Seller earnings</span>
          <strong>{money(revenue)}</strong>
        </div>
        <div className="stat">
          <span>Platform fees</span>
          <strong>{money(fees)}</strong>
        </div>
        <div className="stat">
          <span>Orders</span>
          <strong>{orders.data?.length ?? '—'}</strong>
        </div>
        <div className="stat">
          <span>Products</span>
          <strong>{seller.data?._count?.products ?? '—'}</strong>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link className="btn" to="/seller/products">
          Manage products
        </Link>
        <Link className="btn btn-outline" to="/seller/orders">
          View orders
        </Link>
      </div>
    </div>
  );
}
