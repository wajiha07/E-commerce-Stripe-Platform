import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function AdminCms() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api<any[]>('/admin/banners'),
  });
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaLabel: 'Shop',
    ctaHref: '/shop',
  });
  const create = useMutation({
    mutationFn: () => api('/admin/banners', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/banners/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="admin-page">
      <h1>Content management</h1>
      <p className="muted">Homepage banners and promotional sections</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.6rem', maxWidth: 560, margin: '1rem 0' }}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <input placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required />
        <button className="btn" type="submit">
          Add banner
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>CTA</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(data || []).map((b) => (
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>
                {b.ctaLabel} → {b.ctaHref}
              </td>
              <td>{b.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn-ghost" onClick={() => remove.mutate(b.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
