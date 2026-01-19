import { useState } from 'react';
import { Card, CardBody } from '@components/ui';
import { OrgUnitsFilter } from '@components/filters/OrgUnitsFilter/OrgUnitsFilter';
import { MonthYearFilter } from '@components/filters/MonthYearFilter/MonthYearFilter';
import { Button } from '@components/ui/Button/Button';
import { Search, RefreshCw, X } from 'lucide-react';
import type { FilterParams } from '@/stores/reports.store';
import styles from './ReportFilters.module.css';

interface ReportFiltersProps {
  onFilter: (filters: FilterParams) => void;
  isLoading?: boolean;
  initialValues?: Partial<FilterParams>;
}

export function ReportFilters({
  onFilter,
  isLoading = false,
  initialValues,
}: ReportFiltersProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    initialValues?.months || [currentMonth]
  );
  const [selectedYear, setSelectedYear] = useState<number>(initialValues?.year || currentYear);
  const [selectedRecos, setSelectedRecos] = useState<string[]>(initialValues?.recos || []);
  const [orgUnits, setOrgUnits] = useState<FilterParams['orgUnits']>(initialValues?.orgUnits || {});

  const handleFilter = () => {
    if (selectedRecos.length === 0) {
      return;
    }

    const filters: FilterParams = {
      months: selectedMonths,
      year: selectedYear,
      recos: selectedRecos,
      selectedRecosIds: selectedRecos,
      allRecosIds: selectedRecos,
      orgUnits,
    };

    onFilter(filters);
  };

  const handleReset = () => {
    setSelectedMonths([currentMonth]);
    setSelectedYear(currentYear);
    setSelectedRecos([]);
    setOrgUnits({});
  };

  const handleOrgUnitsChange = (recos: string[], orgUnitData?: FilterParams['orgUnits']) => {
    setSelectedRecos(recos);
    if (orgUnitData) {
      setOrgUnits(orgUnitData);
    }
  };

  return (
    <Card className={styles.filterCard}>
      <CardBody>
        <div className={styles.filtersContainer}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Unités Organisationnelles</label>
              <OrgUnitsFilter
                onChange={(selection, recoIds) => handleOrgUnitsChange(recoIds, {
                  country: selection.countries[0],
                  region: selection.regions[0],
                  prefecture: selection.prefectures[0],
                  commune: selection.communes[0],
                  hospital: selection.hospitals[0],
                  district: selection.districtQuartiers[0],
                  village: selection.villageSecteurs[0],
                })}
              />
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <MonthYearFilter
                onChange={(month, year) => {
                  setSelectedMonths([parseInt(month, 10)]);
                  setSelectedYear(year);
                }}
                defaultMonth={String(selectedMonths[0]).padStart(2, '0')}
                defaultYear={selectedYear}
              />
            </div>
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
