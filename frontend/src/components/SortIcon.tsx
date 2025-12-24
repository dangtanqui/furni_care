import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SortIconProps } from '../types/components/SortIcon';
import '../styles/components/SortIcon.css';

export default function SortIcon({ column, currentColumn, direction }: SortIconProps) {
  // Support both old single sort format and new array format
  if (Array.isArray(currentColumn)) {
    const sortEntry = currentColumn.find(s => s.column === column);
    if (!sortEntry) {
      return <ArrowUpDown className="sort-icon-default" />;
    }
    return sortEntry.direction === 'asc' 
      ? <ArrowUp className="sort-icon-active" />
      : <ArrowDown className="sort-icon-active" />;
  }
  
  // Legacy support for single column sort
  if (currentColumn !== column) {
    return <ArrowUpDown className="sort-icon-default" />;
  }
  return direction === 'asc' 
    ? <ArrowUp className="sort-icon-active" />
    : <ArrowDown className="sort-icon-active" />;
}

