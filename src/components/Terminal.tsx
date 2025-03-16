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
  ls             - List all repositories
  cd REPO        - Show details for specific repository
  cd ..          - Go back to root directory
  cd             - Go to root directory
  pwd            - Show current directory path
  echo TEXT      - Repeat back the text
  date           - Show current date and time
  fortune        - Show a random fortune
  calc EXPR      - Calculate a simple expression
  history        - Show command history
  sudo COMMAND   - Try to run a command with sudo
  clear          - Clear terminal
  info           - Show information about me
  game           - Play games (type 'game help' for options)
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
  const [currentGame, setCurrentGame] = useState<string>('');
  const [targetNumber, setTargetNumber] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOutput, setGameOutput] = useState<string[]>([]); // New state for game output

  // Space shooter game state
  interface SpaceShooterState {
    playerPos: number;
    meteorites: Array<{ x: number; y: number }>;
    bullets: Array<{ x: number; y: number }>;
    loot: Array<{ x: number; y: number }>;
    score: number;
    gameOver: boolean;
  }

  const [gameState, setGameState] = useState<SpaceShooterState | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);
  const gameLoopRef = useRef<number | null>(null);

  const fortunes = [
    "You will have a great day!",
    "Beware of falling pianos.",
    "Your code will compile on the first try.",
    "You will meet someone special today.",
    "Don't forget to save your work."
  ];

  // Game constants
  const GAME_WIDTH = 20;
  const GAME_HEIGHT = 15; // Increased from 10 to 15 for more height

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

  // Initialize space shooter game state
  const initializeSpaceShooter = (): SpaceShooterState => ({
    playerPos: Math.floor(GAME_WIDTH / 2),
    meteorites: [],
    bullets: [],
    loot: [],
    score: 0,
    gameOver: false
  });

  // Render the space shooter game as ASCII art
  const renderSpaceShooter = (state: SpaceShooterState): string[] => {
    const grid = Array(GAME_HEIGHT)
      .fill(0)
      .map(() => Array(GAME_WIDTH).fill(' '));

    // Place player
    grid[GAME_HEIGHT - 1][state.playerPos] = '^';

    // Place meteorites
    state.meteorites.forEach(meteor => {
      if (meteor.y >= 0 && meteor.y < GAME_HEIGHT) {
        grid[meteor.y][meteor.x] = '*';
      }
    });

    // Place bullets
    state.bullets.forEach(bullet => {
      if (bullet.y >= 0 && bullet.y < GAME_HEIGHT) {
        grid[bullet.y][bullet.x] = '|';
      }
    });

    // Place loot
    state.loot.forEach(item => {
      if (item.y >= 0 && item.y < GAME_HEIGHT) {
        grid[item.y][item.x] = '$';
      }
    });

    // Build game output
    let output = '=== SPACE SHOOTER ===\n';
    for (let row of grid) {
      output += row.join('') + '\n';
    }
    output += `Score: ${state.score}\n`;
    if (state.gameOver) {
      output += 'Game Over! Press Q to quit or R to restart\n';
    } else {
      output += 'Controls: A/D or Arrow Keys to move, SPACE to shoot, Q/ESC to quit\n';
    }
    return output.split('\n');
  };

  // Update space shooter game state
  const updateSpaceShooter = (state: SpaceShooterState, action: string): SpaceShooterState => {
    if (state.gameOver) return state;

    let newState = { ...state };

    // Player movement - only update position, don't move game elements
    if (action === 'a' && newState.playerPos > 0) {
      newState.playerPos -= 1;
      return newState; // Return immediately to prevent meteorites from moving during player movement
    } else if (action === 'd' && newState.playerPos < GAME_WIDTH - 1) {
      newState.playerPos += 1;
      return newState; // Return immediately to prevent meteorites from moving during player movement
    } else if (action === ' ') {
      newState.bullets.push({ x: newState.playerPos, y: GAME_HEIGHT - 2 });
    }

    // Move bullets upward
    newState.bullets = newState.bullets
      .map(bullet => ({ ...bullet, y: bullet.y - 1 }))
      .filter(bullet => bullet.y >= 0);

    // Move meteorites downward
    newState.meteorites = newState.meteorites.map(meteor => ({
      ...meteor,
      y: meteor.y + 1
    }));

    // Spawn new meteorites less frequently
    if (Math.random() < 0.05) { // Reduced from 0.1 to 0.05
      newState.meteorites.push({
        x: Math.floor(Math.random() * GAME_WIDTH),
        y: 0
      });
    }

    // Improved collision detection - iterate backwards to safely remove items
    for (let i = newState.bullets.length - 1; i >= 0; i--) {
      const bullet = newState.bullets[i];
      for (let j = newState.meteorites.length - 1; j >= 0; j--) {
        const meteor = newState.meteorites[j];
        if (bullet.x === meteor.x && bullet.y === meteor.y) {
          // Remove both the bullet and meteorite
          newState.bullets.splice(i, 1);
          newState.meteorites.splice(j, 1);
          newState.score += 10;
          if (Math.random() < 0.3) {
            newState.loot.push({ x: meteor.x, y: meteor.y });
          }
          break; // Break after finding a collision for this bullet
        }
      }
    }

    // Move loot downward
    newState.loot = newState.loot.map(item => ({
      ...item,
      y: item.y + 1
    }));

    // Improved loot collection - iterate backwards to safely remove items
    for (let i = newState.loot.length - 1; i >= 0; i--) {
      const item = newState.loot[i];
      if (item.y === GAME_HEIGHT - 1 && item.x === newState.playerPos) {
        newState.score += 50;
        newState.loot.splice(i, 1);
      }
    }

    // Check for game over
    newState.meteorites.forEach(meteor => {
      if (meteor.y >= GAME_HEIGHT - 1 && meteor.x === newState.playerPos) {
        newState.gameOver = true;
      }
    });

    // Clean up off-screen objects
    newState.meteorites = newState.meteorites.filter(meteor => meteor.y < GAME_HEIGHT);
    newState.loot = newState.loot.filter(item => item.y < GAME_HEIGHT);

    return newState;
  };

  // Update game output separately
  const updateGameOutput = (newState: SpaceShooterState) => {
    const newGameOutput = renderSpaceShooter(newState);
    setGameOutput(newGameOutput);
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
    } else if (command.startsWith('calc ')) {
      const expr = cmd.slice(5);
      try {
        const result = eval(expr);
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
    } else if (command === 'game help' || command === 'game') {
      await typeWriter(`
Available games:
  game runner      - Play the runner game
  game spaceshooter - Play the space shooter game
  game guesser     - Play the number guessing game
  game help        - Show this help message
`);
    } else if (command === 'game runner') {
      await typeWriter('Starting runner game...');
      onStartGame();
    } else if (command === 'game spaceshooter') {
      setGameActive(true);
      setCurrentGame('spaceshooter');
      const initialState = initializeSpaceShooter();
      setGameState(initialState);
      updateGameOutput(initialState);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = window.setInterval(() => {
        setGameState(prevState => {
          if (!prevState) return prevState;
          const newState = updateSpaceShooter(prevState, '');
          updateGameOutput(newState);
          return newState;
        });
      }, 200);
      if (inputRef.current) inputRef.current.focus();
    } else if (command === 'game guesser') {
      setGameActive(true);
      setCurrentGame('guesser');
      setTargetNumber(Math.floor(Math.random() * 10) + 1);
      setAttempts(0);
      await typeWriter('Guess a number between 1 and 10. Type your guess or "quit" to exit.');
    } else if (command !== '') {
      await typeWriter(`Command not found: ${command}`);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (gameActive && currentGame === 'spaceshooter' && gameState) {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setGameState(prevState => {
          if (!prevState) return prevState;
          const newState = updateSpaceShooter(prevState, 'a');
          updateGameOutput(newState);
          return newState;
        });
        return;
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault();
        setGameState(prevState => {
          if (!prevState) return prevState;
          const newState = updateSpaceShooter(prevState, 'd');
          updateGameOutput(newState);
          return newState;
        });
        return;
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        setGameState(prevState => {
          if (!prevState) return prevState;
          const newState = updateSpaceShooter(prevState, ' ');
          updateGameOutput(newState);
          return newState;
        });
        return;
      } else if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
        setGameActive(false);
        setCurrentGame('');
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        setGameOutput([]);
        setOutput(prev => [...prev, 'Game ended.']);
        setInput('');
        return;
      } else if ((e.key === 'r' || e.key === 'R') && gameState?.gameOver) {
        // Restart the game if player is dead and presses R
        const initialState = initializeSpaceShooter();
        setGameState(initialState);
        updateGameOutput(initialState);
        return;
      }
    }

    if (e.key === 'Enter') {
      const cmd = input.trim();
      const newOutput = [...output, `yakou8@github:${currentPath}$ ${input}`];
      setOutput(newOutput);
      setInput('');

      if (gameActive) {
        if (cmd.toLowerCase() === 'quit' || cmd.toLowerCase() === 'q') {
          setGameActive(false);
          setCurrentGame('');
          if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
            gameLoopRef.current = null;
          }
          setGameOutput([]);
          await typeWriter('Game ended.');
        } else if (currentGame === 'guesser') {
          const guess = parseInt(cmd);
          if (isNaN(guess)) {
            await typeWriter('Please enter a number or "quit".');
          } else {
            setAttempts(prev => prev + 1);
            if (guess === targetNumber) {
              await typeWriter(`Correct! You guessed it in ${attempts + 1} attempts.`);
              setGameActive(false);
              setCurrentGame('');
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
  }, [output, gameOutput]);

  useEffect(() => {
    const initTerminal = async () => {
      await typeWriter(ASCII_LOGO);
      await typeWriter('\n');
      await typeWriter('\nWelcome to Yakou8\'s page! Type "help" for available commands.');
    };
    initTerminal();

    const handleGlobalClick = () => {
      if (inputRef.current) inputRef.current.focus();
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
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
        {gameActive && currentGame === 'spaceshooter' && (
          <div className="game-container mt-2">
            {gameOutput.map((line, i) => (
              <div key={i} className="leading-tight">{line}</div>
            ))}
          </div>
        )}
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