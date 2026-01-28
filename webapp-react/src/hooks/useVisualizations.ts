/**
 * Hook for fetching and managing visualizations from the database
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, initializeTestData } from '@/utils/TestData';
import type { ChartDataItem } from '@components/charts';

// ============================================================================
// TYPES
// ============================================================================

export type VisualizationType = 'dashboard' | 'report';

export type ChartVariant =
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'radialBar'
  | 'scatter'
  | 'composed'
  | 'treemap'
  | 'funnel'
  | 'table';

export interface LayoutDimension {
  dimension: string;
  items: string[];
}

export interface VisualizationOptions {
  title?: string;
  subtitle?: string;
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
  stacked: boolean;
  animation: boolean;
  colors?: string[];
}

export interface StoredVisualization {
  id: string;
  name: string;
  description?: string;
  type: VisualizationType;
  chartType: ChartVariant;
  columns: LayoutDimension[];
  rows: LayoutDimension[];
  filters: LayoutDimension[];
  options: VisualizationOptions;
  createdAt: string;
  updatedAt: string;
}

export interface VisualizationWithData extends StoredVisualization {
  data: ChartDataItem[];
  series: ChartSeries[];
}

export interface ChartSeries {
  dataKey: string;
  name: string;
  color: string;
  type?: 'line' | 'area' | 'bar';
}

// ============================================================================
// CHART COLORS
// ============================================================================

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

// ============================================================================
// DATA GENERATION
// ============================================================================

interface DimensionItem {
  id: string;
  name: string;
  code?: string;
}

function generateVisualizationData(
  visualization: StoredVisualization,
  dataElements: DimensionItem[],
  indicators: DimensionItem[],
  _periods: DimensionItem[],
  orgUnits: DimensionItem[]
): { data: ChartDataItem[]; series: ChartSeries[] } {
  const { chartType, rows, columns } = visualization;

  // Get selected data items from rows
  const dataItemIds = rows
    .filter((r) => r.dimension === 'dx')
    .flatMap((r) => r.items);

  const dataItems = dataItemIds
    .map((id) => dataElements.find((d) => d.id === id) || indicators.find((i) => i.id === id))
    .filter(Boolean) as DimensionItem[];

  // If no data items selected, use defaults
  if (dataItems.length === 0) {
    dataItems.push(
      { id: 'de1', name: 'Consultations totales' },
      { id: 'de2', name: 'Consultations prénatales' },
      { id: 'de3', name: 'Vaccinations complètes' }
    );
  }

  // Generate series
  const series: ChartSeries[] = dataItems.slice(0, 4).map((item, index) => ({
    dataKey: item.name,
    name: item.name,
    color: CHART_COLORS[index % CHART_COLORS.length],
    type: chartType === 'composed' ? (index === 0 ? 'bar' : 'line') : undefined,
  }));

  // Generate data based on chart type
  let data: ChartDataItem[];

  if (['pie', 'donut', 'radialBar', 'treemap', 'funnel'].includes(chartType)) {
    // For pie-like charts, use data items as categories
    data = dataItems.slice(0, 6).map((item, index) => ({
      name: item.name,
      value: Math.floor(Math.random() * 500) + 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  } else if (chartType === 'radar') {
    // For radar, use org units as subjects
    const selectedOrgUnits = columns
      .filter((c) => c.dimension === 'ou')
      .flatMap((c) => c.items)
      .map((id) => orgUnits.find((o) => o.id === id))
      .filter(Boolean) as DimensionItem[];

    const subjects = selectedOrgUnits.length > 0 ? selectedOrgUnits : orgUnits.slice(0, 5);

    data = subjects.map((ou) => {
      const entry: ChartDataItem = { subject: ou.name };
      dataItems.slice(0, 3).forEach((item) => {
        entry[item.name] = Math.floor(Math.random() * 100) + 20;
      });
      return entry;
    });
  } else if (chartType === 'scatter') {
    // For scatter, generate x, y pairs
    data = Array.from({ length: 20 }, (_, i) => ({
      name: `Point ${i + 1}`,
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
      z: Math.floor(Math.random() * 50) + 10,
    }));
  } else {
    // For line, area, bar, composed charts - time series data
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    data = monthNames.slice(0, 6).map((month) => {
      const entry: ChartDataItem = { name: month };
      dataItems.slice(0, 4).forEach((item) => {
        entry[item.name] = Math.floor(Math.random() * 300) + 50;
      });
      return entry;
    });
  }

  return { data, series };
}

// ============================================================================
// HOOK
// ============================================================================

export function useVisualizations(type?: VisualizationType) {
  const [visualizations, setVisualizations] = useState<VisualizationWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dimension data
  const [dataElements, setDataElements] = useState<DimensionItem[]>([]);
  const [indicators, setIndicators] = useState<DimensionItem[]>([]);
  const [periods, setPeriods] = useState<DimensionItem[]>([]);
  const [orgUnits, setOrgUnits] = useState<DimensionItem[]>([]);

  const loadDimensionData = useCallback(() => {
    try {
      initializeTestData();
      const { items: de } = db.list<DimensionItem>('visualization_data_elements');
      const { items: ind } = db.list<DimensionItem>('visualization_indicators');
      const { items: pe } = db.list<DimensionItem>('visualization_periods');
      const { items: ou } = db.list<DimensionItem>('visualization_org_units');

      setDataElements(de);
      setIndicators(ind);
      setPeriods(pe);
      setOrgUnits(ou);
    } catch (err) {
      console.error('[useVisualizations] Failed to load dimension data', err);
    }
  }, []);

  const loadVisualizations = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      initializeTestData();

      // Load dimension data first
      loadDimensionData();

      // Fetch visualizations
      const query: { where?: Partial<StoredVisualization> } = {
        ...(type && { where: { type } }),
      };

      const { items } = db.list<StoredVisualization>('visualizations', {
        ...query,
        sortBy: 'updatedAt',
        sortDir: 'desc',
      });

      // Generate data for each visualization
      const visualizationsWithData: VisualizationWithData[] = items.map((viz) => {
        const { data, series } = generateVisualizationData(
          viz,
          dataElements.length > 0 ? dataElements : [{ id: 'de1', name: 'Consultations' }],
          indicators.length > 0 ? indicators : [],
          periods.length > 0 ? periods : [],
          orgUnits.length > 0 ? orgUnits : []
        );

        return {
          ...viz,
          data,
          series,
        };
      });

      setVisualizations(visualizationsWithData);
    } catch (err) {
      console.error('[useVisualizations] Failed to load visualizations', err);
      setError('Impossible de charger les visualisations');
    } finally {
      setIsLoading(false);
    }
  }, [type, dataElements, indicators, periods, orgUnits, loadDimensionData]);

  // Initial load
  useEffect(() => {
    loadDimensionData();
  }, [loadDimensionData]);

  // Load visualizations when dimension data is ready
  useEffect(() => {
    if (dataElements.length > 0) {
      loadVisualizations();
    }
  }, [dataElements.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh function
  const refresh = useCallback(() => {
    loadVisualizations();
  }, [loadVisualizations]);

  // Delete visualization
  const deleteVisualization = useCallback((id: string) => {
    try {
      db.delete('visualizations', id);
      setVisualizations((prev) => prev.filter((v) => v.id !== id));
      return true;
    } catch (err) {
      console.error('[useVisualizations] Failed to delete visualization', err);
      return false;
    }
  }, []);

  // Filter by type
  const dashboardVisualizations = useMemo(
    () => visualizations.filter((v) => v.type === 'dashboard'),
    [visualizations]
  );

  const reportVisualizations = useMemo(
    () => visualizations.filter((v) => v.type === 'report'),
    [visualizations]
  );

  return {
    visualizations,
    dashboardVisualizations,
    reportVisualizations,
    isLoading,
    error,
    refresh,
    deleteVisualization,
  };
}
