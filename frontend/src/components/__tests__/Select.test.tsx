import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../Select';

// Mock createPortal to render dropdown in the same container
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('Select', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    options: mockOptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render select button', () => {
      render(<Select {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show placeholder when no value is selected', () => {
      render(<Select {...defaultProps} placeholder="Choose option" />);
      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('should show selected option label', () => {
      render(<Select {...defaultProps} value="option1" />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Select {...defaultProps} className="custom-select" />);
      const button = screen.getByRole('button');
      expect(button.parentElement).toHaveClass('custom-select');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Select {...defaultProps} disabled />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<Select {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.getByText('Option 3')).toBeInTheDocument();
      });
    });

    it('should call onChange when option is selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Select {...defaultProps} onChange={handleChange} />);
      
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      const option1 = screen.getByText('Option 1');
      await user.click(option1);

      expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('should not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<Select {...defaultProps} disabled />);
      
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have id and name attributes when provided', () => {
      render(<Select {...defaultProps} id="test-select" name="testSelect" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'test-select');
      expect(button).toHaveAttribute('name', 'testSelect');
    });

    it('should call onOpen when dropdown opens', async () => {
      const user = userEvent.setup();
      const handleOpen = vi.fn();
      render(<Select {...defaultProps} onOpen={handleOpen} />);
      
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(handleOpen).toHaveBeenCalled();
      });
    });
  });
});


