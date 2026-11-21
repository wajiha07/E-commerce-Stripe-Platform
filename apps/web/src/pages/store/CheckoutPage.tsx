import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { api, money } from '../../lib/api';
import { getGuestId } from '../../lib/guest';
import { useAuth } from '../../context/AuthContext';

function MockPayButton({ orderId }: { orderId: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setLoading(true);
    setError('');
    try {
      await api('/payments/mock-confirm', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
        auth: false,
      });
      navigate(`/order/confirmation/${orderId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <p className="muted">
        Stripe test keys are not configured. Use mock confirmation for local development.
      </p>
      <button className="btn" onClick={confirm} disabled={loading}>
        {loading ? 'Confirming…' : 'Confirm mock payment'}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}

function StripePayForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/order/confirmation/${orderId}`,
      },
    });
    if (result.error) {
      setError(result.error.message || 'Payment failed');
      setLoading(false);
      return;
    }
    navigate(`/order/confirmation/${orderId}`);
  }

  return (
    <form onSubmit={pay} style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
      <PaymentElement />
      <button className="btn" disabled={!stripe || loading}>
        {loading ? 'Processing…' : 'Pay now'}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
}

export function CheckoutPage() {
  const { user } = useAuth();
  const guestId = getGuestId();
  const cart = useQuery({
    queryKey: ['cart'],
    queryFn: () => api<any>(`/cart?guestId=${guestId}`),
  });
  const shipping = useQuery({
    queryKey: ['shipping'],
    queryFn: () => api<any[]>('/shipping/methods'),
  });

  const [form, setForm] = useState({
    email: user?.email || '',
    shippingName: user ? `${user.firstName} ${user.lastName}` : '',
    shippingLine1: '',
    shippingLine2: '',
    shippingCity: '',
    shippingState: '',
    shippingPostal: '',
    shippingCountry: 'US',
    shippingPhone: '',
    shippingMethodId: '',
    couponCode: '',
  });
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<{
    orderId: string;
    clientSecret: string;
    publishableKey: string;
    mock?: boolean;
  } | null>(null);

  const methodId = form.shippingMethodId || shipping.data?.[0]?.id || '';
  const shipPrice = Number(shipping.data?.find((m) => m.id === methodId)?.price || 0);
  const subtotal = cart.data?.subtotal || 0;
  const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100;
  const total = Math.round((subtotal - discount + shipPrice + tax) * 100) / 100;

  const stripePromise = useMemo(() => {
    if (!payment?.publishableKey || payment.publishableKey.includes('placeholder')) return null;
    return loadStripe(payment.publishableKey);
  }, [payment]);

  async function applyCoupon() {
    setError('');
    try {
      const res = await api<{ discountAmount: number }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: form.couponCode, subtotal }),
        auth: false,
      });
      setDiscount(res.discountAmount);
    } catch (e) {
      setDiscount(0);
      setError((e as Error).message);
    }
  }

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await api<any>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          shippingMethodId: methodId,
          guestId,
          couponCode: form.couponCode || undefined,
        }),
      });
      sessionStorage.setItem('lunaire_checkout_email', form.email);
      const mock = res.clientSecret?.includes('_secret_mock');
      setPayment({
        orderId: res.order.id,
        clientSecret: res.clientSecret,
        publishableKey: res.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
        mock,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!cart.data?.items?.length && !payment) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <p>
          Your bag is empty. <Link to="/shop">Shop</Link>
        </p>
      </div>
    );
  }

  if (cart.data?.multiSeller && !payment) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <h1>One seller per checkout</h1>
        <p className="muted">
          Your bag has items from multiple sellers. Remove items until one seller remains, then
          checkout. (Stripe Connect destination charges are single-seller for now.)
        </p>
        <Link className="btn" to="/cart">
          Review bag
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h1 style={{ marginTop: 0 }}>Checkout</h1>
      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(0,1fr)' }} className="checkout-grid">
        <style>{`@media(min-width:900px){.checkout-grid{grid-template-columns:1.2fr .8fr !important;}}`}</style>

        {!payment ? (
          <form onSubmit={placeOrder} style={{ display: 'grid', gap: '0.85rem' }}>
            <h2>Shipping</h2>
            {[
              ['email', 'Email'],
              ['shippingName', 'Full name'],
              ['shippingLine1', 'Address'],
              ['shippingLine2', 'Apt / suite'],
              ['shippingCity', 'City'],
              ['shippingState', 'State'],
              ['shippingPostal', 'Postal code'],
              ['shippingCountry', 'Country'],
              ['shippingPhone', 'Phone'],
            ].map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  required={!['shippingLine2', 'shippingState', 'shippingPhone'].includes(key)}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="field">
              <label htmlFor="shippingMethodId">Delivery</label>
              <select
                id="shippingMethodId"
                value={methodId}
                onChange={(e) => setForm({ ...form, shippingMethodId: e.target.value })}
              >
                {(shipping.data || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {money(m.price)} ({m.estimatedDaysMin}-{m.estimatedDaysMax} days)
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="coupon">Coupon</label>
                <input
                  id="coupon"
                  value={form.couponCode}
                  onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
                  placeholder="LUNAIRE10"
                />
              </div>
              <button type="button" className="btn btn-outline" onClick={applyCoupon}>
                Apply
              </button>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
            <button className="btn" type="submit">
              Continue to payment
            </button>
          </form>
        ) : (
          <div>
            <h2>Payment</h2>
            <p className="muted">Cards are processed by Stripe. We never store card numbers.</p>
            {payment.mock || !stripePromise ? (
              <MockPayButton orderId={payment.orderId} />
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret }}>
                <StripePayForm orderId={payment.orderId} />
              </Elements>
            )}
          </div>
        )}

        <aside style={{ border: '1px solid var(--color-line)', padding: '1.25rem', height: 'fit-content' }}>
          <h2 style={{ marginTop: 0 }}>Order summary</h2>
          {(cart.data?.items || []).map((item: any) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>{money(item.lineTotal)}</span>
            </div>
          ))}
          <hr style={{ border: 0, borderTop: '1px solid var(--color-line)' }} />
          <p>Subtotal: {money(subtotal)}</p>
          <p>Discount: -{money(discount)}</p>
          <p>Shipping: {money(shipPrice)}</p>
          <p>Tax: {money(tax)}</p>
          <p>
            <strong>Total: {money(total)}</strong>
          </p>
        </aside>
      </div>
    </div>
  );
}
