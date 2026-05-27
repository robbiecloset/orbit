import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth';

function makeReq(authHeader?: string): Request {
  return { headers: authHeader ? { authorization: authHeader } : {} } as Request;
}

function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { res: { status, json } as unknown as Response, status, json };
}

describe('authMiddleware', () => {
  const next = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ORBIT_API_KEY = 'test-secret';
  });

  afterEach(() => {
    delete process.env.ORBIT_API_KEY;
  });

  it('rejects when Authorization header is missing', () => {
    const { res, status } = makeRes();
    authMiddleware(makeReq(), res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when scheme is not Bearer', () => {
    const { res, status } = makeRes();
    authMiddleware(makeReq('Basic abc123'), res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects wrong token', () => {
    const { res, status } = makeRes();
    authMiddleware(makeReq('Bearer wrong'), res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects empty bearer token', () => {
    const { res, status } = makeRes();
    authMiddleware(makeReq('Bearer '), res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when ORBIT_API_KEY is not set', () => {
    delete process.env.ORBIT_API_KEY;
    const { res, status } = makeRes();
    authMiddleware(makeReq('Bearer test-secret'), res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for a valid token', () => {
    const { res, status } = makeRes();
    authMiddleware(makeReq('Bearer test-secret'), res, next);
    expect(next).toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
  });
});
