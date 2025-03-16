import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface MobileSequenceProps {
  onComplete: () => void;
}

export const MobileSequence: React.FC<MobileSequenceProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'loading' | 'hacking' | 'complete'>('loading');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hackText, setHackText] = useState('');
  const [showScrollPrompt, setShowScrollPrompt] = useState(false);

  // Shortened quick command messages
  const hackingMessages = [
    "Initializing connection...",
    "Loading profile data...",
    "Decrypting projects...",
    "Access granted!"
  ];

  // Faster loading progress
  useEffect(() => {
    if (stage !== 'loading') return;

    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + (Math.random() * 10);
        if (next >= 100) {
          clearInterval(timer);
          setStage('hacking');
          return 100;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [stage]);

  // Quick command execution effect
  useEffect(() => {
    if (stage !== 'hacking') return;

    // Show each command quickly one after another
    let commandIndex = 0;
    
    const showNextCommand = () => {
      if (commandIndex < hackingMessages.length) {
        setHackText(prev => prev + '\n> ' + hackingMessages[commandIndex]);
        commandIndex++;
        
        // Show next command after a short delay
        setTimeout(showNextCommand, 300);
      } else {
        // When all commands are shown, move to complete stage
        setStage('complete');
        setTimeout(() => {
          setShowScrollPrompt(true);
          // Notify parent component that sequence is complete
          onComplete();
        }, 500);
      }
    };
    
    // Start showing commands
    showNextCommand();

    return () => {};
  }, [stage, onComplete]);

  return (
    <div className="min-h-screen bg-black text-green-500 flex flex-col items-center justify-start pt-32 p-4">
      <div className="grain" />
      
      {stage === 'loading' && (
        <div className="w-full max-w-md bg-black/40 p-6 rounded-lg border border-green-500/30">
          <h2 className="text-xl mb-4 font-mono text-center">Initializing system...</h2>
          <div className="w-full bg-gray-900 rounded-full h-4 mb-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-200"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-center font-mono">{Math.round(loadingProgress)}%</p>
        </div>
      )}
      
      {stage === 'hacking' && (
        <div className="w-full max-w-md bg-black/40 p-4 rounded-lg border border-green-500/30">
          <pre className="font-mono text-sm whitespace-pre-wrap">
            {hackText}
            <span className="animate-pulse">█</span>
          </pre>
        </div>
      )}
      
      {stage === 'complete' && (
        <div className="text-center w-full max-w-md bg-black/40 p-6 rounded-lg border border-green-500/30">
          <h2 className="text-2xl mb-6 font-mono text-center text-green-400">
            Connection Established
          </h2>
          
          {showScrollPrompt && (
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg mb-4">Scroll Down to Continue</p>
              <div className="animate-bounce">
                <ChevronDown size={32} className="text-green-400" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};