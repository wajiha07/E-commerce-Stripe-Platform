import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function BecomeSellerPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/sellers/register', {
        method: 'POST',
        body: JSON.stringify({ storeName, description }),
      });
      await refreshUser();
      navigate('/seller/onboarding');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <p>Please sign in to become a seller.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: 480 }}>
      <h1>Sell on LUNAIRE</h1>
      <p className="muted">Create your storefront and connect Stripe Express to receive payouts.</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
        <div className="field">
          <label htmlFor="storeName">Store name</label>
          <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" type="submit">Create seller account</button>
      </form>
    </div>
  );
}
