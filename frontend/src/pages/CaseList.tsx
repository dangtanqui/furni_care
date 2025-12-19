import { Plus } from 'lucide-react';
import Button from '../fields/Button';
import { useAuth } from '../contexts/AuthContext';
import { useCaseList } from '../hooks/pages/useCaseList';
import CaseFilters from '../components/pages/case_list/CaseFilters';
import CaseTable from '../components/pages/case_list/CaseTable';
import '../styles/pages/CaseList.css';

export default function CaseList() {
  const { isCS } = useAuth();
  const {
    cases,
    filter,
    technicians,
    pagination,
    sort,
    loading,
    handleSort,
    handlePageChange,
    handleFilterChange,
  } = useCaseList();

  return (
    <div className="case-list-page">
      <div className="case-list-header">
        <h1 className="case-list-title">Case List</h1>
        {isCS && (
          <div className="case-list-create-container">
            <Button variant="primary" to="/cases/new" leftIcon={<Plus />}>
              Create Case
            </Button>
          </div>
        )}
      </div>

      <CaseFilters 
        filter={filter}
        technicians={technicians}
        onFilterChange={handleFilterChange}
      />

      <CaseTable 
        cases={cases}
        loading={loading}
        sort={sort}
        onSort={handleSort}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

