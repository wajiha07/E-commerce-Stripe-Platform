import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const links = [
  ['', 'Overview'],
  ['onboarding', 'Stripe Connect'],
  ['products', 'Products'],
  ['orders', 'Orders'],
] as const;

export function SellerLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <Link to="/seller" className="admin-brand">
          LUNAIRE
          <span>Seller</span>
        </Link>
        <nav>
          {links.map(([path, label]) => (
            <NavLink key={path} to={path ? `/seller/${path}` : '/seller'} end={!path}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <p>
            {user?.firstName} {user?.lastName}
            <br />
            <span className="muted">SELLER</span>
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
