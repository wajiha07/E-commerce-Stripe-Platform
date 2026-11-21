import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, money } from '../lib/api';
import { getGuestId } from '../lib/guest';
import { useCartUi } from '../store/cart';
import { useEffect } from 'react';
import './CartDrawer.css';

export function CartDrawer() {
  const { open, setOpen, setItemCount } = useCartUi();
  const { data } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api<any>(`/cart?guestId=${getGuestId()}`),
  });

  useEffect(() => {
    if (data) setItemCount(data.itemCount || 0);
  }, [data, setItemCount]);

  return (
    <>
      <div
        className={`cart-drawer__backdrop ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`cart-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <header>
          <h2>Your bag</h2>
          <button className="btn-ghost" onClick={() => setOpen(false)} aria-label="Close">
            Close
          </button>
        </header>
        <div className="cart-drawer__items">
          {!data?.items?.length ? (
            <p className="muted">Your bag is empty.</p>
          ) : (
            data.items.map((item: any) => (
              <div key={item.id} className="cart-drawer__item">
                {item.product.imageUrl ? (
                  <img src={item.product.imageUrl} alt={item.product.name} />
                ) : (
                  <div />
                )}
                <div>
                  <strong>{item.product.name}</strong>
                  <p className="muted">
                    {item.color} / {item.size} × {item.quantity}
                  </p>
                  <p>{money(item.lineTotal)}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <footer>
          <div className="cart-drawer__total">
            <span>Subtotal</span>
            <strong>{money(data?.subtotal || 0)}</strong>
          </div>
          <Link className="btn" to="/cart" onClick={() => setOpen(false)}>
            View bag
          </Link>
          <Link className="btn btn-outline" to="/checkout" onClick={() => setOpen(false)}>
            Checkout
          </Link>
        </footer>
      </aside>
    </>
  );
}
