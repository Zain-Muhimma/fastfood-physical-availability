import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { computeAllBrandsMetrics, findLeader } from './metrics.js';

// Contexts
const DataContext = createContext();
export const useData = () => useContext(DataContext);

const FilterContext = createContext();
export const useFilters = () => useContext(FilterContext);

const UIContext = createContext();
export const useUI = () => useContext(UIContext);

const GuideContext = createContext();
export const useGuide = () => useContext(GuideContext);

export { ViewModeProvider, useViewMode } from '../components/ViewModeContext.jsx';

// Load data files
const loadAllData = async () => {
  const [brands, paData, reviewsData] = await Promise.all([
    fetch('/data/brands.json').then(r => r.json()),
    fetch('/data/pa_data.json').then(r => r.json()),
    fetch('/data/reviews_data.json').then(r => r.json()).catch(() => null),
  ]);
  return { brands, paData, reviewsData };
};

// DataProvider
export const DataProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const value = { data, loading, error };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// FilterProvider
export const FilterProvider = ({ children }) => {
  const { data } = useData();
  const [focusedBrand, setFocusedBrand] = useState(null);
  const [activeSegment, setActiveSegment] = useState('Total');

  // Brand names from data
  const brandNames = useMemo(() => {
    if (!data?.paData?.meta?.brands) return [];
    return data.paData.meta.brands;
  }, [data]);

  // Default brand is Kudu (or first brand)
  const defaultBrand = useMemo(() => {
    if (!data?.brands) return null;
    const def = data.brands.find(b => b.isDefault);
    return def ? def.name : data.brands[0]?.name || null;
  }, [data]);

  useEffect(() => {
    if (defaultBrand && !focusedBrand) {
      setFocusedBrand(defaultBrand);
    }
  }, [defaultBrand, focusedBrand]);

  // Compute all metrics
  const allMetrics = useMemo(() => {
    if (!data?.paData || brandNames.length === 0) return null;
    return computeAllBrandsMetrics(data.paData, brandNames, activeSegment);
  }, [data, brandNames, activeSegment]);

  // Find leader
  const leader = useMemo(() => {
    if (!allMetrics) return null;
    return findLeader(allMetrics);
  }, [allMetrics]);

  // Demographics available
  const demographics = useMemo(() => {
    return data?.paData?.meta?.demographics || ['Total'];
  }, [data]);

  const effectiveBrand = focusedBrand || defaultBrand;

  const value = useMemo(() => ({
    focusedBrand: effectiveBrand,
    setFocusedBrand,
    defaultBrand,
    activeSegment,
    setActiveSegment,
    brandNames,
    allMetrics,
    leader,
    demographics,
  }), [effectiveBrand, defaultBrand, activeSegment, brandNames, allMetrics, leader, demographics]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

// UIProvider
export const UIProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const value = { sidebarOpen, setSidebarOpen };
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// GuideProvider
export const GuideProvider = ({ children }) => {
  const [guideOpen, setGuideOpen] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);
  const value = { guideOpen, setGuideOpen, currentGuide, setCurrentGuide };
  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
};
