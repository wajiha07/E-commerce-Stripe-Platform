import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('hashes refresh tokens consistently', () => {
    const svc = new AuthService({} as any, {} as any, {} as any);
    const a = (svc as any).hashToken('abc');
    const b = (svc as any).hashToken('abc');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
