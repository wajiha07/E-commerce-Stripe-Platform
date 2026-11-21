import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, money } from '../../lib/api';
import { getGuestId } from '../../lib/guest';
import { useCartUi } from '../../store/cart';
import './ProductPage.css';

export function ProductPage() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const { setOpen, setItemCount } = useCartUi();
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api<any>(`/products/${slug}`),
  });

  const colors = useMemo(
    () => [...new Set((product?.variants || []).map((v: any) => v.color))] as string[],
    [product],
  );
  const [color, setColor] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [imageIdx, setImageIdx] = useState(0);

  const activeColor = color || colors[0] || '';
  const sizes = useMemo(
    () =>
      (product?.variants || [])
        .filter((v: any) => v.color === activeColor)
        .map((v: any) => v.size),
    [product, activeColor],
  );
  const activeSize = size || sizes[0] || '';
  const variant = (product?.variants || []).find(
    (v: any) => v.color === activeColor && v.size === activeSize,
  );

  const add = useMutation({
    mutationFn: () =>
      api('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          variantId: variant.id,
          quantity: qty,
          guestId: getGuestId(),
        }),
      }),
    onSuccess: (cart: any) => {
      qc.setQueryData(['cart'], cart);
      setItemCount(cart.itemCount);
      setOpen(true);
    },
  });

  if (isLoading) return <div className="container" style={{ padding: '4rem 0' }}>Loading…</div>;
  if (error || !product)
    return <div className="container" style={{ padding: '4rem 0' }}>Product not found.</div>;

  const price = Number(variant?.price ?? product.basePrice);

  return (
    <div className="container pdp">
      <div className="pdp__gallery">
        <div className="pdp__main-image">
          <img
            key={product.images[imageIdx]?.url}
            src={product.images[imageIdx]?.url}
            alt={product.name}
          />
        </div>
        <div className="pdp__thumbs">
          {product.images.map((img: any, i: number) => (
            <button key={img.id} onClick={() => setImageIdx(i)} className={i === imageIdx ? 'active' : ''}>
              <img src={img.url} alt="" />
            </button>
          ))}
        </div>
      </div>

      <div className="pdp__info fade-up">
        <p className="badge">{product.category?.name}</p>
        {product.seller ? (
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            Sold by <strong>{product.seller.storeName}</strong>
          </p>
        ) : null}
        <h1>{product.name}</h1>
        <p className="pdp__price">
          {money(price)}
          {product.compareAt ? <span>{money(product.compareAt)}</span> : null}
        </p>
        <p>{product.description}</p>
        {product.story ? <p className="muted">{product.story}</p> : null}

        <div className="pdp__options">
          <div>
            <label>Color</label>
            <div className="swatches">
              {colors.map((c) => {
                const hex = product.variants.find((v: any) => v.color === c)?.colorHex;
                return (
                  <button
                    key={c}
                    className={c === activeColor ? 'active' : ''}
                    style={{ background: hex || '#ddd' }}
                    onClick={() => {
                      setColor(c);
                      setSize('');
                    }}
                    title={c}
                    aria-label={c}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <label>Size</label>
            <div className="sizes">
              {sizes.map((s: string) => (
                <button
                  key={s}
                  className={s === activeSize ? 'active' : ''}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ maxWidth: 120 }}>
            <label htmlFor="qty">Quantity</label>
            <input
              id="qty"
              type="number"
              min={1}
              max={variant?.stock || 1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>
          <p className="muted">
            {variant ? (variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock') : 'Select options'}
          </p>
        </div>

        <button
          className="btn"
          disabled={!variant || variant.stock < 1 || add.isPending}
          onClick={() => add.mutate()}
        >
          {add.isPending ? 'Adding…' : 'Add to bag'}
        </button>
        {add.isError ? <p className="error-text">{(add.error as Error).message}</p> : null}
      </div>
    </div>
  );
}
