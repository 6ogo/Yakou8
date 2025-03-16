import { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Github, BarChart3, ArrowRight } from 'lucide-react';
import { Terminal as TerminalComponent } from './components/Terminal';
import { ModernView } from './components/ModernView';
import { VisualizationsView } from './components/VisualizationsView';
import { RunnerGame } from './components/RunnerGame';
import { MobileSequence } from './components/MobileSequence';
import { useGitHubData } from './hooks/useGitHubData';
import { useMobileDetection } from './hooks/useMobileDetection';

type ViewMode = 'terminal' | 'projects' | 'visualizations';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('terminal');
  const [isGameActive, setIsGameActive] = useState(false);
  const [showViewHint, setShowViewHint] = useState(false);
  const [showArrowOnly, setShowArrowOnly] = useState(false);
  const [hasClickedViewButton, setHasClickedViewButton] = useState(false);
  const [mobileSequenceComplete, setMobileSequenceComplete] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const { repositories, loading, error } = useGitHubData();
  
  // Detect if device is mobile
  const isMobile = useMobileDetection();

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

  // Render different layouts for mobile and desktop
  if (isMobile) {
    return (
      <div
        ref={mainRef}
        className="min-h-screen bg-black text-green-500 transition-all duration-500 overflow-y-auto"
      >
        <div className="grain" />
        
        {/* Mobile Loading & Hacking Sequence */}
        {!mobileSequenceComplete && (
          <MobileSequence onComplete={() => setMobileSequenceComplete(true)} />
        )}
        
        {/* Mobile Content (Sequential Vertical Layout) */}
        <div className={`transition-opacity duration-500 ${mobileSequenceComplete ? 'opacity-100' : 'opacity-0'}`}>
          {/* Personal Info Section */}
          <section className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-bold mb-6">George Yakoub</h1>
            <p className="text-xl mb-8">Developer & Technologist</p>
            <div className="mb-8 w-full max-w-md p-6 bg-gray-900/50 rounded-lg border border-green-500/30">
              <p className="mb-4">
                I am a passionate developer with expertise in creating elegant solutions and 
                building innovative products. Explore my projects below.
              </p>
              <a
                href="https://github.com/6ogo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-black px-4 py-2 rounded hover:bg-green-400 transition-colors"
              >
                <Github size={18} />
                <span>GitHub Profile</span>
              </a>
            </div>
            <div className="animate-bounce mt-6">
              <p className="text-sm mb-2">Continue scrolling</p>
              <ArrowRight size={20} className="transform rotate-90 mx-auto" />
            </div>
          </section>

          {/* Projects Section */}
          <section className="min-h-screen pt-20 pb-32">
            <ModernView repositories={repositories} loading={loading} error={error} />
          </section>
          
          {/* Terminal Section */}
          <section className="min-h-screen pt-20 pb-32">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-6 text-center">Terminal Experience</h2>
              <p className="text-center mb-6">Try interacting with the terminal below:</p>
              <div className="h-[70vh] overflow-hidden rounded-lg border border-green-500/30">
                <TerminalComponent 
                  repositories={repositories} 
                  loading={loading} 
                  error={error}
                  onStartGame={() => setIsGameActive(true)}
                />
              </div>
            </div>
          </section>
          
          {/* Visualizations Section */}
          <section className="min-h-screen pt-20 pb-32">
            <VisualizationsView />
          </section>
        </div>
        
        {isGameActive && (
          <RunnerGame onQuit={() => setIsGameActive(false)} />
        )}
      </div>
    );
  }
  
  // Desktop Experience (Original Layout)
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

export default App;