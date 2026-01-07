import { useQuery } from '@tanstack/react-query';
import { getCases } from '../../api/cases';

interface UseCasesParams {
  page?: number;
  per_page?: number;
  sorts?: Array<{ column: string; direction: 'asc' | 'desc' }>;
  status?: string;
  case_type?: string;
  assigned_to?: string;
}

/**
 * React Query hook for fetching cases list
 */
export function useCases(params: UseCasesParams = {}) {
  const queryParams: Record<string, string> = {
    page: String(params.page || 1),
    per_page: String(params.per_page || 10),
  };

  if (params.sorts && params.sorts.length > 0) {
    queryParams.sorts = JSON.stringify(
      params.sorts.map((s) => ({ column: s.column, direction: s.direction }))
    );
  }

  if (params.status) queryParams.status = params.status;
  if (params.case_type) queryParams.case_type = params.case_type;
  if (params.assigned_to) queryParams.assigned_to = params.assigned_to;

  return useQuery({
    queryKey: ['cases', params],
    queryFn: async () => {
      const response = await getCases(queryParams);
      return response.data;
    },
    enabled: true,
  });
}
