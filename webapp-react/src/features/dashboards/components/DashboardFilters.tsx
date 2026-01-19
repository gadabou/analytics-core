import { useState } from 'react';
import { Card, CardBody } from '@components/ui';
import { OrgUnitsFilter, type OrgUnitSelection } from '@components/filters/OrgUnitsFilter/OrgUnitsFilter';
import { MonthYearFilter } from '@components/filters/MonthYearFilter/MonthYearFilter';
import { Button } from '@components/ui/Button/Button';
import { Search, RefreshCw, X } from 'lucide-react';
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

  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialValues?.months?.[0] || currentMonth
  );
  const [selectedYear, setSelectedYear] = useState<number>(initialValues?.year || currentYear);
  const [selectedRecos, setSelectedRecos] = useState<string[]>(initialValues?.recos || []);
  const [startDate, setStartDate] = useState<string>(initialValues?.start_date || '');
  const [endDate, setEndDate] = useState<string>(initialValues?.end_date || '');

  const handleOrgUnitsChange = (_selection: OrgUnitSelection, recoIds: string[]) => {
    setSelectedRecos(recoIds);
  };

  const handleMonthYearChange = (month: string, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
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
    <Card className={styles.filterCard}>
      <CardBody>
        <div className={styles.filtersContainer}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Unités Organisationnelles</label>
              <OrgUnitsFilter
                onChange={handleOrgUnitsChange}
              />
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <MonthYearFilter
                onChange={handleMonthYearChange}
                defaultMonth={selectedMonth}
                defaultYear={selectedYear}
              />
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
          </div>

          <div className={styles.filterActions}>
            <Button
              variant="primary"
              onClick={handleFilter}
              disabled={isLoading || selectedRecos.length === 0}
              className={styles.filterButton}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className={styles.spinning} />
                  Chargement...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Filtrer
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
  );
}
