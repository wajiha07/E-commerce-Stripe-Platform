import { Navigate, Route, Routes } from 'react-router-dom';
import { StoreLayout } from './layouts/StoreLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { HomePage } from './pages/store/HomePage';
import { ShopPage } from './pages/store/ShopPage';
import { ProductPage } from './pages/store/ProductPage';
import { CartPage } from './pages/store/CartPage';
import { CheckoutPage } from './pages/store/CheckoutPage';
import { OrderConfirmationPage } from './pages/store/OrderConfirmationPage';
import { OrdersPage } from './pages/store/OrdersPage';
import { OrderDetailPage } from './pages/store/OrderDetailPage';
import { TrackOrderPage } from './pages/store/TrackOrderPage';
import { LoginPage } from './pages/store/LoginPage';
import { RegisterPage } from './pages/store/RegisterPage';
import { ProfilePage } from './pages/store/ProfilePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminProductForm } from './pages/admin/AdminProductForm';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminOrderDetail } from './pages/admin/AdminOrderDetail';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminShipping } from './pages/admin/AdminShipping';
import { AdminCms } from './pages/admin/AdminCms';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminStaff } from './pages/admin/AdminStaff';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order/confirmation/:id" element={<OrderConfirmationPage />} />
        <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="track" element={<TrackOrderPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>

      <Route
        path="admin"
        element={
          <ProtectedRoute staff>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="shipping" element={<AdminShipping />} />
        <Route path="cms" element={<AdminCms />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="staff" element={<AdminStaff />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
