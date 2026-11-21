import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function SellerProducts() {
  const qc = useQueryClient();
  const products = useQuery({
    queryKey: ['seller-products'],
    queryFn: () => api<any>('/sellers/me/products?limit=48'),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<any[]>('/categories'),
  });
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    basePrice: 120,
    imageUrl: '',
    size: 'M',
    color: 'Charcoal',
    stock: 10,
  });

  const flatCats = (categories.data || []).flatMap((c) => [
    { id: c.id, name: c.name },
    ...(c.children || []).map((ch: any) => ({ id: ch.id, name: `${c.name} / ${ch.name}` })),
  ]);

  const create = useMutation({
    mutationFn: () =>
      api('/sellers/me/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          categoryId: form.categoryId || flatCats[0]?.id,
          basePrice: Number(form.basePrice),
          isNewArrival: true,
          images: form.imageUrl ? [{ url: form.imageUrl, alt: form.name }] : [],
          variants: [
            {
              sku: `${form.name.slice(0, 6).toUpperCase()}-${Date.now().toString(36)}`,
              size: form.size,
              color: form.color,
              stock: Number(form.stock),
            },
          ],
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      setForm((f) => ({ ...f, name: '', description: '', imageUrl: '' }));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/sellers/me/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-products'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="admin-page">
      <h1>My products</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.6rem', maxWidth: 560, margin: '1rem 0' }}>
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select value={form.categoryId || flatCats[0]?.id || ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          {flatCats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} />
        <input placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <button className="btn" type="submit">Add product</button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(products.data?.items || []).map((p: any) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{money(p.basePrice)}</td>
              <td>{p.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn-ghost" onClick={() => remove.mutate(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
