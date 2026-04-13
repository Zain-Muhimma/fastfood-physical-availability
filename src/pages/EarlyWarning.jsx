import { useEffect } from 'react';
import { useViewMode } from '../components/ViewModeContext.jsx';
import { useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { Warning } from '@phosphor-icons/react';

const EarlyWarning = () => {
  const { setViewMode } = useViewMode();
  const { setCurrentGuide } = useGuide();

  useEffect(() => {
    setCurrentGuide({ sections: guides['/early-warning'].sections });
    return () => setCurrentGuide(null);
  }, [setCurrentGuide]);

  useEffect(() => {
    setViewMode({
      path: '/early-warning',
      modes: [
        { key: 'overview', label: 'Overview' },
      ],
      current: 'overview',
      onChange: () => {},
    });
    return () => setViewMode(null);
  }, [setViewMode]);

  return (
    <div className="p-6 min-h-[calc(100vh-155px)]">
      <div className="flex flex-col flex-shrink-0 mb-3">
        <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">Early Warning Signals</h1>
        <p className="text-[11px] text-text-secondary font-medium mt-1">Proactive identification of emerging issues</p>
        <div className="mt-2"><PageViewModeFallback /></div>
      </div>

      <div className="flex items-center justify-center h-[calc(100vh-300px)]">
        <div className="bg-card rounded-card p-10 text-center max-w-lg animate-slide-up">
          <Warning size={64} className="text-orange-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl text-text-primary mb-3">Coming Soon</h2>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            This page requires Wave 4 data to activate trend analysis. The framework monitors key metrics for sudden changes across waves and alerts to potential issues before they become critical. Currently showing Wave 3 baseline data only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EarlyWarning;
