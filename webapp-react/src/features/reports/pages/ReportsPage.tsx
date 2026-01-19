import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Calendar,
  Pill,
  Baby,
  Heart,
  Home,
  Package,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';
import { PageWrapper } from '@components/layout';
import { Card, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { GraduationLoader } from '@components/loaders/GraduationLoader/GraduationLoader';
import { useReports } from '@/hooks/useReports';
import { ReportFilters } from './components/ReportFilters';
import { ReportTable } from './components/ReportTable';
import type { ReportType } from '@/types/reports.types';
import type { FilterParams } from '@/stores/reports.store';
import styles from './ReportsPage.module.css';

interface Tab {
  id: ReportType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TABS: Tab[] = [
  { id: 'MONTHLY_ACTIVITY', label: "Rapport d'activités", icon: <Activity size={18} />, color: '#3b82f6' },
  { id: 'PROMOTION', label: 'Rapport Promotions', icon: <Heart size={18} />, color: '#ec4899' },
  { id: 'FAMILY_PLANNING', label: 'Rapport PF', icon: <Calendar size={18} />, color: '#8b5cf6' },
  { id: 'MORBIDITY', label: 'Rapport Morbidité', icon: <Pill size={18} />, color: '#ef4444' },
  { id: 'PCIMNE_NEWBORN', label: 'Rapport PCIMNE', icon: <Baby size={18} />, color: '#f59e0b' },
  { id: 'HOUSE_HOLD_RECAP', label: 'Rapport Ménages', icon: <Home size={18} />, color: '#22c55e' },
  { id: 'RECO_MEG_QUANTITIES', label: 'Rapport MEGs', icon: <Package size={18} />, color: '#06b6d4' },
];

export default function ReportsPage() {
  const {
    data,
    status,
    filters,
    activeTab,
    hideZeroValues,
    fetchReport,
    validateReport,
    cancelValidation,
    setActiveTab,
    setHideZeroValues,
    displayValue,
  } = useReports();

  const [currentTab, setCurrentTab] = useState<ReportType>(activeTab);

  const handleTabChange = (tabId: ReportType) => {
    setCurrentTab(tabId);
    setActiveTab(tabId);
  };

  const handleFilter = async (filterParams: FilterParams) => {
    await fetchReport(currentTab, filterParams);
  };

  const handleValidate = async () => {
    await validateReport(currentTab);
  };

  const handleCancelValidation = async () => {
    await cancelValidation(currentTab);
  };

  const currentStatus = status[currentTab];
  const currentData = data[currentTab];

  const renderTabContent = () => {
    return (
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <GraduationLoader isLoading={currentStatus.isLoading} />
        {!currentStatus.isLoading && (
          <ReportTable
            reportType={currentTab}
            data={currentData}
            displayValue={displayValue}
            isValidated={currentStatus.isValidated}
          />
        )}
      </motion.div>
    );
  };

  return (
    <PageWrapper
      title="Rapports"
      subtitle="Consultez et exportez les différents rapports de l'application"
    >
      {/* Filters */}
      <ReportFilters
        onFilter={handleFilter}
        isLoading={currentStatus.isLoading}
        initialValues={filters || undefined}
      />

      {/* Actions Bar */}
      <Card className={styles.actionsBar}>
        <CardBody>
          <div className={styles.actions}>
            <div className={styles.actionsLeft}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={hideZeroValues}
                  onChange={(e) => setHideZeroValues(e.target.checked)}
                />
                <span>Masquer les valeurs nulles</span>
              </label>
            </div>
            <div className={styles.actionsRight}>
              {currentStatus.isValidated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelValidation}
                  disabled={currentStatus.isCancellingValidation}
                >
                  <XCircle size={16} />
                  {currentStatus.isCancellingValidation ? 'Annulation...' : 'Annuler validation'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleValidate}
                  disabled={currentStatus.isValidating || !currentData}
                >
                  <CheckCircle size={16} />
                  {currentStatus.isValidating ? 'Validation...' : 'Valider'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={!currentStatus.isValidated}
                title={currentStatus.isValidated ? 'Envoyer au DHIS2' : 'Validez d\'abord le rapport'}
              >
                <Send size={16} />
                Envoyer DHIS2
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${currentTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(tab.id)}
              style={{ '--tab-color': tab.color } as React.CSSProperties}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
              {status[tab.id].isValidated && (
                <span className={styles.validatedBadge}>
                  <CheckCircle size={12} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
