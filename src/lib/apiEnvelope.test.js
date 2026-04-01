import { describe, it, expect } from 'vitest';
import { expectApiSuccess, pickErrorMessage, parseJsonSafe } from './apiEnvelope.js';

function mockRes(ok, jsonVal, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: () => Promise.resolve(jsonVal),
  };
}

describe('expectApiSuccess', () => {
  it('accepts ok:true with HTTP 200', async () => {
    const data = await expectApiSuccess(mockRes(true, { ok: true, foo: 1 }));
    expect(data.foo).toBe(1);
  });

  it('rejects when ok:false in body', async () => {
    await expect(
      expectApiSuccess(mockRes(true, { ok: false, error: 'nope' }), { fallbackError: 'fallback' })
    ).rejects.toThrow('nope');
  });

  it('uses legacy success when allowLegacySuccess', async () => {
    const data = await expectApiSuccess(mockRes(true, { success: true, x: 2 }), {
      allowLegacySuccess: true,
    });
    expect(data.x).toBe(2);
  });

  it('throws with fallback when HTTP not ok', async () => {
    await expect(
      expectApiSuccess(mockRes(false, { error: 'bad' }, 500), { fallbackError: 'fallback' })
    ).rejects.toThrow('bad');
  });
});

describe('pickErrorMessage', () => {
  it('prefers error over reason', () => {
    expect(pickErrorMessage({ error: 'e', reason: 'r' }, 'f')).toBe('e');
  });
});

describe('parseJsonSafe', () => {
  it('returns empty object on invalid json', async () => {
    const res = { json: () => Promise.reject(new Error('bad')) };
    const data = await parseJsonSafe(res);
    expect(data).toEqual({});
  });
});
