import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const categories = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api<any[]>('/admin/categories'),
  });
  const existing = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api<any>(`/admin/products/${id}`),
    enabled: !isNew,
  });

  const [form, setForm] = useState({
    name: '',
    description: '',
    story: '',
    categoryId: '',
    basePrice: 100,
    compareAt: '',
    isFeatured: false,
    isBestseller: false,
    isNewArrival: true,
    isActive: true,
    imageUrl: '',
    sku: '',
    size: 'M',
    color: 'Charcoal',
    stock: 10,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing.data) {
      const p = existing.data;
      setForm((f) => ({
        ...f,
        name: p.name,
        description: p.description,
        story: p.story || '',
        categoryId: p.categoryId,
        basePrice: Number(p.basePrice),
        compareAt: p.compareAt ? String(p.compareAt) : '',
        isFeatured: p.isFeatured,
        isBestseller: p.isBestseller,
        isNewArrival: p.isNewArrival,
        isActive: p.isActive,
        imageUrl: p.images?.[0]?.url || '',
        sku: p.variants?.[0]?.sku || '',
        size: p.variants?.[0]?.size || 'M',
        color: p.variants?.[0]?.color || 'Charcoal',
        stock: p.variants?.[0]?.stock ?? 10,
      }));
    }
  }, [existing.data]);

  useEffect(() => {
    if (!form.categoryId && categories.data?.length) {
      const flat = categories.data.flatMap((c) => [c, ...(c.children || [])]);
      setForm((f) => ({ ...f, categoryId: flat[0]?.id || '' }));
    }
  }, [categories.data, form.categoryId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const payload = {
      name: form.name,
      description: form.description,
      story: form.story || undefined,
      categoryId: form.categoryId,
      basePrice: Number(form.basePrice),
      compareAt: form.compareAt ? Number(form.compareAt) : undefined,
      isFeatured: form.isFeatured,
      isBestseller: form.isBestseller,
      isNewArrival: form.isNewArrival,
      isActive: form.isActive,
      images: form.imageUrl ? [{ url: form.imageUrl, alt: form.name }] : [],
      variants: [
        {
          sku: form.sku || `${form.name.slice(0, 6).toUpperCase()}-${Date.now().toString(36)}`,
          size: form.size,
          color: form.color,
          stock: Number(form.stock),
        },
      ],
    };
    try {
      if (isNew) {
        await api('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await api(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      }
      navigate('/admin/products');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const flatCats = (categories.data || []).flatMap((c) => [
    { id: c.id, name: c.name },
    ...(c.children || []).map((ch: any) => ({ id: ch.id, name: `${c.name} / ${ch.name}` })),
  ]);

  return (
    <div className="admin-page">
      <h1>{isNew ? 'Create product' : 'Edit product'}</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.85rem', maxWidth: 640 }}>
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            {flatCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Base price</label>
          <input
            type="number"
            value={form.basePrice}
            onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Image URL</label>
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        </div>
        <div className="field">
          <label>SKU / Size / Color / Stock</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 80px', gap: '0.5rem' }}>
            <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            />
          </div>
        </div>
        {(['isFeatured', 'isBestseller', 'isNewArrival', 'isActive'] as const).map((key) => (
          <label key={key} className="check">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
            />
            {key}
          </label>
        ))}
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" type="submit">
          Save
        </button>
      </form>
    </div>
  );
}
