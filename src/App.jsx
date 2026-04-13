import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DataProvider, FilterProvider, UIProvider, GuideProvider, ViewModeProvider } from './data/dataLoader.jsx';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import PAScoreboard from './pages/PAScoreboard.jsx';
import Presence from './pages/Presence.jsx';
import Prominence from './pages/Prominence.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Experience from './pages/Experience.jsx';
import CompetitiveGap from './pages/CompetitiveGap.jsx';
import EarlyWarning from './pages/EarlyWarning.jsx';
import Report from './pages/Report.jsx';
import GuideButton from './components/GuideButton.jsx';
import GuidePanel from './components/GuidePanel.jsx';
import ChatWidget from './components/ChatPanel.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  static getDerivedStateFromProps(props, state) {
    // Reset error when location changes
    if (state.prevKey !== props.resetKey) {
      return { hasError: false, error: null, prevKey: props.resetKey };
    }
    return null;
  }
  componentDidCatch(error, info) {
    console.error('Page Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-card p-6">
            <h2 className="font-display text-2xl text-red-700 mb-2">Page Error</h2>
            <p className="text-red-600 text-sm mb-2">{this.state.error?.message}</p>
            <pre className="text-[10px] text-red-500 bg-red-100 p-2 rounded overflow-auto max-h-40 mb-3">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-orange-primary text-white rounded-full text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  const location = useLocation();

  return (
    <>
      <div className="flex h-screen bg-page">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <ErrorBoundary resetKey={location.pathname}>
              <Routes>
                <Route path="/" element={<PAScoreboard />} />
                <Route path="/presence" element={<Presence />} />
                <Route path="/prominence" element={<Prominence />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/experience" element={<Experience />} />
                <Route path="/competitive" element={<CompetitiveGap />} />
                <Route path="/early-warning" element={<EarlyWarning />} />
                <Route path="/report" element={<Report />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      {/* Floating UI — OUTSIDE overflow-hidden layout */}
      <GuideButton />
      <GuidePanel />
      <ChatWidget />
    </>
  );
}

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <UIProvider>
          <FilterProvider>
            <GuideProvider>
              <ViewModeProvider>
                <AppShell />
              </ViewModeProvider>
            </GuideProvider>
          </FilterProvider>
        </UIProvider>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
