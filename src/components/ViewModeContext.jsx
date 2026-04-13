import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ViewModeContext = createContext();

export const useViewMode = () => useContext(ViewModeContext);

export const ViewModeProvider = ({ children }) => {
  const [viewMode, setViewModeState] = useState(null);

  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
  }, []);

  const value = useMemo(() => ({ viewMode, setViewMode }), [viewMode, setViewMode]);

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
};
