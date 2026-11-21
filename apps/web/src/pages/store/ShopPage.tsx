import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { ProductCard } from '../../components/ProductCard';
import './ShopPage.css';

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => {
    const q = new URLSearchParams(params);
    if (!q.get('limit')) q.set('limit', '12');
    return q.toString();
  }, [params]);

  const products = useQuery({
    queryKey: ['shop', query],
    queryFn: () => api<any>(`/products?${query}`),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<any[]>('/categories'),
  });

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.set('page', '1');
    setParams(next);
  }

  const page = Number(params.get('page') || 1);
  const pages = products.data?.pages || 1;

  return (
    <div className="container shop">
      <header className="shop__header fade-up">
        <h1>Shop</h1>
        <p className="muted">Filter by category, price, and sort to find your piece.</p>
      </header>

      <div className="shop__layout">
        <aside className="shop__filters">
          <div className="field">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              defaultValue={params.get('search') || ''}
              onChange={(e) => update('search', e.target.value)}
              placeholder="Search products"
            />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={params.get('category') || ''}
              onChange={(e) => update('category', e.target.value)}
            >
              <option value="">All</option>
              {(categories.data || []).map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
              {(categories.data || [])
                .flatMap((c) => c.children || [])
                .map((c: any) => (
                  <option key={c.id} value={c.slug}>
                    — {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="minPrice">Min price</label>
            <input
              id="minPrice"
              type="number"
              value={params.get('minPrice') || ''}
              onChange={(e) => update('minPrice', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="maxPrice">Max price</label>
            <input
              id="maxPrice"
              type="number"
              value={params.get('maxPrice') || ''}
              onChange={(e) => update('maxPrice', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="sort">Sort</label>
            <select
              id="sort"
              value={params.get('sort') || 'newest'}
              onChange={(e) => update('sort', e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option>
              <option value="name">Name</option>
            </select>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={params.get('newArrival') === 'true'}
              onChange={(e) => update('newArrival', e.target.checked ? 'true' : '')}
            />
            New arrivals
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={params.get('bestseller') === 'true'}
              onChange={(e) => update('bestseller', e.target.checked ? 'true' : '')}
            />
            Best sellers
          </label>
        </aside>

        <div>
          <p className="muted">{products.data?.total ?? 0} products</p>
          <div className="grid-products" style={{ marginTop: '1rem' }}>
            {(products.data?.items || []).map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="shop__pager">
            <button
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => update('page', String(page - 1))}
            >
              Previous
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button
              className="btn btn-outline"
              disabled={page >= pages}
              onClick={() => update('page', String(page + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
