import { useState, useEffect, useCallback, useRef } from 'react';
import { OrgUnitsApi } from '@/services/api/api.service';
import type {
  CountryMap,
  RegionsMap,
  PrefecturesMap,
  CommunesMap,
  HospitalsMap,
  DistrictQuartiersMap,
  VillageSecteursMap,
  RecosMap,
} from '@/types';
import styles from './OrgUnitsFilter.module.css';

export interface OrgUnitSelection {
  countries: string[];
  regions: string[];
  prefectures: string[];
  communes: string[];
  hospitals: string[];
  districtQuartiers: string[];
  villageSecteurs: string[];
  recos: string[];
}

interface OrgUnitsFilterProps {
  onChange: (selection: OrgUnitSelection, recoIds: string[]) => void;
  showRecoLevel?: boolean;
  multiSelect?: boolean;
  className?: string;
}

export function OrgUnitsFilter({
  onChange,
  showRecoLevel = true,
  multiSelect = true,
  className = '',
}: OrgUnitsFilterProps) {
  // Data states
  const [countries, setCountries] = useState<CountryMap[]>([]);
  const [regions, setRegions] = useState<RegionsMap[]>([]);
  const [prefectures, setPrefectures] = useState<PrefecturesMap[]>([]);
  const [communes, setCommunes] = useState<CommunesMap[]>([]);
  const [hospitals, setHospitals] = useState<HospitalsMap[]>([]);
  const [districtQuartiers, setDistrictQuartiers] = useState<DistrictQuartiersMap[]>([]);
  const [villageSecteurs, setVillageSecteurs] = useState<VillageSecteursMap[]>([]);
  const [recos, setRecos] = useState<RecosMap[]>([]);

  // Selection states
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>([]);
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedDistrictQuartiers, setSelectedDistrictQuartiers] = useState<string[]>([]);
  const [selectedVillageSecteurs, setSelectedVillageSecteurs] = useState<string[]>([]);
  const [selectedRecos, setSelectedRecos] = useState<string[]>([]);

  // Loading states
  const [loading, setLoading] = useState<string | null>(null);

  // Load initial countries
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading('countries');
        const response = await OrgUnitsApi.getCountries();
        setCountries(response.data as CountryMap[] || []);
      } catch (error) {
        console.error('Error loading countries:', error);
      } finally {
        setLoading(null);
      }
    };
    loadCountries();
  }, []);

  // Load regions when countries change
  useEffect(() => {
    const loadRegions = async () => {
      if (selectedCountries.length === 0) {
        setRegions([]);
        setSelectedRegions([]);
        return;
      }
      try {
        setLoading('regions');
        const response = await OrgUnitsApi.getRegions({ countries: selectedCountries });
        setRegions(response.data as RegionsMap[] || []);
      } catch (error) {
        console.error('Error loading regions:', error);
      } finally {
        setLoading(null);
      }
    };
    loadRegions();
  }, [selectedCountries]);

  // Load prefectures when regions change
  useEffect(() => {
    const loadPrefectures = async () => {
      if (selectedRegions.length === 0) {
        setPrefectures([]);
        setSelectedPrefectures([]);
        return;
      }
      try {
        setLoading('prefectures');
        const response = await OrgUnitsApi.getPrefectures({ regions: selectedRegions });
        setPrefectures(response.data as PrefecturesMap[] || []);
      } catch (error) {
        console.error('Error loading prefectures:', error);
      } finally {
        setLoading(null);
      }
    };
    loadPrefectures();
  }, [selectedRegions]);

  // Load communes when prefectures change
  useEffect(() => {
    const loadCommunes = async () => {
      if (selectedPrefectures.length === 0) {
        setCommunes([]);
        setSelectedCommunes([]);
        return;
      }
      try {
        setLoading('communes');
        const response = await OrgUnitsApi.getCommunes({ prefectures: selectedPrefectures });
        setCommunes(response.data as CommunesMap[] || []);
      } catch (error) {
        console.error('Error loading communes:', error);
      } finally {
        setLoading(null);
      }
    };
    loadCommunes();
  }, [selectedPrefectures]);

  // Load hospitals when communes change
  useEffect(() => {
    const loadHospitals = async () => {
      if (selectedCommunes.length === 0) {
        setHospitals([]);
        setSelectedHospitals([]);
        return;
      }
      try {
        setLoading('hospitals');
        const response = await OrgUnitsApi.getHospitals({ communes: selectedCommunes });
        setHospitals(response.data as HospitalsMap[] || []);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      } finally {
        setLoading(null);
      }
    };
    loadHospitals();
  }, [selectedCommunes]);

  // Load district quartiers when hospitals change
  useEffect(() => {
    const loadDistrictQuartiers = async () => {
      if (selectedHospitals.length === 0) {
        setDistrictQuartiers([]);
        setSelectedDistrictQuartiers([]);
        return;
      }
      try {
        setLoading('districtQuartiers');
        const response = await OrgUnitsApi.getDistrictQuartiers({ hospitals: selectedHospitals });
        setDistrictQuartiers(response.data as DistrictQuartiersMap[] || []);
      } catch (error) {
        console.error('Error loading district quartiers:', error);
      } finally {
        setLoading(null);
      }
    };
    loadDistrictQuartiers();
  }, [selectedHospitals]);

  // Load village secteurs when district quartiers change
  useEffect(() => {
    const loadVillageSecteurs = async () => {
      if (selectedDistrictQuartiers.length === 0) {
        setVillageSecteurs([]);
        setSelectedVillageSecteurs([]);
        return;
      }
      try {
        setLoading('villageSecteurs');
        const response = await OrgUnitsApi.getVillageSecteurs({ district_quartiers: selectedDistrictQuartiers });
        setVillageSecteurs(response.data as VillageSecteursMap[] || []);
      } catch (error) {
        console.error('Error loading village secteurs:', error);
      } finally {
        setLoading(null);
      }
    };
    loadVillageSecteurs();
  }, [selectedDistrictQuartiers]);

  // Load recos when village secteurs change
  useEffect(() => {
    const loadRecos = async () => {
      if (!showRecoLevel || selectedVillageSecteurs.length === 0) {
        setRecos([]);
        setSelectedRecos([]);
        return;
      }
      try {
        setLoading('recos');
        const response = await OrgUnitsApi.getRecos({ village_secteurs: selectedVillageSecteurs });
        setRecos(response.data as RecosMap[] || []);
      } catch (error) {
        console.error('Error loading recos:', error);
      } finally {
        setLoading(null);
      }
    };
    loadRecos();
  }, [selectedVillageSecteurs, showRecoLevel]);

  // Utiliser useRef pour éviter la boucle infinie causée par onChange non mémoïsé
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Notify parent of selection changes
  const notifyChange = useCallback(() => {
    const selection: OrgUnitSelection = {
      countries: selectedCountries,
      regions: selectedRegions,
      prefectures: selectedPrefectures,
      communes: selectedCommunes,
      hospitals: selectedHospitals,
      districtQuartiers: selectedDistrictQuartiers,
      villageSecteurs: selectedVillageSecteurs,
      recos: selectedRecos,
    };

    // Get all reco IDs based on selection
    let recoIds: string[] = [];
    if (selectedRecos.length > 0) {
      recoIds = selectedRecos;
    } else if (selectedVillageSecteurs.length > 0) {
      recoIds = recos.map(r => r.id);
    }

    onChangeRef.current(selection, recoIds);
  }, [
    selectedCountries,
    selectedRegions,
    selectedPrefectures,
    selectedCommunes,
    selectedHospitals,
    selectedDistrictQuartiers,
    selectedVillageSecteurs,
    selectedRecos,
    recos,
  ]);

  useEffect(() => {
    notifyChange();
  }, [notifyChange]);

  // Handle selection change
  const handleSelectChange = (
    level: string,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (multiSelect) {
      setter(prev => {
        if (prev.includes(value)) {
          return prev.filter(v => v !== value);
        }
        return [...prev, value];
      });
    } else {
      setter([value]);
    }

    // Reset child selections
    switch (level) {
      case 'countries':
        setSelectedRegions([]);
        setSelectedPrefectures([]);
        setSelectedCommunes([]);
        setSelectedHospitals([]);
        setSelectedDistrictQuartiers([]);
        setSelectedVillageSecteurs([]);
        setSelectedRecos([]);
        break;
      case 'regions':
        setSelectedPrefectures([]);
        setSelectedCommunes([]);
        setSelectedHospitals([]);
        setSelectedDistrictQuartiers([]);
        setSelectedVillageSecteurs([]);
        setSelectedRecos([]);
        break;
      case 'prefectures':
        setSelectedCommunes([]);
        setSelectedHospitals([]);
        setSelectedDistrictQuartiers([]);
        setSelectedVillageSecteurs([]);
        setSelectedRecos([]);
        break;
      case 'communes':
        setSelectedHospitals([]);
        setSelectedDistrictQuartiers([]);
        setSelectedVillageSecteurs([]);
        setSelectedRecos([]);
        break;
      case 'hospitals':
        setSelectedDistrictQuartiers([]);
        setSelectedVillageSecteurs([]);
        setSelectedRecos([]);
        break;
      case 'districtQuartiers':
        setSelectedVillageSecteurs([]);
        setSelectedRecos([]);
        break;
      case 'villageSecteurs':
        setSelectedRecos([]);
        break;
    }
  };

  const renderSelect = (
    label: string,
    level: string,
    options: { id: string; name: string }[],
    selected: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    disabled: boolean = false
  ) => (
    <div className={styles.filterGroup}>
      <label className={styles.label}>
        {label}
        {loading === level && <span className={styles.loading}>...</span>}
      </label>
      <select
        className={styles.select}
        multiple={multiSelect}
        value={multiSelect ? selected : selected[0] || ''}
        onChange={(e) => {
          if (multiSelect) {
            const values = Array.from(e.target.selectedOptions, option => option.value);
            setter(values);
          } else {
            handleSelectChange(level, e.target.value, setter);
          }
        }}
        disabled={disabled || options.length === 0}
      >
        {!multiSelect && <option value="">-- Selectionner --</option>}
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.filtersGrid}>
        {renderSelect('Pays', 'countries', countries, selectedCountries, setSelectedCountries)}
        {renderSelect('Region', 'regions', regions, selectedRegions, setSelectedRegions, selectedCountries.length === 0)}
        {renderSelect('Prefecture', 'prefectures', prefectures, selectedPrefectures, setSelectedPrefectures, selectedRegions.length === 0)}
        {renderSelect('Commune', 'communes', communes, selectedCommunes, setSelectedCommunes, selectedPrefectures.length === 0)}
        {renderSelect('Hopital/CS', 'hospitals', hospitals, selectedHospitals, setSelectedHospitals, selectedCommunes.length === 0)}
        {renderSelect('District/Quartier', 'districtQuartiers', districtQuartiers, selectedDistrictQuartiers, setSelectedDistrictQuartiers, selectedHospitals.length === 0)}
        {renderSelect('Village/Secteur', 'villageSecteurs', villageSecteurs, selectedVillageSecteurs, setSelectedVillageSecteurs, selectedDistrictQuartiers.length === 0)}
        {showRecoLevel && renderSelect('RECO', 'recos', recos, selectedRecos, setSelectedRecos, selectedVillageSecteurs.length === 0)}
      </div>
    </div>
  );
}

export default OrgUnitsFilter;
