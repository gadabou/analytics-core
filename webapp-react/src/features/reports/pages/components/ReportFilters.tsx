import { useState } from 'react';
import { Card, CardBody } from '@components/ui';
import { OrgUnitsFilter, type FilterFormData } from '@components/filters/OrgUnitsFilter';
import { Button } from '@components/ui/Button/Button';
import { Search, RefreshCw, X, Filter } from 'lucide-react';
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

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
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

  const handleOrgUnitsFilterChange = (formData: FilterFormData) => {
    if (formData.org_units) {
      const { org_units } = formData;
      setSelectedRecos(org_units.selected_recos_ids);
      setOrgUnits({
        country: org_units.country[0]?.id,
        region: org_units.region[0]?.id,
        prefecture: org_units.prefecture[0]?.id,
        commune: org_units.commune[0]?.id,
        hospital: org_units.hospital[0]?.id,
        district: org_units.district_quartier[0]?.id,
        village: org_units.village_secteur[0]?.id,
      });
    }
    setSelectedMonths(formData.months.map(m => parseInt(m, 10)));
    setSelectedYear(formData.year);
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
                    Mois: <strong>{selectedMonths.map(m => String(m).padStart(2, '0')).join(', ')}</strong>
                  </>
                ) : (
                  'Aucun filtre appliqué'
                )}
              </p>
            </div>

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
