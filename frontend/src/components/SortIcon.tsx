import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SortIconProps } from '../types/components/SortIcon';
import '../styles/components/SortIcon.css';

export default function SortIcon({ column, currentColumn, direction }: SortIconProps) {
  if (currentColumn !== column) {
    return <ArrowUpDown className="sort-icon-default" />;
  }
  return direction === 'asc' 
    ? <ArrowUp className="sort-icon-active" />
    : <ArrowDown className="sort-icon-active" />;
}

