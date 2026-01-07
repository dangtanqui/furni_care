export interface PaginationProps {
  pagination: { page: number; per_page: number; total: number; total_pages: number };
  onPageChange: (page: number) => void;
  /** Item name for display (e.g., "cases", "items", "records"). Default: "items" */
  itemName?: string;
}
