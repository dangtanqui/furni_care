import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render with primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary');
    });

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary');
    });

    it('should render with tertiary variant', () => {
      render(<Button variant="tertiary">Tertiary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-tertiary');
    });

    it('should render with left icon', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      render(<Button leftIcon={<LeftIcon />}>With Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(<Button rightIcon={<RightIcon />}>With Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Sizes', () => {
    it('should render with small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should render with medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('should render with large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('Width', () => {
    it('should render with fullWidth', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('!w-full');
    });

    it('should render with alwaysAutoWidth', () => {
      render(<Button alwaysAutoWidth>Auto Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('!w-auto');
    });
  });

  describe('Link rendering', () => {
    it('should render as Link when to prop is provided', () => {
      render(<Button to="/test">Link Button</Button>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/test');
    });

    it('should render as anchor when href prop is provided', () => {
      render(<Button href="https://example.com">Anchor Button</Button>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });
});

