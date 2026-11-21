import { Link } from 'react-router-dom';
import { money } from '../lib/api';
import './ProductCard.css';

type Props = {
  product: {
    name: string;
    slug: string;
    basePrice: number | string;
    compareAt?: number | string | null;
    isNewArrival?: boolean;
    images?: { url: string; alt?: string | null }[];
  };
};

export function ProductCard({ product }: Props) {
  const image = product.images?.[0];
  return (
    <Link to={`/product/${product.slug}`} className="product-card">
      <div className="product-card__media">
        {image ? <img src={image.url} alt={image.alt || product.name} loading="lazy" /> : null}
        {product.isNewArrival ? <span className="product-card__tag">New</span> : null}
      </div>
      <div className="product-card__meta">
        <h3>{product.name}</h3>
        <p>
          {money(product.basePrice)}
          {product.compareAt ? (
            <span className="product-card__compare">{money(product.compareAt)}</span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
