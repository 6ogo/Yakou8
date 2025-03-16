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

  // Sample hacking messages to display
  const hackingMessages = [
    "Initializing secure connection...",
    "Accessing encrypted database...",
    "Bypassing security protocols...",
    "Scanning network endpoints...",
    "Establishing secure channel...",
    "Retrieving profile data...",
    "Decrypting project information...",
    "Access granted!"
  ];

  // Simulated loading progress
  useEffect(() => {
    if (stage !== 'loading') return;

    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + (Math.random() * 5);
        if (next >= 100) {
          clearInterval(timer);
          setStage('hacking');
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [stage]);

  // Hacking text effect
  useEffect(() => {
    if (stage !== 'hacking') return;

    let currentMessageIndex = 0;
    let currentCharIndex = 0;
    let isErasing = false;
    
    const typeTimer = setInterval(() => {
      const currentMessage = hackingMessages[currentMessageIndex];
      
      if (!isErasing) {
        // Typing
        if (currentCharIndex <= currentMessage.length) {
          setHackText(currentMessage.substring(0, currentCharIndex));
          currentCharIndex++;
        } else {
          // Once typed out, wait a bit before erasing
          isErasing = true;
          setTimeout(() => {
            currentCharIndex = currentMessage.length;
          }, 800);
        }
      } else {
        // Erasing
        if (currentCharIndex > 0) {
          setHackText(currentMessage.substring(0, currentCharIndex));
          currentCharIndex--;
        } else {
          // Move to next message
          isErasing = false;
          currentMessageIndex++;
          
          // If we've gone through all messages, end the sequence
          if (currentMessageIndex >= hackingMessages.length) {
            clearInterval(typeTimer);
            setStage('complete');
            setTimeout(() => {
              setShowScrollPrompt(true);
              // Notify parent component that sequence is complete
              setTimeout(onComplete, 1000);
            }, 1000);
          }
        }
      }
    }, 50);

    return () => clearInterval(typeTimer);
  }, [stage]);

  return (
    <div className="min-h-screen bg-black text-green-500 flex flex-col items-center justify-center p-4">
      <div className="grain" />
      
      {stage === 'loading' && (
        <div className="w-full max-w-md">
          <h2 className="text-xl mb-4 font-mono">Initializing system...</h2>
          <div className="w-full bg-gray-900 rounded-full h-4 mb-6">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-right font-mono">{Math.round(loadingProgress)}%</p>
        </div>
      )}
      
      {stage === 'hacking' && (
        <div className="w-full max-w-md">
          <pre className="font-mono text-sm whitespace-pre-wrap">
            <span className="text-green-500">&gt; </span>
            {hackText}
            <span className="animate-pulse">█</span>
          </pre>
        </div>
      )}
      
      {stage === 'complete' && (
        <div className="text-center w-full max-w-md">
          <h2 className="text-2xl mb-6 font-mono text-center">
            Connection Established
          </h2>
          
          {showScrollPrompt && (
            <div className="mt-10 animate-bounce flex flex-col items-center">
              <p className="text-lg mb-4">Scroll Down to Continue</p>
              <ChevronDown size={32} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};