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
  help           - Show this help message
  ls            - List all repositories
  cd REPO       - Show details for specific repository
  cd ..         - Go back to root directory
  cd            - Go to root directory
  pwd           - Show current directory path
  echo TEXT     - Repeat back the text
  date          - Show current date and time
  fortune       - Show a random fortune
  calc EXPR     - Calculate a simple expression
  history       - Show command history
  sudo COMMAND  - Try to run a command with sudo
  clear         - Clear terminal
  info     - Show information about me
  game     - Play a simple runner game
  guess    - Play a number guessing game
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
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [targetNumber, setTargetNumber] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);

  const fortunes = [
    "You will have a great day!",
    "Beware of falling pianos.",
    "Your code will compile on the first try.",
    "You will meet someone special today.",
    "Don't forget to save your work."
  ];

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
      const arg = command.slice(3);
      if (arg === '..') {
        if (currentPath !== '~') {
          setCurrentPath('~');
          await typeWriter('Moved to root directory');
        } else {
          await typeWriter('Already at root directory');
        }
      } else {
        const repoName = arg;
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
      }
    } else if (command === 'cd') {
      setCurrentPath('~');
      await typeWriter('Moved to root directory');
    } else if (command === 'pwd') {
      await typeWriter(currentPath);
    } else if (command.startsWith('echo ')) {
      const text = cmd.slice(5);
      await typeWriter(text);
    } else if (command === 'date') {
      const now = new Date();
      await typeWriter(now.toString());
    } else if (command === 'fortune') {
      const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      await typeWriter(fortune);
    } else if (command.startsWith('weather ')) {
      const city = cmd.slice(8);
      const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy'];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const temp = Math.floor(Math.random() * 30) + 10; // 10 to 40°C
      await typeWriter(`Weather in ${city}: ${condition}, ${temp}°C`);
    } else if (command.startsWith('calc ')) {
      const expr = cmd.slice(5);
      try {
        const result = eval(expr); // Use with caution; safe here as it's client-side
        await typeWriter(`Result: ${result}`);
      } catch {
        await typeWriter('Invalid expression');
      }
    } else if (command === 'history') {
      await typeWriter(commandHistory.join('\n'));
    } else if (command.startsWith('sudo ')) {
      await typeWriter("Nice try, but you're not root here!");
    } else if (command === 'clear') {
      setOutput([]);
    } else if (command === 'info') {
      await typeWriter(`
Hi, I'm George Yakoub! 👋
I am a developer and technologist with a passion for creating elegant solutions and building innovative products.
Check out my work on GitHub: https://github.com/6ogo/`);
    } else if (command === 'game') {
      await typeWriter('Starting runner game...');
      onStartGame();
    } else if (command === 'guess') {
      setGameActive(true);
      setTargetNumber(Math.floor(Math.random() * 10) + 1);
      setAttempts(0);
      await typeWriter('Guess a number between 1 and 10. Type your guess or "quit" to exit.');
    } else if (command === 'make me a sandwich') {
      await typeWriter('Make it yourself!');
    } else if (command === 'xyzzy') {
      await typeWriter('Nothing happens.');
    } else if (command === 'hello') {
      await typeWriter('Hello there!');
    } else if (command !== '') {
      await typeWriter(`Command not found: ${command}`);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      const newOutput = [...output, `yakou8@github:${currentPath}$ ${input}`];
      setOutput(newOutput);
      setInput('');

      if (gameActive) {
        if (cmd.toLowerCase() === 'quit') {
          setGameActive(false);
          await typeWriter('Game ended.');
        } else {
          const guess = parseInt(cmd);
          if (isNaN(guess)) {
            await typeWriter('Please enter a number or "quit".');
          } else {
            setAttempts(prev => prev + 1);
            if (guess === targetNumber) {
              await typeWriter(`Correct! You guessed it in ${attempts + 1} attempts.`);
              setGameActive(false);
            } else if (guess < targetNumber) {
              await typeWriter('Too low. Try again.');
            } else {
              await typeWriter('Too high. Try again.');
            }
          }
        }
      } else {
        if (cmd) {
          setCommandHistory(prev => [...prev, cmd]);
          setHistoryIndex(null);
          await executeCommand(cmd);
        }
      }
    } else if (e.key === 'ArrowUp') {
      if (!gameActive && commandHistory.length > 0) {
        const newIndex = historyIndex === null ? commandHistory.length - 1 : Math.max(historyIndex - 1, 0);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      if (!gameActive && historyIndex !== null) {
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        } else {
          setHistoryIndex(null);
          setInput('');
        }
      }
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
};