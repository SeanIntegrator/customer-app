import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthContext';

describe('AuthProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ user: null }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads session and renders children', async () => {
    render(
      <AuthProvider>
        <span data-testid="auth-child">in</span>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-child')).toHaveTextContent('in');
    });
    expect(fetchMock).toHaveBeenCalled();
  });
});
