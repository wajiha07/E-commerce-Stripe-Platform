import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, money } from '../../lib/api';
import { getGuestId } from '../../lib/guest';
import { useCartUi } from '../../store/cart';

export function CartPage() {
  const qc = useQueryClient();
  const { setItemCount } = useCartUi();
  const guestId = getGuestId();
  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api<any>(`/cart?guestId=${guestId}`),
  });

  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api(`/cart/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity, guestId }),
      }),
    onSuccess: (cart: any) => {
      qc.setQueryData(['cart'], cart);
      setItemCount(cart.itemCount);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/cart/items/${id}?guestId=${guestId}`, { method: 'DELETE' }),
    onSuccess: (cart: any) => {
      qc.setQueryData(['cart'], cart);
      setItemCount(cart.itemCount);
    },
  });

  if (isLoading) return <div className="container" style={{ padding: '4rem 0' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: 900 }}>
      <h1 style={{ marginTop: 0 }}>Your bag</h1>
      {data?.multiSeller ? (
        <p className="error-text">
          Items from multiple sellers detected. Checkout supports one seller at a time — remove
          items from extra sellers first.
        </p>
      ) : null}
      {!data?.items?.length ? (
        <p>
          Your bag is empty. <Link to="/shop">Continue shopping</Link>
        </p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt=""
                          style={{ width: 56, height: 72, objectFit: 'cover' }}
                        />
                      ) : null}
                      <div>
                        <strong>{item.product.name}</strong>
                        <div className="muted">
                          {item.color} / {item.size}
                        </div>
                        <div>{money(item.price)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      style={{ width: 70 }}
                      onChange={(e) =>
                        update.mutate({ id: item.id, quantity: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td>{money(item.lineTotal)}</td>
                  <td>
                    <button className="btn-ghost" onClick={() => remove.mutate(item.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Link to="/shop">Continue shopping</Link>
            <div style={{ textAlign: 'right' }}>
              <p>
                Subtotal: <strong>{money(data.subtotal)}</strong>
              </p>
              <Link className="btn" to="/checkout">
                Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
