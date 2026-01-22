import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { currentYear, currentMonth, getMonthsList, getYearsList, notNull, type Month } from '@/utils/date';
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

const custumMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

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

  // Org units from user
  const [Countries$] = useState<CountryMap[]>(user?.countries ?? []);
  const [Regions$] = useState<RegionsMap[]>(user?.regions ?? []);
  const [Prefectures$] = useState<PrefecturesMap[]>(user?.prefectures ?? []);
  const [Communes$] = useState<CommunesMap[]>(user?.communes ?? []);
  const [Hospitals$] = useState<HospitalsMap[]>(user?.hospitals ?? []);
  const [DistrictQuartiers$] = useState<DistrictQuartiersMap[]>(user?.districtQuartiers ?? []);
  const [Chws$] = useState<ChwsMap[]>(user?.chws ?? []);
  const [Recos$] = useState<RecosMap[]>(user?.recos ?? []);

  // Filtered org units (cascade)
  const [countries, setCountries] = useState<CountryMap[]>([]);
  const [regions, setRegions] = useState<RegionsMap[]>([]);
  const [prefectures, setPrefectures] = useState<PrefecturesMap[]>([]);
  const [communes, setCommunes] = useState<CommunesMap[]>([]);
  const [hospitals, setHospitals] = useState<HospitalsMap[]>([]);
  const [districtQuartiers, setDistrictQuartiers] = useState<DistrictQuartiersMap[]>([]);
  const [recos, setRecos] = useState<RecosMap[]>([]);

  // Form values
  const [formValues, setFormValues] = useState<Record<string, string[]>>({});

  // Date states
  const [year$] = useState<number>(currentYear());
  const [month$] = useState<Month>(currentMonth());
  const [Months$, setMonths$] = useState<Month[]>(getMonthsList().filter(m => month$ && m.uid <= month$.uid));
  const [Years$] = useState<number[]>(getYearsList().filter(y => year$ && y <= year$));

  const setMultipleValues = useCallback((field: string, values: string[]) => {
    setFormValues(prev => ({ ...prev, [field]: values }));
  }, []);

  const getVal = useCallback((field: string): string[] => {
    return formValues[field] || [];
  }, [formValues]);

  // Initialize form and countries
  useEffect(() => {
    if (Countries$.length > 0 && Object.keys(formValues).length === 0) {
      const initialForm: Record<string, string[]> = {
        year: [year$.toString()],
        months: showMonthsSelection ? [month$.id] : custumMonths,
        country: Countries$.map(c => c.id),
        region: [],
        prefecture: [],
        commune: [],
        hospital: [],
        district_quartier: [],
        recos: [],
      };
      setFormValues(initialForm);
      setCountries(Countries$);
    }
  }, [year$, month$, showMonthsSelection, Countries$, formValues]);

  // Cascade: Countries -> Regions
  useEffect(() => {
    const countryIds = formValues.country || [];
    if (notNull(countryIds) && Regions$.length > 0) {
      const filtered = Countries$.length > 0
        ? Regions$.filter(d => countryIds.includes(d.country_id))
        : Regions$;
      setRegions(filtered);
    } else {
      setRegions([]);
    }
  }, [formValues.country, Countries$, Regions$]);

  // Cascade: Regions -> Prefectures
  useEffect(() => {
    const regionIds = formValues.region || [];
    if (notNull(regionIds) && Prefectures$.length > 0) {
      const filtered = Regions$.length > 0
        ? Prefectures$.filter(d => regionIds.includes(d.region_id))
        : Prefectures$;
      setPrefectures(filtered);
    } else {
      setPrefectures([]);
    }
  }, [formValues.region, Regions$, Prefectures$]);

  // Cascade: Prefectures -> Communes
  useEffect(() => {
    const prefectureIds = formValues.prefecture || [];
    if (notNull(prefectureIds) && Communes$.length > 0) {
      const filtered = Prefectures$.length > 0
        ? Communes$.filter(d => prefectureIds.includes(d.prefecture_id))
        : Communes$;
      setCommunes(filtered);
    } else {
      setCommunes([]);
    }
  }, [formValues.prefecture, Prefectures$, Communes$]);

  // Cascade: Communes -> Hospitals
  useEffect(() => {
    const communeIds = formValues.commune || [];
    if (notNull(communeIds) && Hospitals$.length > 0) {
      const filtered = Communes$.length > 0
        ? Hospitals$.filter(d => communeIds.includes(d.commune_id))
        : Hospitals$;
      setHospitals(filtered);
    } else {
      setHospitals([]);
    }
  }, [formValues.commune, Communes$, Hospitals$]);

  // Cascade: Hospitals -> District Quartiers
  useEffect(() => {
    const hospitalIds = formValues.hospital || [];
    if (notNull(hospitalIds) && DistrictQuartiers$.length > 0) {
      const filtered = Hospitals$.length > 0
        ? DistrictQuartiers$.filter(d => hospitalIds.includes(d.hospital_id))
        : DistrictQuartiers$;
      setDistrictQuartiers(filtered);
    } else {
      setDistrictQuartiers([]);
    }
  }, [formValues.hospital, Hospitals$, DistrictQuartiers$]);

  // Cascade: District Quartiers -> Recos
  useEffect(() => {
    const districtIds = formValues.district_quartier || [];
    if (notNull(districtIds) && Recos$.length > 0) {
      const filtered = DistrictQuartiers$.length > 0
        ? Recos$.filter(d => districtIds.includes(d.district_quartier_id))
        : Recos$;
      setRecos(filtered);
    } else {
      setRecos(Recos$);
    }
  }, [formValues.district_quartier, DistrictQuartiers$, Recos$]);

  // Select all checkbox handlers
  const selectAll = useCallback((
    cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos' | 'year' | 'months',
    checked: boolean
  ) => {
    if (cible === 'country') {
      setMultipleValues(cible, checked ? countries.map(r => r.id) : []);
    }
    if (cible === 'region') {
      setMultipleValues(cible, checked ? regions.map(r => r.id) : []);
    }
    if (cible === 'prefecture') {
      setMultipleValues(cible, checked ? prefectures.map(r => r.id) : []);
    }
    if (cible === 'commune') {
      setMultipleValues(cible, checked ? communes.map(r => r.id) : []);
    }
    if (cible === 'hospital') {
      setMultipleValues(cible, checked ? hospitals.map(r => r.id) : []);
    }
    if (cible === 'district_quartier') {
      setMultipleValues(cible, checked ? districtQuartiers.map(r => r.id) : []);
    }
    if (cible === 'recos') {
      setMultipleValues(cible, checked ? recos.map(r => r.id) : []);
    }
    if (cible === 'year') {
      setMultipleValues(cible, checked ? Years$.map(y => y.toString()) : []);
    }
    if (cible === 'months') {
      setMultipleValues(cible, checked ? Months$.map(r => r.id) : []);
    }
  }, [countries, regions, prefectures, communes, hospitals, districtQuartiers, recos, Years$, Months$, setMultipleValues]);

  const isChecked = useCallback((
    cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos' | 'year' | 'months'
  ): boolean => {
    const value = getVal(cible);
    if (cible === 'country') return notNull(value) && value.length === countries.map(r => r.id).length;
    if (cible === 'region') return notNull(value) && value.length === regions.map(r => r.id).length;
    if (cible === 'prefecture') return notNull(value) && value.length === prefectures.map(r => r.id).length;
    if (cible === 'commune') return notNull(value) && value.length === communes.map(r => r.id).length;
    if (cible === 'hospital') return notNull(value) && value.length === hospitals.map(r => r.id).length;
    if (cible === 'district_quartier') return notNull(value) && value.length === districtQuartiers.map(r => r.id).length;
    if (cible === 'recos') return notNull(value) && value.length === recos.map(r => r.id).length;
    if (cible === 'year') return notNull(value) && value.length === Years$.length;
    if (cible === 'months') return notNull(value) && value.length === Months$.map(r => r.id).length;
    return false;
  }, [formValues, countries, regions, prefectures, communes, hospitals, districtQuartiers, recos, Years$, Months$]);

  const selectedLength = useCallback((
    cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos' | 'year' | 'months'
  ): number => {
    const val = getVal(cible);
    return notNull(val) ? val.length : 0;
  }, [formValues]);

  // Update months when year changes
  const initMonths = useCallback((selectedYear: number) => {
    if (selectedYear < year$) {
      setMonths$(getMonthsList());
    } else {
      setMonths$(getMonthsList().filter(m => month$ && m.uid <= month$.uid));
    }
  }, [year$, month$]);

  // Get ORG_UNITS object
  const ORG_UNITS = useMemo((): OrgUnitSelection => {
    const selectedRecos = recos.filter(r => (getVal('recos') ?? []).includes(r.id));
    return {
      country: countries.filter(r => (getVal('country') ?? []).includes(r.id)),
      region: regions.filter(r => (getVal('region') ?? []).includes(r.id)),
      prefecture: prefectures.filter(r => (getVal('prefecture') ?? []).includes(r.id)),
      commune: communes.filter(r => (getVal('commune') ?? []).includes(r.id)),
      hospital: hospitals.filter(r => (getVal('hospital') ?? []).includes(r.id)),
      district_quartier: districtQuartiers.filter(r => (getVal('district_quartier') ?? []).includes(r.id)),
      chws: Chws$.filter(r => (getVal('chw') ?? []).includes(r.id)),
      village_secteur: [],
      recos: selectedRecos,
      all_recos_ids: Recos$.map(r => r.id),
      selected_recos_ids: selectedRecos.map(r => r.id),
    };
  }, [formValues, countries, regions, prefectures, communes, hospitals, districtQuartiers, recos, Chws$, Recos$]);

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const formData: FilterFormData = {
      ...formValues,
      year: parseInt(getVal('year')[0]) || year$,
      months: getVal('months'),
      org_units: ORG_UNITS,
    };
    onChange?.(formData);
    onClose?.();
  }, [formValues, ORG_UNITS, year$, onChange, onClose]);

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
          <h2>🔍 Filtrer les données</h2>
        </div>
        <div className={styles.modalContent}>
          <form onSubmit={handleSubmit} noValidate>
            {/* Countries */}
            {(Countries$.length > 1 && (countries.length === 0 || countries.length > 1)) && (
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
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setMultipleValues('country', values);
                  }}
                >
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Regions */}
            {(Regions$.length > 1 && (regions.length === 0 || regions.length > 1)) && (
              <div className={styles.formGroup}>
                <label htmlFor="region">
                  Régions : ({selectedLength('region')})
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
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setMultipleValues('region', values);
                  }}
                >
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Prefectures */}
            {(Prefectures$.length > 1 && (prefectures.length === 0 || prefectures.length > 1)) && (
              <div className={styles.formGroup}>
                <label htmlFor="prefecture">
                  Préfectures : ({selectedLength('prefecture')})
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
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setMultipleValues('prefecture', values);
                  }}
                >
                  {prefectures.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Communes */}
            {(Communes$.length > 1 && (communes.length === 0 || communes.length > 1)) && (
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
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setMultipleValues('commune', values);
                  }}
                >
                  {communes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Hospitals */}
            {(Hospitals$.length > 1 && (hospitals.length === 0 || hospitals.length > 1)) && (
              <div className={styles.formGroup}>
                <label htmlFor="hospital">
                  Centre de santé : ({selectedLength('hospital')})
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
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setMultipleValues('hospital', values);
                  }}
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* District Quartiers */}
            {(DistrictQuartiers$.length > 1 && (districtQuartiers.length === 0 || districtQuartiers.length > 1)) && (
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
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setMultipleValues('district_quartier', values);
                  }}
                >
                  {districtQuartiers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Recos */}
            {showRecoLevel && (Recos$.length > 1 && (recos.length === 0 || recos.length > 1)) && (
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
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value);
                    setMultipleValues('recos', values);
                  }}
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
                <label htmlFor="year">Années :</label>
                <select
                  id="year"
                  className={styles.formControl}
                  value={getVal('year')[0] || year$}
                  onChange={(e) => {
                    setMultipleValues('year', [e.target.value]);
                    initMonths(parseInt(e.target.value));
                  }}
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
                      const values = Array.from(e.target.selectedOptions, opt => opt.value);
                      setMultipleValues('months', values);
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
