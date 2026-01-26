# Comparaison des modules OrgUnitsFilter

Sources comparées :
- `/home/doctorpy/Integrate Health Dropbox/Djakpo GADO/projets/kendeya-analytics-core/webapp-react/src/components/filters/OrgUnitsFilter`
- `/home/doctorpy/Integrate Health Dropbox/Djakpo GADO/projets/webapp-react/src/components/filters/OrgUnitsFilter`

## Résumé rapide
- Le module **kendeya-analytics-core** est un **filtre en modal** avec **gestion interne complète** (données + cascade synchrones) et **sélection par formulaires**.
- Le module **webapp-react** est un **filtre en grille** qui **charge les données via API** et **remonte la sélection en continu**.

## Différences par fichier

### `index.ts`
- **kendeya-analytics-core** exporte `OrgUnitSelection` **et** `FilterFormData`.
- **webapp-react** exporte **uniquement** `OrgUnitSelection`.

### `OrgUnitsFilter.module.css`
- **kendeya-analytics-core** contient un style complet de **modal** (overlay, header, fermeture, animations, boutons, responsive) + styles historiques.
- **webapp-react** ne garde que les **styles “container/filtersGrid/controls”** et ajoute deux breakpoints responsive simples.

### `OrgUnitsFilter.tsx`
#### 1) Interface / API
- **kendeya-analytics-core** :
  - `onChange?: (formData: FilterFormData) => void`
  - Props: `showRecoLevel`, `showDateSelection`, `isOpen`, `onClose`
  - Modèle de données riche `FilterFormData` incluant dates + objets org_units détaillés
- **webapp-react** :
  - `onChange: (selection: OrgUnitSelection, recoIds: string[]) => void`
  - Props: `showRecoLevel`, `multiSelect`
  - Modèle `OrgUnitSelection` = listes d’IDs uniquement

#### 2) Source des données
- **kendeya-analytics-core** :
  - Données issues de `useAuth()` (cache utilisateur), en mémoire.
  - Cascade **synchrone** via filtres locaux.
- **webapp-react** :
  - Chargement via `OrgUnitsApi` (requêtes asynchrones) par niveau.
  - États de chargement par niveau (`loading`).

#### 3) Comportement UI
- **kendeya-analytics-core** :
  - **Modal** avec overlay + fermeture (clic overlay / bouton / Escape).
  - Bouton de validation “Appliquer le filtre”.
  - Sélecteurs multi avec “tout sélectionner” par niveau.
  - Sélection des dates (début/fin) incluse.
- **webapp-react** :
  - **Grille** de filtres sans modal.
  - Notification automatique des changements (pas de bouton submit).
  - Gestion `multiSelect` true/false.
  - Pas de date, pas de “select all”.

#### 4) Logique de cascade
- **kendeya-analytics-core** :
  - Cascade **locale** : quand on change un niveau, les niveaux enfants sont recalculés + les IDs mis à jour.
  - Maintient `org_units` complet avec objets, plus `all_recos_ids` et `selected_recos_ids`.
- **webapp-react** :
  - Cascade **API** : changement d’un niveau déclenche un reload du niveau enfant.
  - `notifyChange` envoie toujours la sélection courante + IDs RECO calculés.

#### 5) Différences de structure React
- **kendeya-analytics-core** :
  - Utilise `useMemo` pour les données statiques et `useEffect` d’initialisation.
  - Filtres en `<select multiple>` + gestion explicite des checkboxes "select all".
- **webapp-react** :
  - Utilise plusieurs `useEffect` pour charger les niveaux.
  - Composant de rendu `renderSelect` réutilisé.

## Fichiers présents uniquement côté kendeya-analytics-core
- `README.md`

---
Document généré automatiquement à partir d’un diff `diff -ru`.
