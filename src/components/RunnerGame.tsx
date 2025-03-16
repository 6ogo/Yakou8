import React, { useEffect, useRef, useState } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
}

interface RunnerGameProps {
  onQuit: () => void;
}

export const RunnerGame: React.FC<RunnerGameProps> = ({ onQuit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const savedHighScore = localStorage.getItem('runnerHighScore');
    return savedHighScore ? parseInt(savedHighScore, 10) : 0;
  });
  const scoreRef = useRef(0);
  const gameStateRef = useRef({
    isRunning: true,
    obstacles: [] as GameObject[],
    frameCount: 0,
    gameSpeed: 5
  });

  const resetGame = () => {
    setGameOver(false);
    setScore(0);
    scoreRef.current = 0;
    gameStateRef.current = {
      isRunning: true,
      obstacles: [],
      frameCount: 0,
      gameSpeed: 5
    };
  };
  
  // Update high score when game is over
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('runnerHighScore', score.toString());
    }
  }, [gameOver, score, highScore]);

  useEffect(() => {
    // Prevent Terminal input focus when clicking the game canvas
    const preventTerminalInterference = (e: MouseEvent) => {
      if (e.target === canvasRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('click', preventTerminalInterference);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player: GameObject = {
      x: 50,
      y: canvas.height - 40,
      width: 20,
      height: 40
    };

    let isJumping = false;
    let isDucking = false;
    let jumpVelocity = 0;
    const gravity = 0.8;
    const jumpStrength = -15;
    let animationFrameId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onQuit();
        return;
      }
      
      if (gameOver) return;
      
      if ((e.key === 'ArrowUp' || e.key === 'w') && !isJumping) {
        isJumping = true;
        jumpVelocity = jumpStrength;
      }
      if ((e.key === 'ArrowDown' || e.key === 's') && !isDucking) {
        isDucking = true;
        player.height = 20;
        player.y = canvas.height - 20;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      if (e.key === 'ArrowDown' || e.key === 's') {
        isDucking = false;
        player.height = 40;
        player.y = canvas.height - 40;
      }
    };

    const spawnObstacle = () => {
      const type = Math.random() > 0.5 ? 'high' : 'low';
      // Adjust obstacle positions - move low obstacles down so they are properly positioned for ducking
      const obstacle: GameObject = {
        x: canvas.width,
        y: type === 'high' ? canvas.height - 70 : canvas.height - 20, // Adjust high obstacles to be higher
        width: 20,
        height: type === 'high' ? 30 : 20, // Make high obstacles taller, low obstacles shorter
        speed: gameStateRef.current.gameSpeed
      };
      gameStateRef.current.obstacles.push(obstacle);
    };

    const checkCollision = (rect1: GameObject, rect2: GameObject) => {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
    };

    const gameLoop = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Process player movement only if game is running
      if (!gameOver) {
        // Update player
        if (isJumping) {
          player.y += jumpVelocity;
          jumpVelocity += gravity;

          if (player.y >= canvas.height - player.height) {
            player.y = canvas.height - player.height;
            isJumping = false;
            jumpVelocity = 0;
          }
        }
      }

      // Draw player
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(player.x, player.y, player.width, player.height);

      // Update and draw obstacles
      gameStateRef.current.obstacles = gameStateRef.current.obstacles.filter(obstacle => {
        // Only move obstacles if game is running
        if (!gameOver) {
          obstacle.x -= obstacle.speed!;
        }
        
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Check collision only if game is running
        if (!gameOver && checkCollision(player, obstacle)) {
          setGameOver(true);
          gameStateRef.current.isRunning = false;
          return false;
        }
        
        return obstacle.x > -obstacle.width;
      });

      // Only update game state if not game over
      if (!gameOver) {
        // Spawn new obstacles
        gameStateRef.current.frameCount++;
        if (gameStateRef.current.frameCount % 100 === 0) {
          spawnObstacle();
          // Increment score and update the ref to maintain current value
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }

        // Increase difficulty
        if (gameStateRef.current.frameCount % 500 === 0) {
          gameStateRef.current.gameSpeed += 0.5;
        }
      }

      // Draw score
      ctx.fillStyle = '#00FF00';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${score}`, 10, 30);
      
      // Draw controls info if game is running
      if (!gameOver) {
        ctx.font = '14px monospace';
        ctx.fillText('W/⬆️: Jump | S/⬇️: Duck | ESC: Quit', canvas.width / 2 - 140, 30);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Start game
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('click', preventTerminalInterference);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onQuit, gameOver]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="border border-green-500"
      />
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center">
            <h2 className="text-2xl mb-4">Game Over!</h2>
            <p className="mb-2">Score: {score}</p>
            <p className="mb-4">High Score: {highScore}</p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400"
              >
                Restart
              </button>
              <button
                onClick={onQuit}
                className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};