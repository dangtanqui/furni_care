/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SortIcon from '../../src/components/SortIcon';

describe('SortIcon', () => {
  describe('Array format (new)', () => {
    it('should show default icon when column is not in sort array', () => {
      const { container } = render(
        <SortIcon
          column="name"
          currentColumn={[{ column: 'status', direction: 'asc' }]}
          direction="asc"
        />
      );
      const icon = container.querySelector('.sort-icon-default');
      expect(icon).toBeInTheDocument();
    });

    it('should show ascending icon when column is sorted ascending', () => {
      const { container } = render(
        <SortIcon
          column="status"
          currentColumn={[{ column: 'status', direction: 'asc' }]}
          direction="asc"
        />
      );
      const icon = container.querySelector('.sort-icon-active');
      expect(icon).toBeInTheDocument();
    });

    it('should show descending icon when column is sorted descending', () => {
      const { container } = render(
        <SortIcon
          column="status"
          currentColumn={[{ column: 'status', direction: 'desc' }]}
          direction="desc"
        />
      );
      const icon = container.querySelector('.sort-icon-active');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Legacy single column format', () => {
    it('should show default icon when column does not match', () => {
      const { container } = render(
        <SortIcon
          column="name"
          currentColumn="status"
          direction="asc"
        />
      );
      const icon = container.querySelector('.sort-icon-default');
      expect(icon).toBeInTheDocument();
    });

    it('should show ascending icon when column matches and direction is asc', () => {
      const { container } = render(
        <SortIcon
          column="status"
          currentColumn="status"
          direction="asc"
        />
      );
      const icon = container.querySelector('.sort-icon-active');
      expect(icon).toBeInTheDocument();
    });

    it('should show descending icon when column matches and direction is desc', () => {
      const { container } = render(
        <SortIcon
          column="status"
          currentColumn="status"
          direction="desc"
        />
      );
      const icon = container.querySelector('.sort-icon-active');
      expect(icon).toBeInTheDocument();
    });
  });
});

