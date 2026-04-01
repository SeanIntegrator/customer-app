import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from './CartContext';

function Child() {
  return <div data-testid="cart-child">ok</div>;
}

describe('CartProvider', () => {
  it('renders children when wrapped in a router (useNavigate)', () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <Child />
        </CartProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('cart-child')).toHaveTextContent('ok');
  });
});
