import { useState, useCallback } from 'react';
import { OrgUnitsFilter, type OrgUnitSelection } from '../OrgUnitsFilter';
import { MonthYearFilter } from '../MonthYearFilter';
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
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [recos, setRecos] = useState<string[]>([]);
  const [orgUnitSelection, setOrgUnitSelection] = useState<OrgUnitSelection>({
    countries: [],
    regions: [],
    prefectures: [],
    communes: [],
    hospitals: [],
    districtQuartiers: [],
    villageSecteurs: [],
    recos: [],
  });

  const handleMonthYearChange = useCallback((newMonth: string, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
  }, []);

  const handleOrgUnitChange = useCallback((selection: OrgUnitSelection, recoIds: string[]) => {
    setOrgUnitSelection(selection);
    setRecos(recoIds);
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
    <div className={`${styles.container} ${className}`}>
      <div className={styles.filtersSection}>
        <div className={styles.dateFilters}>
          <MonthYearFilter
            onChange={handleMonthYearChange}
          />
        </div>

        <div className={styles.orgUnitFilters}>
          <h4 className={styles.sectionTitle}>Unites Organisationnelles</h4>
          <OrgUnitsFilter
            onChange={handleOrgUnitChange}
            showRecoLevel={true}
            multiSelect={false}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.filterButton}
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
                <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.586a1 1 0 0 1-.293.707l-6.414 6.414a1 1 0 0 0-.293.707V17l-4 4v-6.586a1 1 0 0 0-.293-.707L3.293 7.293A1 1 0 0 1 3 6.586V4z" />
              </svg>
              Filtrer
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
                <span className={styles.spinner} />
                Synchronisation...
              </>
            ) : (
              <>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                </svg>
                Synchroniser
              </>
            )}
          </button>
        )}
      </div>

      {!canFilter && (
        <p className={styles.hint}>
          Selectionnez un mois, une annee et au moins un RECO pour filtrer les donnees.
        </p>
      )}
    </div>
  );
}

export default ReportFilters;
