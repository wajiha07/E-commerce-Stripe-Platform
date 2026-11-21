import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function AdminCategories() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api<any[]>('/admin/categories'),
  });
  const [name, setName] = useState('');
  const create = useMutation({
    mutationFn: () => api('/admin/categories', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="admin-page">
      <h1>Categories</h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category" required />
        <button className="btn" type="submit">
          Add
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Products</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(data || []).map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.slug}</td>
              <td>{c._count?.products ?? 0}</td>
              <td>
                <button className="btn-ghost" onClick={() => remove.mutate(c.id)}>
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
