import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('deve usar o header X-Request-Id existente', () => {
    const req = { headers: { 'x-request-id': 'existing-uuid' } } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.id).toBe('existing-uuid');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'existing-uuid');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('deve gerar UUID quando o header X-Request-Id estiver ausente', () => {
    const req = { headers: {} } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(typeof req.id).toBe('string');
    expect(req.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.id);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
