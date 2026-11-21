import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ProductCard } from '../../components/ProductCard';
import './HomePage.css';

export function HomePage() {
  const banners = useQuery({
    queryKey: ['banners'],
    queryFn: () => api<any[]>('/cms/banners'),
  });
  const featured = useQuery({
    queryKey: ['featured'],
    queryFn: () => api<any>('/products?featured=true&limit=4'),
  });
  const bestsellers = useQuery({
    queryKey: ['bestsellers'],
    queryFn: () => api<any>('/products?bestseller=true&limit=4'),
  });
  const arrivals = useQuery({
    queryKey: ['arrivals'],
    queryFn: () => api<any>('/products?newArrival=true&limit=4'),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<any[]>('/categories'),
  });

  const hero = banners.data?.[0];

  return (
    <div className="home">
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(15,15,15,0.55), rgba(15,15,15,0.15)), url(${hero?.imageUrl || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=80'})`,
        }}
      >
        <div className="container hero__content fade-up">
          <p className="badge">LUNAIRE</p>
          <h1>{hero?.title || 'New Season, Soft Light'}</h1>
          <p>{hero?.subtitle || 'Editorial essentials for the modern wardrobe'}</p>
          <div className="hero__cta">
            <Link className="btn" to={hero?.ctaHref || '/shop'}>
              {hero?.ctaLabel || 'Shop the collection'}
            </Link>
            <Link className="btn btn-outline hero__outline" to="/shop?newArrival=true">
              New arrivals
            </Link>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <h2>Shop by category</h2>
            <p>Find your silhouette across women, men, and accessories.</p>
          </div>
        </div>
        <div className="category-grid">
          {(categories.data || []).map((cat) => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="category-tile">
              <img src={cat.imageUrl} alt={cat.name} />
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <h2>Featured</h2>
            <p>Pieces selected for form, fabric, and quiet presence.</p>
          </div>
          <Link to="/shop?featured=true">View all</Link>
        </div>
        <div className="grid-products">
          {(featured.data?.items || []).map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="promo container">
        <div>
          <p className="badge">Promotion</p>
          <h2>Use code LUNAIRE10</h2>
          <p className="muted">10% off orders over $100 — for a limited moment.</p>
          <Link className="btn" to="/shop">
            Shop now
          </Link>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <h2>Best sellers</h2>
            <p>Most-loved pieces from the house.</p>
          </div>
          <Link to="/shop?bestseller=true">View all</Link>
        </div>
        <div className="grid-products">
          {(bestsellers.data?.items || []).map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <h2>New arrivals</h2>
            <p>Fresh cuts just in from the atelier.</p>
          </div>
          <Link to="/shop?newArrival=true">View all</Link>
        </div>
        <div className="grid-products">
          {(arrivals.data?.items || []).map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
