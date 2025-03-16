import React, { useState, useEffect, useRef } from 'react';
import { Repository } from '../types';

const ASCII_LOGO = `
---      ---    ------    ----    ----   --------   ----    ---- -----------  
 ***    ***    ********   ****   ****   **********  ****    **** **************  
  ---  ---    ----------  ----  ----   ----    ---- ----    ---- ----       --- 
   ******    ****    **** *********    ***      *** ****    **** *************  
    ----     ------------ ---------    ---      --- ----    ---- -----------  
    ****     ************ ****  ****   ****    **** ************ ****       *** 
    ----     ----    ---- ----   ----   ----------  ------------ --------------  
    ****     ****    **** ****    ****   ********   ************ ************  
 `;

const HELP_TEXT = `
Available commands:
  help     - Show this help message
  ls       - List all repositories
  cd REPO  - Show details for specific repository
  clear    - Clear terminal
  info     - Show information about me
  game     - Play a simple runner game
`;

interface TerminalProps {
  repositories: Repository[];
  loading: boolean;
  error: string | null;
  onStartGame: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ repositories, loading, error, onStartGame }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('~');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);

  const typeWriter = async (text: string) => {
    if (isTypingRef.current) return;
    isTypingRef.current = true;

    const lines = text.split('\n');
    for (const line of lines) {
      setOutput(prev => [...prev, line]);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    isTypingRef.current = false;
  };

  const executeCommand = async (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    
    if (command === 'help') {
      await typeWriter(HELP_TEXT);
    } else if (command === 'ls') {
      if (loading) {
        await typeWriter('Loading repositories...');
        return;
      }
      if (error) {
        await typeWriter('Error loading repositories. Please try again later.');
        return;
      }
      await typeWriter(repositories.map(repo => repo.name).join('\n'));
    } else if (command.startsWith('cd ')) {
      const repoName = command.slice(3);
      const repo = repositories.find(r => r.name.toLowerCase() === repoName.toLowerCase());
      if (repo) {
        setCurrentPath(`~/` + repo.name);
        await typeWriter(`
Name: ${repo.name}
Description: ${repo.description || 'No description'}
Stars: ${repo.stars}
Language: ${repo.language}
URL: ${repo.url}`);
      } else {
        await typeWriter('Repository not found');
      }
    } else if (command === 'clear') {
      setOutput([]);
    } else if (command === 'info') {
      await typeWriter(`
Hi, I'm George Yakoub! 👋
I am a developer and technologist with a passion for creating elegant solutions and building innovative products.
Check out my work on GitHub: https://github.com/6ogo/`);
    } else if (command === 'game') {
      await typeWriter(`
Starting runner game...`);
      onStartGame();
    } else if (command !== '') {
      await typeWriter(`Command not found: ${command}`);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const newOutput = [...output, `yakou8@github:${currentPath}$ ${input}`];
      setOutput(newOutput);
      const cmd = input;
      setInput('');
      await executeCommand(cmd);
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    const initTerminal = async () => {
      await typeWriter(ASCII_LOGO);
      await typeWriter('\nWelcome to Yakou8\'s Terminal! Type "help" for available commands.');
    };
    initTerminal();

    // Global click handler to focus input
    const handleGlobalClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div 
      ref={terminalRef}
      className="min-h-screen p-4 font-mono text-green-500 bg-black overflow-y-auto"
      style={{ maxHeight: '100vh' }}
    >
      <div className="whitespace-pre">
        {output.map((line, i) => (
          <div key={i} className="leading-tight">{line}</div>
        ))}
      </div>
      <div className="flex items-center">
        <span className="whitespace-pre">yakou8@github:{currentPath}$ </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none border-none ml-2"
          autoFocus
        />
      </div>
    </div>
  );
}