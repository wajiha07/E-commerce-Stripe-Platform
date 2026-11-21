import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCartUi } from '../store/cart';
import { CartDrawer } from '../components/CartDrawer';
import './StoreLayout.css';

export function StoreLayout() {
  const { user, logout, isStaff, isSeller } = useAuth();
  const { itemCount, setOpen } = useCartUi();

  return (
    <div className="store">
      <header className="store-header">
        <div className="container store-header__inner">
          <nav className="store-header__nav">
            <NavLink to="/shop">Shop</NavLink>
            <NavLink to="/shop?category=women">Women</NavLink>
            <NavLink to="/shop?category=men">Men</NavLink>
          </nav>
          <Link to="/" className="store-header__brand" aria-label="LUNAIRE home">
            LUNAIRE
          </Link>
          <div className="store-header__actions">
            {isStaff ? <Link to="/admin">Admin</Link> : null}
            {isSeller ? <Link to="/seller">Seller</Link> : <Link to="/sell">Sell</Link>}
            {user ? (
              <>
                <Link to="/orders">Orders</Link>
                <Link to="/profile">{user.firstName}</Link>
                <button className="btn-ghost" onClick={() => logout()}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
            <button className="btn-ghost bag-btn" onClick={() => setOpen(true)}>
              Bag ({itemCount})
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="store-footer">
        <div className="container store-footer__inner">
          <div>
            <strong className="store-footer__brand">LUNAIRE</strong>
            <p className="muted">Contemporary fashion, quietly composed.</p>
          </div>
          <div className="store-footer__links">
            <Link to="/shop">Shop</Link>
            <Link to="/track">Track order</Link>
            <Link to="/register">Create account</Link>
          </div>
          <p className="muted">Images via Unsplash. Never stores card details.</p>
        </div>
      </footer>
      <CartDrawer />
    </div>
  );
}
