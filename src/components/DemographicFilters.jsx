import { useFilters } from '../data/dataLoader.jsx';

const FILTER_GROUPS = [
  { label: 'Region', segment: 'region', options: [
    { value: 'Total', display: 'All' },
    { value: 'Riyadh', display: 'Riyadh' },
    { value: 'Jeddah', display: 'Jeddah' },
    { value: 'Dammam / Al Khobar', display: 'Dammam / Al Khobar' },
    { value: 'Mecca / Madinah / Taif', display: 'Mecca / Madinah / Taif' },
    { value: 'Other Regions', display: 'Other Regions' },
  ]},
  { label: 'Nationality', segment: 'nationality', options: [
    { value: 'Total', display: 'All' },
    { value: 'Saudi', display: 'Saudi' },
    { value: 'Non-Saudi Arab', display: 'Non-Saudi Arab' },
    { value: 'Non-Arab', display: 'Non-Arab' },
  ]},
  { label: 'Gender', segment: 'gender', options: [
    { value: 'Total', display: 'All' },
    { value: 'Man', display: 'Man' },
    { value: 'Woman', display: 'Woman' },
  ]},
  { label: 'Age Group', segment: 'age', options: [
    { value: 'Total', display: 'All' },
    { value: '16-24', display: '16-24' },
    { value: '25-34', display: '25-34' },
    { value: '35-45', display: '35-45' },
  ]},
];

const DemographicFilters = () => {
  const { activeSegment, setActiveSegment } = useFilters();

  // Determine which group is currently active
  const getSelectedDisplay = (group) => {
    const match = group.options.find(o => o.value === activeSegment);
    return match ? match.display : 'All';
  };

  return (
    <div className="flex items-center gap-3">
      {FILTER_GROUPS.map((group) => (
        <div key={group.label} className="relative flex-1 min-w-[140px]">
          <label className="block text-[10px] font-semibold text-text-primary uppercase tracking-wider mb-0.5">
            {group.label}
          </label>
          <select
            value={group.options.some(o => o.value === activeSegment) ? activeSegment : 'Total'}
            onChange={(e) => setActiveSegment(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] text-text-secondary cursor-pointer hover:border-orange-primary focus:border-orange-primary focus:outline-none transition-colors pr-8"
          >
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.display}
              </option>
            ))}
          </select>
          <svg className="absolute right-2.5 bottom-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default DemographicFilters;
