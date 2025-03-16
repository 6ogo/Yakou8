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
\n`;

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
  
  // Space shooter game state
  interface SpaceShooterState {
    playerPos: number;
    meteorites: Array<{x: number; y: number}>;
    bullets: Array<{x: number; y: number}>;
    loot: Array<{x: number; y: number}>;
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
  const GAME_HEIGHT = 10;

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
  
  // Store terminal state before game starts
  const [terminalStateBeforeGame, setTerminalStateBeforeGame] = useState<string[]>([]);
  
  // Initialize space shooter game state
  const initializeSpaceShooter = () => {
    return {
      playerPos: Math.floor(GAME_WIDTH / 2), // Player starts in the middle
      meteorites: [],
      bullets: [],
      loot: [],
      score: 0,
      gameOver: false
    };
  };

  // Render the space shooter game as ASCII art
  const renderSpaceShooter = (state: SpaceShooterState) => {
    const grid = Array(GAME_HEIGHT)
      .fill(0)
      .map(() => Array(GAME_WIDTH).fill(' '));

    // Place player
    grid[GAME_HEIGHT - 1][state.playerPos] = '^';

    // Place meteorites
    state.meteorites.forEach((meteor: { x: number; y: number }) => {
      if (meteor.y >= 0 && meteor.y < GAME_HEIGHT) {
        grid[meteor.y][meteor.x] = '*';
      }
    });

    // Place bullets
    state.bullets.forEach((bullet: { x: number; y: number }) => {
      if (bullet.y >= 0 && bullet.y < GAME_HEIGHT) {
        grid[bullet.y][bullet.x] = '|';
      }
    });

    // Place loot
    state.loot.forEach((item: { x: number; y: number }) => {
      if (item.y >= 0 && item.y < GAME_HEIGHT) {
        grid[item.y][item.x] = '$';
      }
    });

    // Convert grid to string
    let output = '\n=== SPACE SHOOTER ===\n\n';
    for (let row of grid) {
      output += row.join('') + '\n';
    }
    output += `Score: ${state.score}`;
    if (state.gameOver) {
      output += '\nGame Over! Press Q or ESC to exit.';
    } else {
      output += '\nControls: A/D or Arrow Keys to move, SPACE to shoot, Q/ESC to quit';
    }
    return output;
  };

  // Update space shooter game state based on player input
  const updateSpaceShooter = (state: SpaceShooterState, action: string): SpaceShooterState => {
    if (state.gameOver) return state;

    let newState = { ...state };

    // Player movement
    if (action === 'a' && newState.playerPos > 0) {
      newState.playerPos -= 1;
    } else if (action === 'd' && newState.playerPos < GAME_WIDTH - 1) {
      newState.playerPos += 1;
    } else if (action === ' ') {
      newState.bullets.push({ x: newState.playerPos, y: GAME_HEIGHT - 2 });
    }

    // Move bullets upward
    newState.bullets = newState.bullets
      .map((bullet: any) => ({ ...bullet, y: bullet.y - 1 }))
      .filter((bullet: any) => bullet.y >= 0);

    // Move meteorites downward
    newState.meteorites = newState.meteorites.map((meteor: any) => ({
      ...meteor,
      y: meteor.y + 1
    }));

    // Spawn new meteorites randomly
    if (Math.random() < 0.1) {
      newState.meteorites.push({
        x: Math.floor(Math.random() * GAME_WIDTH),
        y: 0
      });
    }

    // Check collisions between bullets and meteorites
    newState.bullets.forEach((bullet: any) => {
      newState.meteorites.forEach((meteor: any, index: number) => {
        if (bullet.x === meteor.x && bullet.y === meteor.y) {
          newState.meteorites.splice(index, 1);
          newState.score += 10;
          // 30% chance to drop loot
          if (Math.random() < 0.3) {
            newState.loot.push({ x: meteor.x, y: meteor.y });
          }
        }
      });
    });

    // Move loot downward
    newState.loot = newState.loot.map((item: any) => ({
      ...item,
      y: item.y + 1
    }));

    // Check for loot collection
    newState.loot.forEach((item: any, index: number) => {
      if (item.y === GAME_HEIGHT - 1 && item.x === newState.playerPos) {
        newState.score += 50; // Bonus points for loot
        newState.loot.splice(index, 1);
      }
    });

    // Check for game over
    newState.meteorites.forEach((meteor: any) => {
      if (meteor.y >= GAME_HEIGHT - 1 && meteor.x === newState.playerPos) {
        newState.gameOver = true;
      }
    });

    // Remove meteorites that have passed the bottom
    newState.meteorites = newState.meteorites.filter((meteor: any) => meteor.y < GAME_HEIGHT);
    newState.loot = newState.loot.filter((item: any) => item.y < GAME_HEIGHT);

    return newState;
  };
  
  // Game loop for space shooter
  const runSpaceShooterGameLoop = () => {
    setGameState((prevState: SpaceShooterState | null) => {
      if (!prevState) return prevState;
      const newState = updateSpaceShooter(prevState, '');
      // Update terminal output with the new game state
      setOutput(prev => {
        const newOutput = [...prev];
        // Replace the last GAME_HEIGHT + 2 lines (game grid + score + possible game over message)
        const gameLines = renderSpaceShooter(newState).split('\n').length;
        return [...newOutput.slice(0, -gameLines), ...renderSpaceShooter(newState).split('\n')];
      });
      return newState;
    });
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
      // Save the current terminal state before starting the game
      const currentTerminalState = [...output];
      
      // Clear the terminal and show only game instructions
      setOutput([]);
      await typeWriter('Starting space shooter game...');
      await typeWriter('Use A/D or arrow keys to move, SPACE to shoot, Q/ESC to quit.');
      
      // Start the game
      setGameActive(true);
      setCurrentGame('spaceshooter');
      setGameState(initializeSpaceShooter());
      
      // Store the terminal state for restoration when game ends
      setTerminalStateBeforeGame(currentTerminalState);
      
      // Start the game loop
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      gameLoopRef.current = window.setInterval(runSpaceShooterGameLoop, 200);
      
      // Set focus to the input field for keyboard controls
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else if (command === 'game guesser') {
      setGameActive(true);
      setCurrentGame('guesser');
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
    // Handle space shooter game controls directly from keyboard input
    if (gameActive && currentGame === 'spaceshooter' && gameState) {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setGameState(prevState => {
          if (!prevState) return prevState;
          return updateSpaceShooter(prevState, 'a');
        });
        return;
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault();
        setGameState(prevState => {
          if (!prevState) return prevState;
          return updateSpaceShooter(prevState, 'd');
        });
        return;
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        setGameState(prevState => {
          if (!prevState) return prevState;
          return updateSpaceShooter(prevState, ' ');
        });
        return;
      } else if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
        // Exit the game
        setGameActive(false);
        setCurrentGame('');
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        
        // Restore terminal state from before the game started
        setOutput(terminalStateBeforeGame);
        setOutput(prev => [...prev, 'Game ended.']);
        setInput('');
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
          
          // Clear game loop if it's running
          if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
            gameLoopRef.current = null;
          }
          
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
        } else if (currentGame === 'spaceshooter') {
          // Only handle 'q' command in the terminal input
          // All other controls are handled by the keydown event listener
          if (cmd !== 'q' && cmd !== '') {
            await typeWriter('Use A/D to move, SPACE to shoot, Q to quit.');
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
  
  // Effect to handle space shooter game display
  useEffect(() => {
    if (gameActive && currentGame === 'spaceshooter' && gameState) {
      // Find game content in output
      const gameStartIndex = output.findIndex(line => line.includes('=== SPACE SHOOTER ==='));
      
      if (gameStartIndex >= 0) {
        // Count how many lines the game takes up
        let gameEndIndex = gameStartIndex;
        while (gameEndIndex < output.length && 
              !output[gameEndIndex].includes('yakou8@github')) {
          gameEndIndex++;
        }
        
        // Replace game content with updated render
        const gameOutput = renderSpaceShooter(gameState).split('\n');
        const newOutput = [
          ...output.slice(0, gameStartIndex),
          ...gameOutput,
          ...output.slice(gameEndIndex)
        ];
        
        setOutput(newOutput);
      } else {
        // First time displaying the game
        const gameOutput = renderSpaceShooter(gameState).split('\n');
        setOutput(prev => [...prev, ...gameOutput]);
      }
    }
  }, [gameState]);
  
  // Clean up game loop on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const initTerminal = async () => {
      await typeWriter(ASCII_LOGO);
      await typeWriter('\n');
      await typeWriter('\nWelcome to Yakou8\'s page! Type "help" for available commands.');
    };
    initTerminal();

    const handleGlobalClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    // Handle keyboard events for the entire document to make game controls more responsive
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameActive && currentGame === 'spaceshooter' && gameState) {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
          e.preventDefault();
          setGameState(prevState => {
            if (!prevState) return prevState;
            return updateSpaceShooter(prevState, 'a');
          });
        } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
          e.preventDefault();
          setGameState(prevState => {
            if (!prevState) return prevState;
            return updateSpaceShooter(prevState, 'd');
          });
        } else if (e.key === ' ' || e.key === 'ArrowUp') {
          e.preventDefault();
          setGameState(prevState => {
            if (!prevState) return prevState;
            return updateSpaceShooter(prevState, ' ');
          });
        } else if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
          // Exit the game
          setGameActive(false);
          setCurrentGame('');
          if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
            gameLoopRef.current = null;
          }
          
          // Restore terminal state from before the game started
          setOutput(terminalStateBeforeGame);
          setOutput(prev => [...prev, 'Game ended.']);
          
          // Focus back on input
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameActive, currentGame, gameState]);

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