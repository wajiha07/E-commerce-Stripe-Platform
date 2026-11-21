import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function SellerOrders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => api<any[]>('/sellers/me/orders'),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/sellers/me/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-orders'] }),
  });

  return (
    <div className="admin-page">
      <h1>Seller orders</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Status</th>
            <th>Total</th>
            <th>Your earnings</th>
            <th>Fee</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(data || []).map((o) => (
            <tr key={o.id}>
              <td>{o.orderNumber}</td>
              <td>{o.status}</td>
              <td>{money(o.total)}</td>
              <td>{money(o.sellerAmount)}</td>
              <td>{money(o.platformFeeAmount)}</td>
              <td>
                {o.status === 'PAID' ? (
                  <button className="btn-ghost" onClick={() => update.mutate({ id: o.id, status: 'SHIPPED' })}>
                    Mark shipped
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
