import { ArrowCounterClockwise, Info, FileArrowDown } from '@phosphor-icons/react';
import BrandFilter from './BrandFilter.jsx';
import DemographicFilters from './DemographicFilters.jsx';
import ExportButton from './ExportButton.jsx';
import { useFilters, useGuide } from '../data/dataLoader.jsx';

const TopBar = () => {
  const { setFocusedBrand, defaultBrand, setActiveSegment } = useFilters();
  const { guideOpen, setGuideOpen, currentGuide } = useGuide();

  const handleReset = () => {
    setFocusedBrand(defaultBrand);
    setActiveSegment('Total');
  };

  return (
    <header className="bg-card border-b border-gray-200 px-6 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <BrandFilter />
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* How to Read — outline style */}
          {currentGuide && (
            <button
              onClick={() => setGuideOpen(!guideOpen)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-blue-info text-blue-info text-[12px] font-bold uppercase tracking-wide hover:bg-blue-50 transition-colors"
            >
              <Info size={16} weight="fill" />
              How to Read
            </button>
          )}

          {/* Generate Report — filled orange */}
          <ExportButton />

          {/* Reset — outline style */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-orange-primary text-orange-primary text-[12px] font-bold uppercase tracking-wide hover:bg-orange-light transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      <DemographicFilters />
    </header>
  );
};

export default TopBar;
