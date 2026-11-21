import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  it('slugifies product names', () => {
    const svc = new CatalogService({} as any);
    expect((svc as any).slugify('Lumen Silk Slip Dress')).toBe('lumen-silk-slip-dress');
  });
});
