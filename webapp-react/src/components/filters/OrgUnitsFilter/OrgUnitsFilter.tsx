import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  CountryMap,
  RegionsMap,
  PrefecturesMap,
  CommunesMap,
  HospitalsMap,
  DistrictQuartiersMap,
  VillageSecteursMap,
  ChwsMap,
  RecosMap,
} from '@/types';
import { useAuth } from '@store';
import { currentYear, currentMonth, getMonthsList, getYearsList, notNull } from '@/utils/date';
import styles from './OrgUnitsFilter.module.css';

export interface OrgUnitSelection {
  country: CountryMap[];
  region: RegionsMap[];
  prefecture: PrefecturesMap[];
  commune: CommunesMap[];
  hospital: HospitalsMap[];
  district_quartier: DistrictQuartiersMap[];
  chws: ChwsMap[];
  village_secteur: VillageSecteursMap[];
  recos: RecosMap[];
  all_recos_ids: string[];
  selected_recos_ids: string[];
}

export interface FilterFormData {
  year: number;
  months: string[];
  country?: string[];
  region?: string[];
  prefecture?: string[];
  commune?: string[];
  hospital?: string[];
  district_quartier?: string[];
  village_secteur?: string[];
  recos?: string[];
  org_units?: OrgUnitSelection;
}

interface OrgUnitsFilterProps {
  onChange?: (formData: FilterFormData) => void;
  showRecoLevel?: boolean;
  showMonthsSelection?: boolean;
  showYearsSelection?: boolean;
  showMultipleSelectionMonth?: boolean;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const ALL_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

export function OrgUnitsFilter({
  onChange,
  showRecoLevel = true,
  showMonthsSelection = true,
  showYearsSelection = true,
  showMultipleSelectionMonth = true,
  className = '',
  isOpen = false,
  onClose,
}: OrgUnitsFilterProps) {
  const { user } = useAuth();
  const isInitialized = useRef(false);

  // Static data from user (stable references)
  const Countries$ = useMemo(() => user?.countries ?? [], [user?.countries]);
  const Regions$ = useMemo(() => user?.regions ?? [], [user?.regions]);
  const Prefectures$ = useMemo(() => user?.prefectures ?? [], [user?.prefectures]);
  const Communes$ = useMemo(() => user?.communes ?? [], [user?.communes]);
  const Hospitals$ = useMemo(() => user?.hospitals ?? [], [user?.hospitals]);
  const DistrictQuartiers$ = useMemo(() => user?.districtQuartiers ?? [], [user?.districtQuartiers]);
  const Chws$ = useMemo(() => user?.chws ?? [], [user?.chws]);
  const Recos$ = useMemo(() => user?.recos ?? [], [user?.recos]);

  // Date values (stable)
  const year$ = useMemo(() => currentYear(), []);
  const month$ = useMemo(() => currentMonth(), []);
  const Years$ = useMemo(() => getYearsList().filter(y => y <= year$), [year$]);

  // Form state
  const [selectedYear, setSelectedYear] = useState<string>(year$.toString());
  const [selectedMonths, setSelectedMonths] = useState<string[]>(showMonthsSelection ? [month$.id] : ALL_MONTHS);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>([]);
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedDistrictQuartiers, setSelectedDistrictQuartiers] = useState<string[]>([]);
  const [selectedRecos, setSelectedRecos] = useState<string[]>([]);

  // Available months based on selected year
  const Months$ = useMemo(() => {
    const yearNum = parseInt(selectedYear);
    if (yearNum < year$) {
      return getMonthsList();
    }
    return getMonthsList().filter(m => m.uid <= month$.uid);
  }, [selectedYear, year$, month$]);

  // Initialize once when countries are available
  useEffect(() => {
    if (!isInitialized.current && Countries$.length > 0) {
      isInitialized.current = true;
      setSelectedCountries(Countries$.map(c => c.id));
    }
  }, [Countries$]);

  // Filtered options based on selections (computed, not state)
  const filteredRegions = useMemo(() => {
    if (!notNull(selectedCountries)) return [];
    return Regions$.filter(r => selectedCountries.includes(r.country_id));
  }, [selectedCountries, Regions$]);

  const filteredPrefectures = useMemo(() => {
    if (!notNull(selectedRegions)) return [];
    return Prefectures$.filter(p => selectedRegions.includes(p.region_id));
  }, [selectedRegions, Prefectures$]);

  const filteredCommunes = useMemo(() => {
    if (!notNull(selectedPrefectures)) return [];
    return Communes$.filter(c => selectedPrefectures.includes(c.prefecture_id));
  }, [selectedPrefectures, Communes$]);

  const filteredHospitals = useMemo(() => {
    if (!notNull(selectedCommunes)) return [];
    return Hospitals$.filter(h => selectedCommunes.includes(h.commune_id));
  }, [selectedCommunes, Hospitals$]);

  const filteredDistrictQuartiers = useMemo(() => {
    if (!notNull(selectedHospitals)) return [];
    return DistrictQuartiers$.filter(d => selectedHospitals.includes(d.hospital_id));
  }, [selectedHospitals, DistrictQuartiers$]);

  const filteredRecos = useMemo(() => {
    if (!notNull(selectedDistrictQuartiers)) return Recos$;
    return Recos$.filter(r => selectedDistrictQuartiers.includes(r.district_quartier_id));
  }, [selectedDistrictQuartiers, Recos$]);

  // Select all handlers
  const handleSelectAllCountries = useCallback((checked: boolean) => {
    setSelectedCountries(checked ? Countries$.map(c => c.id) : []);
  }, [Countries$]);

  const handleSelectAllRegions = useCallback((checked: boolean) => {
    setSelectedRegions(checked ? filteredRegions.map(r => r.id) : []);
  }, [filteredRegions]);

  const handleSelectAllPrefectures = useCallback((checked: boolean) => {
    setSelectedPrefectures(checked ? filteredPrefectures.map(p => p.id) : []);
  }, [filteredPrefectures]);

  const handleSelectAllCommunes = useCallback((checked: boolean) => {
    setSelectedCommunes(checked ? filteredCommunes.map(c => c.id) : []);
  }, [filteredCommunes]);

  const handleSelectAllHospitals = useCallback((checked: boolean) => {
    setSelectedHospitals(checked ? filteredHospitals.map(h => h.id) : []);
  }, [filteredHospitals]);

  const handleSelectAllDistrictQuartiers = useCallback((checked: boolean) => {
    setSelectedDistrictQuartiers(checked ? filteredDistrictQuartiers.map(d => d.id) : []);
  }, [filteredDistrictQuartiers]);

  const handleSelectAllRecos = useCallback((checked: boolean) => {
    setSelectedRecos(checked ? filteredRecos.map(r => r.id) : []);
  }, [filteredRecos]);

  const handleSelectAllMonths = useCallback((checked: boolean) => {
    setSelectedMonths(checked ? Months$.map(m => m.id) : []);
  }, [Months$]);

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const selectedCountryObjs = Countries$.filter(c => selectedCountries.includes(c.id));
    const selectedRegionObjs = filteredRegions.filter(r => selectedRegions.includes(r.id));
    const selectedPrefectureObjs = filteredPrefectures.filter(p => selectedPrefectures.includes(p.id));
    const selectedCommuneObjs = filteredCommunes.filter(c => selectedCommunes.includes(c.id));
    const selectedHospitalObjs = filteredHospitals.filter(h => selectedHospitals.includes(h.id));
    const selectedDistrictQuartierObjs = filteredDistrictQuartiers.filter(d => selectedDistrictQuartiers.includes(d.id));
    const selectedRecoObjs = filteredRecos.filter(r => selectedRecos.includes(r.id));

    const orgUnits: OrgUnitSelection = {
      country: selectedCountryObjs,
      region: selectedRegionObjs,
      prefecture: selectedPrefectureObjs,
      commune: selectedCommuneObjs,
      hospital: selectedHospitalObjs,
      district_quartier: selectedDistrictQuartierObjs,
      chws: Chws$.filter(c => selectedDistrictQuartiers.includes(c.district_quartier_id)),
      village_secteur: [],
      recos: selectedRecoObjs,
      all_recos_ids: Recos$.map(r => r.id),
      selected_recos_ids: selectedRecoObjs.map(r => r.id),
    };

    const formData: FilterFormData = {
      year: parseInt(selectedYear) || year$,
      months: selectedMonths,
      country: selectedCountries,
      region: selectedRegions,
      prefecture: selectedPrefectures,
      commune: selectedCommunes,
      hospital: selectedHospitals,
      district_quartier: selectedDistrictQuartiers,
      recos: selectedRecos,
      org_units: orgUnits,
    };

    onChange?.(formData);
    onClose?.();
  }, [
    selectedYear, selectedMonths, selectedCountries, selectedRegions,
    selectedPrefectures, selectedCommunes, selectedHospitals,
    selectedDistrictQuartiers, selectedRecos, Countries$, filteredRegions,
    filteredPrefectures, filteredCommunes, filteredHospitals,
    filteredDistrictQuartiers, filteredRecos, Chws$, Recos$, year$,
    onChange, onClose
  ]);

  // Handle close modal
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Keyboard handler for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} />
      <div className={`${styles.modal} ${className}`}>
        <div className={styles.modalHeader}>
          <span className={styles.close} onClick={handleClose}>&times;</span>
          <h2>Filtrer les donnees</h2>
        </div>
        <div className={styles.modalContent}>
          <form onSubmit={handleSubmit} noValidate>
            {/* Countries */}
            {Countries$.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="country">
                  Pays : ({selectedCountries.length}/{Countries$.length})
                  <input
                    id="all-country"
                    type="checkbox"
                    checked={selectedCountries.length === Countries$.length && Countries$.length > 0}
                    onChange={(e) => handleSelectAllCountries(e.target.checked)}
                  />
                </label>
                <select
                  id="country"
                  className={styles.formControl}
                  multiple
                  value={selectedCountries}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setSelectedCountries(values);
                  }}
                >
                  {Countries$.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Regions */}
            {Regions$.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="region">
                  Regions : ({selectedRegions.length}/{filteredRegions.length})
                  <input
                    id="all-region"
                    type="checkbox"
                    checked={selectedRegions.length === filteredRegions.length && filteredRegions.length > 0}
                    onChange={(e) => handleSelectAllRegions(e.target.checked)}
                  />
                </label>
                <select
                  id="region"
                  className={styles.formControl}
                  multiple
                  value={selectedRegions}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setSelectedRegions(values);
                  }}
                >
                  {filteredRegions.length > 0 ? (
                    filteredRegions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))
                  ) : (
                    <option disabled>Selectionnez un pays</option>
                  )}
                </select>
              </div>
            )}

            {/* Prefectures */}
            {Prefectures$.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="prefecture">
                  Prefectures : ({selectedPrefectures.length}/{filteredPrefectures.length})
                  <input
                    id="all-prefecture"
                    type="checkbox"
                    checked={selectedPrefectures.length === filteredPrefectures.length && filteredPrefectures.length > 0}
                    onChange={(e) => handleSelectAllPrefectures(e.target.checked)}
                  />
                </label>
                <select
                  id="prefecture"
                  className={styles.formControl}
                  multiple
                  value={selectedPrefectures}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setSelectedPrefectures(values);
                  }}
                >
                  {filteredPrefectures.length > 0 ? (
                    filteredPrefectures.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  ) : (
                    <option disabled>Selectionnez une region</option>
                  )}
                </select>
              </div>
            )}

            {/* Communes */}
            {Communes$.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="commune">
                  Communes : ({selectedCommunes.length}/{filteredCommunes.length})
                  <input
                    id="all-commune"
                    type="checkbox"
                    checked={selectedCommunes.length === filteredCommunes.length && filteredCommunes.length > 0}
                    onChange={(e) => handleSelectAllCommunes(e.target.checked)}
                  />
                </label>
                <select
                  id="commune"
                  className={styles.formControl}
                  multiple
                  value={selectedCommunes}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setSelectedCommunes(values);
                  }}
                >
                  {filteredCommunes.length > 0 ? (
                    filteredCommunes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  ) : (
                    <option disabled>Selectionnez une prefecture</option>
                  )}
                </select>
              </div>
            )}

            {/* Hospitals */}
            {Hospitals$.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="hospital">
                  Centre de sante : ({selectedHospitals.length}/{filteredHospitals.length})
                  <input
                    id="all-hospital"
                    type="checkbox"
                    checked={selectedHospitals.length === filteredHospitals.length && filteredHospitals.length > 0}
                    onChange={(e) => handleSelectAllHospitals(e.target.checked)}
                  />
                </label>
                <select
                  id="hospital"
                  className={styles.formControl}
                  multiple
                  value={selectedHospitals}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setSelectedHospitals(values);
                  }}
                >
                  {filteredHospitals.length > 0 ? (
                    filteredHospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))
                  ) : (
                    <option disabled>Selectionnez une commune</option>
                  )}
                </select>
              </div>
            )}

            {/* District Quartiers */}
            {DistrictQuartiers$.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="district_quartier">
                  Districts/Quartiers : ({selectedDistrictQuartiers.length}/{filteredDistrictQuartiers.length})
                  <input
                    id="all-district_quartier"
                    type="checkbox"
                    checked={selectedDistrictQuartiers.length === filteredDistrictQuartiers.length && filteredDistrictQuartiers.length > 0}
                    onChange={(e) => handleSelectAllDistrictQuartiers(e.target.checked)}
                  />
                </label>
                <select
                  id="district_quartier"
                  className={styles.formControl}
                  multiple
                  value={selectedDistrictQuartiers}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setSelectedDistrictQuartiers(values);
                  }}
                >
                  {filteredDistrictQuartiers.length > 0 ? (
                    filteredDistrictQuartiers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
                  ) : (
                    <option disabled>Selectionnez un centre de sante</option>
                  )}
                </select>
              </div>
            )}

            {/* Recos */}
            {showRecoLevel && Recos$.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="recos">
                  Recos : ({selectedRecos.length}/{filteredRecos.length})
                  <input
                    id="all-recos"
                    type="checkbox"
                    checked={selectedRecos.length === filteredRecos.length && filteredRecos.length > 0}
                    onChange={(e) => handleSelectAllRecos(e.target.checked)}
                  />
                </label>
                <select
                  id="recos"
                  className={styles.formControl}
                  multiple
                  value={selectedRecos}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setSelectedRecos(values);
                  }}
                >
                  {filteredRecos.length > 0 ? (
                    filteredRecos.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))
                  ) : (
                    <option disabled>Selectionnez un district/quartier</option>
                  )}
                </select>
              </div>
            )}

            {/* Years */}
            {showYearsSelection && Years$.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="year">Annees :</label>
                <select
                  id="year"
                  className={styles.formControl}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {Years$.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Months */}
            {showMonthsSelection && Months$.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="months">
                  Mois :
                  {showMultipleSelectionMonth && (
                    <>
                      ({selectedMonths.length})
                      <input
                        id="all-months"
                        type="checkbox"
                        checked={selectedMonths.length === Months$.length && Months$.length > 0}
                        onChange={(e) => handleSelectAllMonths(e.target.checked)}
                      />
                    </>
                  )}
                </label>
                <select
                  id="months"
                  className={styles.formControl}
                  multiple={showMultipleSelectionMonth}
                  value={showMultipleSelectionMonth ? selectedMonths : selectedMonths[0]}
                  onChange={(e) => {
                    if (showMultipleSelectionMonth) {
                      const values = Array.from(e.target.selectedOptions, opt => opt.value);
                      setSelectedMonths(values);
                    } else {
                      setSelectedMonths([e.target.value]);
                    }
                  }}
                >
                  {Months$.map(m => (
                    <option key={m.id} value={m.id}>{m.labelFR}</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.modalValidate}`}>
              Appliquer le filtre
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default OrgUnitsFilter;
