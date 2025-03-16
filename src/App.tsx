import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Github } from 'lucide-react';
import { Terminal as TerminalComponent } from './components/Terminal';
import { ModernView } from './components/ModernView';
import { RunnerGame } from './components/RunnerGame';
import { useGitHubData } from './hooks/useGitHubData';

function App() {
  const [isTerminalMode, setIsTerminalMode] = useState(true);
  const [isGameActive, setIsGameActive] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const { repositories, loading, error } = useGitHubData();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isGameActive) {
        setIsGameActive(false);
      } else {
        setIsTerminalMode(prev => !prev);
      }
    }
  }, [isGameActive]);

  const handleScroll = useCallback(() => {
    if (!mainRef.current) return;
    const scrollPosition = mainRef.current.scrollTop;
    if (scrollPosition > 50 && isTerminalMode) {
      setIsTerminalMode(false);
    }
  }, [isTerminalMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div 
      ref={mainRef}
      className="min-h-screen bg-black text-green-500 transition-all duration-500 overflow-y-auto"
      onScroll={handleScroll}
    >
      <div className="grain" />
      <nav className="fixed top-0 right-0 p-4 z-50">
        <button
          onClick={() => setIsTerminalMode(prev => !prev)}
          className="bg-green-500 text-black p-2 rounded-full hover:bg-green-400 transition-colors"
          title={isTerminalMode ? "Switch to Modern View" : "Switch to Terminal View"}
        >
          {isTerminalMode ? <Terminal size={20} /> : <Github size={20} />}
        </button>
      </nav>

      <div className={`absolute inset-0 transition-opacity duration-500 ${isTerminalMode ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
        <TerminalComponent 
          repositories={repositories} 
          loading={loading} 
          error={error}
          onStartGame={() => setIsGameActive(true)}
        />
      </div>

      <div className={`absolute inset-0 transition-opacity duration-500 ${!isTerminalMode ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
        <ModernView repositories={repositories} loading={loading} error={error} />
      </div>

      {isGameActive && (
        <RunnerGame onQuit={() => setIsGameActive(false)} />
      )}
    </div>
  );
}

export default App