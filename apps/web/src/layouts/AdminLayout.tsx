import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const links = [
  ['', 'Dashboard'],
  ['products', 'Products'],
  ['categories', 'Categories'],
  ['orders', 'Orders'],
  ['customers', 'Customers'],
  ['payments', 'Payments'],
  ['coupons', 'Coupons'],
  ['shipping', 'Shipping'],
  ['cms', 'Content'],
  ['reports', 'Reports'],
  ['settings', 'Settings'],
  ['staff', 'Staff & Roles'],
] as const;

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand">
          LUNAIRE
          <span>Admin</span>
        </Link>
        <nav>
          {links.map(([path, label]) => (
            <NavLink key={path} to={path ? `/admin/${path}` : '/admin'} end={!path}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <p>
            {user?.firstName} {user?.lastName}
            <br />
            <span className="muted">{user?.role}</span>
          </p>
          <Link to="/">View store</Link>
          <button className="btn-ghost" onClick={() => logout()}>
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
