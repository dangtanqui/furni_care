export interface SortIconProps {
  column: string;
  currentColumn: string | Array<{ column: string; direction: 'asc' | 'desc' }>;
  direction: 'asc' | 'desc';
}

