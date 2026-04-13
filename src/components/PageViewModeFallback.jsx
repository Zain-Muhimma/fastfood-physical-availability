import { useViewMode } from './ViewModeContext.jsx';

const PageViewModeFallback = () => {
  const { viewMode } = useViewMode();

  if (!viewMode?.modes) return null;

  return (
    <div className="inline-flex bg-white rounded-full p-1 border border-orange-primary">
      {viewMode.modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => viewMode.onChange(mode.key)}
          className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
            viewMode.current === mode.key
              ? 'bg-orange-primary text-white'
              : 'text-text-secondary hover:text-orange-primary'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};

export default PageViewModeFallback;
