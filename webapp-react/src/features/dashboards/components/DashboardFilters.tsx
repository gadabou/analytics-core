import { useState } from 'react';
import { Card, CardBody } from '@components/ui';
import { OrgUnitsFilter, type FilterFormData } from '@components/filters/OrgUnitsFilter';
import { Button } from '@components/ui/Button/Button';
import { Search, RefreshCw, X, Filter } from 'lucide-react';
import styles from './DashboardFilters.module.css';

interface FilterValues {
  months: string[];
  year: number;
  recos: string[];
  start_date?: string;
  end_date?: string;
}

interface DashboardFiltersProps {
  onFilter: (filters: FilterValues) => void;
  isLoading?: boolean;
  showDateRange?: boolean;
  initialValues?: Partial<FilterValues>;
}

export function DashboardFilters({
  onFilter,
  isLoading = false,
  showDateRange = false,
  initialValues,
}: DashboardFiltersProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialValues?.months?.[0] || currentMonth
  );
  const [selectedYear, setSelectedYear] = useState<number>(initialValues?.year || currentYear);
  const [selectedRecos, setSelectedRecos] = useState<string[]>(initialValues?.recos || []);
  const [startDate, setStartDate] = useState<string>(initialValues?.start_date || '');
  const [endDate, setEndDate] = useState<string>(initialValues?.end_date || '');

  const handleOrgUnitsFilterChange = (formData: FilterFormData) => {
    if (formData.org_units) {
      setSelectedRecos(formData.org_units.selected_recos_ids);
    }
    setSelectedMonth(formData.months[0]);
    setSelectedYear(formData.year);
  };

  const handleFilter = () => {
    if (selectedRecos.length === 0) {
      return;
    }

    const filters: FilterValues = {
      months: [selectedMonth],
      year: selectedYear,
      recos: selectedRecos,
    };

    if (showDateRange) {
      filters.start_date = startDate;
      filters.end_date = endDate;
    }

    onFilter(filters);
  };

  const handleReset = () => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setSelectedRecos([]);
    setStartDate('');
    setEndDate('');
  };

  return (
    <>
      <Card className={styles.filterCard}>
        <CardBody>
          <div className={styles.filtersContainer}>
            <div className={styles.filterInfo}>
              <p className={styles.filterText}>
                {selectedRecos.length > 0 ? (
                  <>
                    <strong>{selectedRecos.length}</strong> RECO(s) sélectionné(s) |
                    Année: <strong>{selectedYear}</strong> |
                    Mois: <strong>{selectedMonth}</strong>
                  </>
                ) : (
                  'Aucun filtre appliqué'
                )}
              </p>
            </div>

            {showDateRange && (
              <div className={styles.dateRangeGroup}>
                <div className={styles.dateInput}>
                  <label className={styles.filterLabel}>Date début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.dateInput}>
                  <label className={styles.filterLabel}>Date fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>
            )}

            <div className={styles.filterActions}>
              <Button
                variant="outline"
                onClick={() => setIsFilterModalOpen(true)}
                className={styles.filterButton}
              >
                <Filter size={16} />
                Filtrer
              </Button>

              <Button
                variant="primary"
                onClick={handleFilter}
                disabled={isLoading || selectedRecos.length === 0}
                className={styles.applyButton}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className={styles.spinning} />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Appliquer
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className={styles.resetButton}
              >
                <X size={16} />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

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
