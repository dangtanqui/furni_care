import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaseFilters from '../../../../src/components/pages/case_list/CaseFilters';
/// <reference types="@testing-library/jest-dom" />

// Mock Select component
vi.mock('../../../../src/components/Select', () => ({
  default: ({ value, onChange, options, placeholder }: any) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid={`select-${placeholder}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

describe('CaseFilters', () => {
  const mockOnFilterChange = vi.fn();
  const mockTechnicians = [
    { id: 1, name: 'Tech 1' },
    { id: 2, name: 'Tech 2' },
  ];

  const defaultFilter = {
    status: '',
    case_type: '',
    assigned_to: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render filter toggle button', () => {
    render(
      <CaseFilters
        filter={defaultFilter}
        technicians={mockTechnicians}
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByRole('button', { name: 'Toggle filters' })).toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('should show active filter badge when filters are applied', () => {
    const filterWithStatus = { ...defaultFilter, status: 'open' };
    render(
      <CaseFilters
        filter={filterWithStatus}
        technicians={mockTechnicians}
        onFilterChange={mockOnFilterChange}
      />
    );

    const badge = screen.getByLabelText('Active filters');
    expect(badge).toBeInTheDocument();
  });

  it('should expand/collapse filters when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CaseFilters
        filter={defaultFilter}
        technicians={mockTechnicians}
        onFilterChange={mockOnFilterChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: 'Toggle filters' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should call onFilterChange when status filter changes', async () => {
    const user = userEvent.setup();
    render(
      <CaseFilters
        filter={defaultFilter}
        technicians={mockTechnicians}
        onFilterChange={mockOnFilterChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: 'Toggle filters' });
    await user.click(toggleButton);

    const statusSelect = screen.getByTestId('select-Filter by Status');
    await user.selectOptions(statusSelect, 'open');

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilter,
      status: 'open',
    });
  });

  it('should call onFilterChange when case_type filter changes', async () => {
    const user = userEvent.setup();
    render(
      <CaseFilters
        filter={defaultFilter}
        technicians={mockTechnicians}
        onFilterChange={mockOnFilterChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: 'Toggle filters' });
    await user.click(toggleButton);

    const typeSelect = screen.getByTestId('select-Filter by Type');
    await user.selectOptions(typeSelect, 'repair');

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilter,
      case_type: 'repair',
    });
  });

  it('should call onFilterChange when assigned_to filter changes', async () => {
    const user = userEvent.setup();
    render(
      <CaseFilters
        filter={defaultFilter}
        technicians={mockTechnicians}
        onFilterChange={mockOnFilterChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: 'Toggle filters' });
    await user.click(toggleButton);

    const assignedSelect = screen.getByTestId('select-Filter by Technician');
    await user.selectOptions(assignedSelect, '1');

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilter,
      assigned_to: '1',
    });
  });

  it('should include technicians in assigned_to options', async () => {
    const user = userEvent.setup();
    render(
      <CaseFilters
        filter={defaultFilter}
        technicians={mockTechnicians}
        onFilterChange={mockOnFilterChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: 'Toggle filters' });
    await user.click(toggleButton);

    const assignedSelect = screen.getByTestId('select-Filter by Technician');
    expect(assignedSelect).toHaveTextContent('Tech 1');
    expect(assignedSelect).toHaveTextContent('Tech 2');
  });
});

