import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, money } from '../../lib/api';

export function AdminProducts() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api<any>('/admin/products?limit=48'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  return (
    <div className="admin-page">
      <div className="toolbar">
        <div>
          <h1>Products</h1>
          <p className="muted">{data?.total ?? 0} products</p>
        </div>
        <Link className="btn" to="/admin/products/new">
          Add product
        </Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Flags</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(data?.items || []).map((p: any) => (
            <tr key={p.id}>
              <td>
                <Link to={`/admin/products/${p.id}`}>{p.name}</Link>
              </td>
              <td>{money(p.basePrice)}</td>
              <td>
                {[p.isFeatured && 'Featured', p.isBestseller && 'Bestseller', p.isNewArrival && 'New']
                  .filter(Boolean)
                  .join(', ') || '—'}
              </td>
              <td>{p.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn-ghost" onClick={() => remove.mutate(p.id)}>
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
