import { useState, useCallback } from 'react';
import { OrgUnitsFilter, type OrgUnitSelection, type FilterFormData } from '../OrgUnitsFilter';
import { Filter, RefreshCw } from 'lucide-react';
import styles from './ReportFilters.module.css';

export interface ReportFilterValues {
  month: string;
  year: number;
  recos: string[];
  orgUnitSelection: OrgUnitSelection;
}

interface ReportFiltersProps {
  onFilter: (filters: ReportFilterValues) => void;
  onSync?: () => void;
  showSyncButton?: boolean;
  isSyncing?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ReportFilters({
  onFilter,
  onSync,
  showSyncButton = false,
  isSyncing = false,
  isLoading = false,
  className = '',
}: ReportFiltersProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [recos, setRecos] = useState<string[]>([]);
  const [orgUnitSelection, setOrgUnitSelection] = useState<OrgUnitSelection>({
    country: [],
    region: [],
    prefecture: [],
    commune: [],
    hospital: [],
    district_quartier: [],
    chws: [],
    village_secteur: [],
    recos: [],
    all_recos_ids: [],
    selected_recos_ids: [],
  });

  const handleOrgUnitsFilterChange = useCallback((formData: FilterFormData) => {
    if (formData.org_units) {
      setOrgUnitSelection(formData.org_units);
      setRecos(formData.org_units.selected_recos_ids);
    }
    setMonth(formData.months[0]);
    setYear(formData.year);
  }, []);

  const handleFilter = () => {
    onFilter({
      month,
      year,
      recos,
      orgUnitSelection,
    });
  };

  const canFilter = month && year && recos.length > 0;

  return (
    <>
      <div className={`${styles.container} ${className}`}>
        <div className={styles.filterInfo}>
          <p className={styles.filterText}>
            {canFilter ? (
              <>
                <strong>{recos.length}</strong> RECO(s) sélectionné(s) |
                Année: <strong>{year}</strong> |
                Mois: <strong>{month}</strong>
              </>
            ) : (
              'Aucun filtre appliqué - Cliquez sur "Filtrer" pour commencer'
            )}
          </p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.filterButton}
            onClick={() => setIsFilterModalOpen(true)}
          >
            <Filter size={18} />
            Filtrer
          </button>

          <button
            className={styles.applyButton}
            onClick={handleFilter}
            disabled={!canFilter || isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Chargement...
              </>
            ) : (
              <>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
                </svg>
                Appliquer
              </>
            )}
          </button>

          {showSyncButton && onSync && (
            <button
              className={styles.syncButton}
              onClick={onSync}
              disabled={isSyncing || isLoading}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={18} className={styles.spinning} />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Synchroniser
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <OrgUnitsFilter
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onChange={handleOrgUnitsFilterChange}
        showMonthsSelection={true}
        showYearsSelection={true}
        showMultipleSelectionMonth={false}
      />
    </>
  );
}

export default ReportFilters;
