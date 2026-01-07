import { Plus } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useCaseList } from '../hooks/pages/useCaseList';
import CaseFilters from '../components/pages/case_list/CaseFilters';
import CaseTable from '../components/pages/case_list/CaseTable';
import SEO from '../components/SEO';
import StructuredData, { generateBreadcrumbSchema } from '../components/StructuredData';
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
    error,
    handleSort,
    handlePageChange,
    handleFilterChange,
  } = useCaseList();

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://furnicare.example.com';
  
  return (
    <>
      <SEO
        title="Case List"
        description="View and manage all warranty cases in the FurniCare system"
        url="/"
        noindex={true}
        nofollow={true}
      />
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Case List', url: `${siteUrl}/` },
        ])}
      />
      <div className="case-list-page">
        <section aria-labelledby="case-list-heading">
          <div className="case-list-header">
            <h1 id="case-list-heading" className="case-list-title">Case List</h1>
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

          {error && (
            <div className="case-list-error" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          {loading && (
            <div aria-live="polite" aria-busy="true" className="sr-only">
              Loading cases...
            </div>
          )}

          <CaseTable 
            cases={cases}
            loading={loading}
            sort={sort}
            onSort={handleSort}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </section>
      </div>
    </>
  );
}
