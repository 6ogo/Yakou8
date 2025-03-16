import { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Github, BarChart3, ArrowRight } from 'lucide-react';
import { Terminal as TerminalComponent } from './components/Terminal';
import { ModernView } from './components/ModernView';
import { VisualizationsView } from './components/VisualizationsView';
import { RunnerGame } from './components/RunnerGame';
import { useGitHubData } from './hooks/useGitHubData';

type ViewMode = 'terminal' | 'projects' | 'visualizations';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('terminal');
  const [isGameActive, setIsGameActive] = useState(false);
  const [showViewHint, setShowViewHint] = useState(false);
  const [showArrowOnly, setShowArrowOnly] = useState(false);
  const [hasClickedViewButton, setHasClickedViewButton] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const { repositories, loading, error } = useGitHubData();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isGameActive) {
        setIsGameActive(false);
      } else {
        // Cycle through view modes
        setViewMode(prev => {
          if (prev === 'terminal') return 'projects';
          if (prev === 'projects') return 'visualizations';
          return 'terminal';
        });
      }
    }
  }, [isGameActive]);

  const handleScroll = useCallback(() => {
    if (!mainRef.current) return;
    const scrollPosition = mainRef.current.scrollTop;
    if (scrollPosition > 50 && viewMode === 'terminal') {
      setViewMode('projects');
    }
  }, [viewMode]);

  const cycleViewMode = () => {
    // Hide the hint when user clicks the button
    setHasClickedViewButton(true);
    setShowViewHint(false);
    setShowArrowOnly(false);
    
    setViewMode(prev => {
      if (prev === 'terminal') return 'projects';
      if (prev === 'projects') return 'visualizations';
      return 'terminal';
    });
  };

  // Helper function to get the appropriate icon for the current view mode
  const getViewIcon = () => {
    switch (viewMode) {
      case 'terminal':
        return <Github size={20} />;
      case 'projects':
        return <BarChart3 size={20} />;
      case 'visualizations':
        return <Terminal size={20} />;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Show view hint and then change to arrow only
  useEffect(() => {
    // Don't show hint if user has already clicked the button
    if (hasClickedViewButton) return;
    
    // Show the full hint after a short delay
    const hintTimer = setTimeout(() => {
      setShowViewHint(true);
      
      // Change to arrow only after 5 seconds
      const arrowTimer = setTimeout(() => {
        setShowArrowOnly(true);
      }, 5000);
      
      return () => clearTimeout(arrowTimer);
    }, 2000);

    return () => clearTimeout(hintTimer);
  }, [hasClickedViewButton]);

  return (
    <div 
      ref={mainRef}
      className="min-h-screen bg-black text-green-500 transition-all duration-500 overflow-y-auto"
      onScroll={handleScroll}
    >
      <div className="grain" />
      <nav className="fixed top-0 right-0 p-4 z-50 flex items-center">
        {showViewHint && !hasClickedViewButton && (
          <div className={`flex items-center ${showViewHint ? 'animate-slide-in' : ''}`}>
            {!showArrowOnly ? (
              <span className="mr-4 text-sm bg-green-500/20 px-4 py-2 rounded-full shadow-glow animate-pulse">
                Click here to switch views <ArrowRight size={16} className="inline ml-1" />
              </span>
            ) : (
              <ArrowRight size={24} className="mr-4 text-green-500 animate-bounce" />
            )}
          </div>
        )}
        <button
          onClick={cycleViewMode}
          className="bg-green-500 text-black p-2 rounded-full hover:bg-green-400 transition-colors relative z-10"
          title="Switch view mode"
        >
          {getViewIcon()}
        </button>
      </nav>

      <div className={`absolute inset-0 transition-opacity duration-500 ${viewMode === 'terminal' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
        <TerminalComponent 
          repositories={repositories} 
          loading={loading} 
          error={error}
          onStartGame={() => setIsGameActive(true)}
        />
      </div>

      <div className={`absolute inset-0 transition-opacity duration-500 ${viewMode === 'projects' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
        <ModernView repositories={repositories} loading={loading} error={error} />
      </div>

      <div className={`absolute inset-0 transition-opacity duration-500 ${viewMode === 'visualizations' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
        <VisualizationsView />
      </div>

      {isGameActive && (
        <RunnerGame onQuit={() => setIsGameActive(false)} />
      )}
    </div>
  );
}

export default App