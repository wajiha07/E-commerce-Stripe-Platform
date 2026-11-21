import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { api } from '../../lib/api';

export function SellerOnboarding() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const seller = useQuery({
    queryKey: ['seller-me'],
    queryFn: () => api<any>('/sellers/me'),
  });

  const refresh = useMutation({
    mutationFn: () => api('/sellers/me/refresh', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-me'] }),
  });

  const onboard = useMutation({
    mutationFn: () => api<{ url: string; mock?: boolean }>('/sellers/me/onboard', { method: 'POST' }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['seller-me'] });
      if (data.url && !data.mock) window.location.href = data.url;
    },
  });

  useEffect(() => {
    if (params.get('return') || params.get('onboarded')) {
      refresh.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-page">
      <h1>Stripe Connect</h1>
      <p className="muted">
        Onboard with Stripe Express to receive destination charges. LUNAIRE keeps an application fee
        on each sale.
      </p>
      <div className="stat-grid">
        <div className="stat">
          <span>Status</span>
          <strong style={{ fontSize: '1.1rem' }}>{seller.data?.status || '—'}</strong>
        </div>
        <div className="stat">
          <span>Charges</span>
          <strong style={{ fontSize: '1.1rem' }}>
            {seller.data?.chargesEnabled ? 'Enabled' : 'Off'}
          </strong>
        </div>
        <div className="stat">
          <span>Payouts</span>
          <strong style={{ fontSize: '1.1rem' }}>
            {seller.data?.payoutsEnabled ? 'Enabled' : 'Off'}
          </strong>
        </div>
        <div className="stat">
          <span>Account</span>
          <strong style={{ fontSize: '0.85rem' }}>
            {seller.data?.stripeAccountId || 'Not connected'}
          </strong>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => onboard.mutate()} disabled={onboard.isPending}>
          {onboard.isPending ? 'Starting…' : 'Connect / continue onboarding'}
        </button>
        <button className="btn btn-outline" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
          Refresh status
        </button>
      </div>
      {onboard.data?.mock ? (
        <p style={{ color: 'var(--color-olive)', marginTop: '1rem' }}>
          Mock Connect activated (no Stripe keys). Ready for local destination-charge testing.
        </p>
      ) : null}
    </div>
  );
}
