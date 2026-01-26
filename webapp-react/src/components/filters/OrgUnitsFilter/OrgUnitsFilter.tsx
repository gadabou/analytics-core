import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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

const CUSTOM_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

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

  // Static data from user (source data - never changes)
  const Countries$ = useMemo(() => user?.countries ?? [], [user?.countries]);
  const Regions$ = useMemo(() => user?.regions ?? [], [user?.regions]);
  const Prefectures$ = useMemo(() => user?.prefectures ?? [], [user?.prefectures]);
  const Communes$ = useMemo(() => user?.communes ?? [], [user?.communes]);
  const Hospitals$ = useMemo(() => user?.hospitals ?? [], [user?.hospitals]);
  const DistrictQuartiers$ = useMemo(() => user?.districtQuartiers ?? [], [user?.districtQuartiers]);
  const Chws$ = useMemo(() => user?.chws ?? [], [user?.chws]);
  const Recos$ = useMemo(() => user?.recos ?? [], [user?.recos]);

  // Date values
  const year$ = useMemo(() => currentYear(), []);
  const month$ = useMemo(() => currentMonth(), []);
  const Years$ = useMemo(() => getYearsList().filter(y => y <= year$), [year$]);

  // Filtered org units state (cascading filtered data)
  const [countries, setCountries] = useState<CountryMap[]>([]);
  const [regions, setRegions] = useState<RegionsMap[]>([]);
  const [prefectures, setPrefectures] = useState<PrefecturesMap[]>([]);
  const [communes, setCommunes] = useState<CommunesMap[]>([]);
  const [hospitals, setHospitals] = useState<HospitalsMap[]>([]);
  const [districtQuartiers, setDistrictQuartiers] = useState<DistrictQuartiersMap[]>([]);
  const [recos, setRecos] = useState<RecosMap[]>([]);

  // Form values state
  const [formValues, setFormValues] = useState<Record<string, string[]>>({
    year: [year$.toString()],
    months: showMonthsSelection ? [month$.id] : CUSTOM_MONTHS,
    country: [],
    region: [],
    prefecture: [],
    commune: [],
    hospital: [],
    district_quartier: [],
    recos: [],
  });

  // Months based on selected year
  const [Months$, setMonths$] = useState(() =>
    getMonthsList().filter(m => m.uid <= month$.uid)
  );

  // Helper functions
  const getVal = useCallback((field: string): string[] => {
    return formValues[field] || [];
  }, [formValues]);

  const setMultipleValues = useCallback((field: string, values: string[]) => {
    setFormValues(prev => ({ ...prev, [field]: values }));
  }, []);

  // ============ CASCADE GENERATION FUNCTIONS ============
  // These mirror the Angular logic exactly - synchronous cascade

  const recosGenerate = useCallback((currentDistrictQuartiers: DistrictQuartiersMap[], districtQuartierIds: string[]) => {
    let filteredRecos: RecosMap[];

    if (notNull(districtQuartierIds) && Recos$.length > 0) {
      if (currentDistrictQuartiers.length > 0) {
        filteredRecos = Recos$.filter(d => districtQuartierIds.includes(d.district_quartier_id));
      } else {
        filteredRecos = Recos$;
      }
    } else {
      filteredRecos = Recos$;
    }

    setRecos(filteredRecos);
    return filteredRecos.map(r => r.id);
  }, [Recos$]);

  const districtsGenerate = useCallback((currentHospitals: HospitalsMap[], hospitalIds: string[]) => {
    let filteredDistricts: DistrictQuartiersMap[];

    if (notNull(hospitalIds) && DistrictQuartiers$.length > 0) {
      if (currentHospitals.length > 0) {
        filteredDistricts = DistrictQuartiers$.filter(d => hospitalIds.includes(d.hospital_id));
      } else {
        filteredDistricts = DistrictQuartiers$;
      }
    } else {
      filteredDistricts = [];
    }

    setDistrictQuartiers(filteredDistricts);
    const districtIds = filteredDistricts.map(r => r.id);
    const recoIds = recosGenerate(filteredDistricts, districtIds);

    return { districtIds, recoIds };
  }, [DistrictQuartiers$, recosGenerate]);

  const hospitalsGenerate = useCallback((currentCommunes: CommunesMap[], communeIds: string[]) => {
    let filteredHospitals: HospitalsMap[];

    if (notNull(communeIds) && Hospitals$.length > 0) {
      if (currentCommunes.length > 0) {
        filteredHospitals = Hospitals$.filter(d => communeIds.includes(d.commune_id));
      } else {
        filteredHospitals = Hospitals$;
      }
    } else {
      filteredHospitals = [];
    }

    setHospitals(filteredHospitals);
    const hospitalIds = filteredHospitals.map(r => r.id);
    const { districtIds, recoIds } = districtsGenerate(filteredHospitals, hospitalIds);

    return { hospitalIds, districtIds, recoIds };
  }, [Hospitals$, districtsGenerate]);

  const communesGenerate = useCallback((currentPrefectures: PrefecturesMap[], prefectureIds: string[]) => {
    let filteredCommunes: CommunesMap[];

    if (notNull(prefectureIds) && Communes$.length > 0) {
      if (currentPrefectures.length > 0) {
        filteredCommunes = Communes$.filter(d => prefectureIds.includes(d.prefecture_id));
      } else {
        filteredCommunes = Communes$;
      }
    } else {
      filteredCommunes = [];
    }

    setCommunes(filteredCommunes);
    const communeIds = filteredCommunes.map(r => r.id);
    const { hospitalIds, districtIds, recoIds } = hospitalsGenerate(filteredCommunes, communeIds);

    return { communeIds, hospitalIds, districtIds, recoIds };
  }, [Communes$, hospitalsGenerate]);

  const prefecturesGenerate = useCallback((currentRegions: RegionsMap[], regionIds: string[]) => {
    let filteredPrefectures: PrefecturesMap[];

    if (notNull(regionIds) && Prefectures$.length > 0) {
      if (currentRegions.length > 0) {
        filteredPrefectures = Prefectures$.filter(d => regionIds.includes(d.region_id));
      } else {
        filteredPrefectures = Prefectures$;
      }
    } else {
      filteredPrefectures = [];
    }

    setPrefectures(filteredPrefectures);
    const prefectureIds = filteredPrefectures.map(r => r.id);
    const { communeIds, hospitalIds, districtIds, recoIds } = communesGenerate(filteredPrefectures, prefectureIds);

    return { prefectureIds, communeIds, hospitalIds, districtIds, recoIds };
  }, [Prefectures$, communesGenerate]);

  const regionsGenerate = useCallback((currentCountries: CountryMap[], countryIds: string[]) => {
    let filteredRegions: RegionsMap[];

    if (notNull(countryIds) && Regions$.length > 0) {
      if (currentCountries.length > 0) {
        filteredRegions = Regions$.filter(d => countryIds.includes(d.country_id));
      } else {
        filteredRegions = Regions$;
      }
    } else {
      filteredRegions = [];
    }

    setRegions(filteredRegions);
    const regionIds = filteredRegions.map(r => r.id);
    const { prefectureIds, communeIds, hospitalIds, districtIds, recoIds } = prefecturesGenerate(filteredRegions, regionIds);

    return { regionIds, prefectureIds, communeIds, hospitalIds, districtIds, recoIds };
  }, [Regions$, prefecturesGenerate]);

  const countriesGenerate = useCallback(() => {
    const filteredCountries = Countries$;
    setCountries(filteredCountries);
    const countryIds = filteredCountries.map(c => c.id);
    const { regionIds, prefectureIds, communeIds, hospitalIds, districtIds, recoIds } = regionsGenerate(filteredCountries, countryIds);

    // Update all form values at once
    setFormValues(prev => ({
      ...prev,
      country: countryIds,
      region: regionIds,
      prefecture: prefectureIds,
      commune: communeIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [Countries$, regionsGenerate]);

  // Initialize when data is available
  useEffect(() => {
    if (!isInitialized.current && Countries$.length > 0) {
      isInitialized.current = true;
      countriesGenerate();
    }
  }, [Countries$, countriesGenerate]);

  // ============ EVENT HANDLERS ============

  // Handle country selection change
  const handleCountryChange = useCallback((newCountryIds: string[]) => {
    const currentCountries = Countries$.filter(c => newCountryIds.includes(c.id));
    setCountries(currentCountries.length > 0 ? currentCountries : Countries$);

    const { regionIds, prefectureIds, communeIds, hospitalIds, districtIds, recoIds } = regionsGenerate(
      currentCountries.length > 0 ? currentCountries : Countries$,
      newCountryIds
    );

    setFormValues(prev => ({
      ...prev,
      country: newCountryIds,
      region: regionIds,
      prefecture: prefectureIds,
      commune: communeIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [Countries$, regionsGenerate]);

  // Handle region selection change
  const handleRegionChange = useCallback((newRegionIds: string[]) => {
    const { prefectureIds, communeIds, hospitalIds, districtIds, recoIds } = prefecturesGenerate(regions, newRegionIds);

    setFormValues(prev => ({
      ...prev,
      region: newRegionIds,
      prefecture: prefectureIds,
      commune: communeIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [regions, prefecturesGenerate]);

  // Handle prefecture selection change
  const handlePrefectureChange = useCallback((newPrefectureIds: string[]) => {
    const { communeIds, hospitalIds, districtIds, recoIds } = communesGenerate(prefectures, newPrefectureIds);

    setFormValues(prev => ({
      ...prev,
      prefecture: newPrefectureIds,
      commune: communeIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [prefectures, communesGenerate]);

  // Handle commune selection change
  const handleCommuneChange = useCallback((newCommuneIds: string[]) => {
    const { hospitalIds, districtIds, recoIds } = hospitalsGenerate(communes, newCommuneIds);

    setFormValues(prev => ({
      ...prev,
      commune: newCommuneIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [communes, hospitalsGenerate]);

  // Handle hospital selection change
  const handleHospitalChange = useCallback((newHospitalIds: string[]) => {
    const { districtIds, recoIds } = districtsGenerate(hospitals, newHospitalIds);

    setFormValues(prev => ({
      ...prev,
      hospital: newHospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [hospitals, districtsGenerate]);

  // Handle district quartier selection change
  const handleDistrictQuartierChange = useCallback((newDistrictIds: string[]) => {
    const recoIds = recosGenerate(districtQuartiers, newDistrictIds);

    setFormValues(prev => ({
      ...prev,
      district_quartier: newDistrictIds,
      recos: recoIds,
    }));
  }, [districtQuartiers, recosGenerate]);

  // Handle recos selection change
  const handleRecosChange = useCallback((newRecoIds: string[]) => {
    setMultipleValues('recos', newRecoIds);
  }, [setMultipleValues]);

  // Select all handlers
  const selectAll = useCallback((
    cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos' | 'months',
    checked: boolean
  ) => {
    if (cible === 'country') {
      const ids = checked ? countries.map(r => r.id) : [];
      handleCountryChange(ids);
    } else if (cible === 'region') {
      const ids = checked ? regions.map(r => r.id) : [];
      handleRegionChange(ids);
    } else if (cible === 'prefecture') {
      const ids = checked ? prefectures.map(r => r.id) : [];
      handlePrefectureChange(ids);
    } else if (cible === 'commune') {
      const ids = checked ? communes.map(r => r.id) : [];
      handleCommuneChange(ids);
    } else if (cible === 'hospital') {
      const ids = checked ? hospitals.map(r => r.id) : [];
      handleHospitalChange(ids);
    } else if (cible === 'district_quartier') {
      const ids = checked ? districtQuartiers.map(r => r.id) : [];
      handleDistrictQuartierChange(ids);
    } else if (cible === 'recos') {
      const ids = checked ? recos.map(r => r.id) : [];
      handleRecosChange(ids);
    } else if (cible === 'months') {
      setMultipleValues('months', checked ? Months$.map(m => m.id) : []);
    }
  }, [countries, regions, prefectures, communes, hospitals, districtQuartiers, recos, Months$,
      handleCountryChange, handleRegionChange, handlePrefectureChange, handleCommuneChange,
      handleHospitalChange, handleDistrictQuartierChange, handleRecosChange, setMultipleValues]);

  // Check if all are selected
  const isChecked = useCallback((cible: string): boolean => {
    const value = getVal(cible);
    if (cible === 'country') return notNull(value) && value.length === countries.length && countries.length > 0;
    if (cible === 'region') return notNull(value) && value.length === regions.length && regions.length > 0;
    if (cible === 'prefecture') return notNull(value) && value.length === prefectures.length && prefectures.length > 0;
    if (cible === 'commune') return notNull(value) && value.length === communes.length && communes.length > 0;
    if (cible === 'hospital') return notNull(value) && value.length === hospitals.length && hospitals.length > 0;
    if (cible === 'district_quartier') return notNull(value) && value.length === districtQuartiers.length && districtQuartiers.length > 0;
    if (cible === 'recos') return notNull(value) && value.length === recos.length && recos.length > 0;
    if (cible === 'months') return notNull(value) && value.length === Months$.length && Months$.length > 0;
    return false;
  }, [getVal, countries, regions, prefectures, communes, hospitals, districtQuartiers, recos, Months$]);

  // Get selected count
  const selectedLength = useCallback((cible: string): number => {
    const val = getVal(cible);
    return notNull(val) ? val.length : 0;
  }, [getVal]);

  // Handle year change - update available months
  const initMonths = useCallback((selectedYear: number) => {
    if (selectedYear < year$) {
      setMonths$(getMonthsList());
    } else {
      setMonths$(getMonthsList().filter(m => m.uid <= month$.uid));
    }
    setMultipleValues('year', [selectedYear.toString()]);
  }, [year$, month$, setMultipleValues]);

  // Get ORG_UNITS object
  const getOrgUnits = useCallback((): OrgUnitSelection => {
    const selectedRecos = recos.filter(r => getVal('recos').includes(r.id));
    return {
      country: countries.filter(r => getVal('country').includes(r.id)),
      region: regions.filter(r => getVal('region').includes(r.id)),
      prefecture: prefectures.filter(r => getVal('prefecture').includes(r.id)),
      commune: communes.filter(r => getVal('commune').includes(r.id)),
      hospital: hospitals.filter(r => getVal('hospital').includes(r.id)),
      district_quartier: districtQuartiers.filter(r => getVal('district_quartier').includes(r.id)),
      chws: Chws$.filter(r => getVal('district_quartier').includes(r.district_quartier_id)),
      village_secteur: [],
      recos: selectedRecos,
      all_recos_ids: Recos$.map(r => r.id),
      selected_recos_ids: selectedRecos.map(r => r.id),
    };
  }, [countries, regions, prefectures, communes, hospitals, districtQuartiers, recos, Chws$, Recos$, getVal]);

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const formData: FilterFormData = {
      year: parseInt(getVal('year')[0]) || year$,
      months: getVal('months'),
      country: getVal('country'),
      region: getVal('region'),
      prefecture: getVal('prefecture'),
      commune: getVal('commune'),
      hospital: getVal('hospital'),
      district_quartier: getVal('district_quartier'),
      recos: getVal('recos'),
      org_units: getOrgUnits(),
    };

    onChange?.(formData);
    onClose?.();
  }, [getVal, getOrgUnits, year$, onChange, onClose]);

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

  // Helper to get values from multi-select
  const getSelectedValues = (e: React.ChangeEvent<HTMLSelectElement>): string[] => {
    return Array.from(e.target.selectedOptions, opt => opt.value);
  };

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
            {/* Countries - Show if: Countries$.length > 1 && countries.length === 0 || countries.length > 1 */}
            {((Countries$.length > 1 && countries.length === 0) || countries.length > 1) && (
              <div className={styles.formGroup}>
                <label htmlFor="country">
                  Pays : ({selectedLength('country')})
                  <input
                    id="all-country"
                    type="checkbox"
                    checked={isChecked('country')}
                    onChange={(e) => selectAll('country', e.target.checked)}
                  />
                </label>
                <select
                  id="country"
                  className={styles.formControl}
                  multiple
                  value={getVal('country')}
                  onChange={(e) => handleCountryChange(getSelectedValues(e))}
                >
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Regions */}
            {((Regions$.length > 1 && regions.length === 0) || regions.length > 1) && (
              <div className={styles.formGroup}>
                <label htmlFor="region">
                  Regions : ({selectedLength('region')})
                  <input
                    id="all-region"
                    type="checkbox"
                    checked={isChecked('region')}
                    onChange={(e) => selectAll('region', e.target.checked)}
                  />
                </label>
                <select
                  id="region"
                  className={styles.formControl}
                  multiple
                  value={getVal('region')}
                  onChange={(e) => handleRegionChange(getSelectedValues(e))}
                >
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Prefectures */}
            {((Prefectures$.length > 1 && prefectures.length === 0) || prefectures.length > 1) && (
              <div className={styles.formGroup}>
                <label htmlFor="prefecture">
                  Prefectures : ({selectedLength('prefecture')})
                  <input
                    id="all-prefecture"
                    type="checkbox"
                    checked={isChecked('prefecture')}
                    onChange={(e) => selectAll('prefecture', e.target.checked)}
                  />
                </label>
                <select
                  id="prefecture"
                  className={styles.formControl}
                  multiple
                  value={getVal('prefecture')}
                  onChange={(e) => handlePrefectureChange(getSelectedValues(e))}
                >
                  {prefectures.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Communes */}
            {((Communes$.length > 1 && communes.length === 0) || communes.length > 1) && (
              <div className={styles.formGroup}>
                <label htmlFor="commune">
                  Communes : ({selectedLength('commune')})
                  <input
                    id="all-commune"
                    type="checkbox"
                    checked={isChecked('commune')}
                    onChange={(e) => selectAll('commune', e.target.checked)}
                  />
                </label>
                <select
                  id="commune"
                  className={styles.formControl}
                  multiple
                  value={getVal('commune')}
                  onChange={(e) => handleCommuneChange(getSelectedValues(e))}
                >
                  {communes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Hospitals */}
            {((Hospitals$.length > 1 && hospitals.length === 0) || hospitals.length > 1) && (
              <div className={styles.formGroup}>
                <label htmlFor="hospital">
                  Centre de sante : ({selectedLength('hospital')})
                  <input
                    id="all-hospital"
                    type="checkbox"
                    checked={isChecked('hospital')}
                    onChange={(e) => selectAll('hospital', e.target.checked)}
                  />
                </label>
                <select
                  id="hospital"
                  className={styles.formControl}
                  multiple
                  value={getVal('hospital')}
                  onChange={(e) => handleHospitalChange(getSelectedValues(e))}
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* District Quartiers */}
            {((DistrictQuartiers$.length > 1 && districtQuartiers.length === 0) || districtQuartiers.length > 1) && (
              <div className={styles.formGroup}>
                <label htmlFor="district_quartier">
                  Districts/Quartiers : ({selectedLength('district_quartier')})
                  <input
                    id="all-district_quartier"
                    type="checkbox"
                    checked={isChecked('district_quartier')}
                    onChange={(e) => selectAll('district_quartier', e.target.checked)}
                  />
                </label>
                <select
                  id="district_quartier"
                  className={styles.formControl}
                  multiple
                  value={getVal('district_quartier')}
                  onChange={(e) => handleDistrictQuartierChange(getSelectedValues(e))}
                >
                  {districtQuartiers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Recos */}
            {showRecoLevel && ((Recos$.length > 1 && recos.length === 0) || recos.length > 1) && (
              <div className={styles.formGroup}>
                <label htmlFor="recos">
                  Recos : ({selectedLength('recos')})
                  <input
                    id="all-recos"
                    type="checkbox"
                    checked={isChecked('recos')}
                    onChange={(e) => selectAll('recos', e.target.checked)}
                  />
                </label>
                <select
                  id="recos"
                  className={styles.formControl}
                  multiple
                  value={getVal('recos')}
                  onChange={(e) => handleRecosChange(getSelectedValues(e))}
                >
                  {recos.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
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
                  value={getVal('year')[0] || year$.toString()}
                  onChange={(e) => initMonths(parseInt(e.target.value))}
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
                      ({selectedLength('months')})
                      <input
                        id="all-months"
                        type="checkbox"
                        checked={isChecked('months')}
                        onChange={(e) => selectAll('months', e.target.checked)}
                      />
                    </>
                  )}
                </label>
                <select
                  id="months"
                  className={styles.formControl}
                  multiple={showMultipleSelectionMonth}
                  value={showMultipleSelectionMonth ? getVal('months') : getVal('months')[0]}
                  onChange={(e) => {
                    if (showMultipleSelectionMonth) {
                      setMultipleValues('months', getSelectedValues(e));
                    } else {
                      setMultipleValues('months', [e.target.value]);
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
