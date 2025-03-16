import React, { useEffect, useRef, useState } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
  type?: 'high' | 'low';
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
      // Give it slightly more chance to spawn a low obstacle
      const type = Math.random() > 0.6 ? 'high' : 'low';
      const obstacle: GameObject = {
        x: canvas.width,
        y: type === 'high' ? canvas.height - 70 : canvas.height - 40, // Position low obstacles at player standing height
        width: 20,
        height: type === 'high' ? 30 : 20, // High obstacles require jump, low obstacles require duck
        speed: gameStateRef.current.gameSpeed,
        type: type // Store the type for easier reference
      };
      
      // Increment score immediately when obstacle is spawned
      scoreRef.current += 1;
      // Force update score display
      setScore(scoreRef.current);
      
      gameStateRef.current.obstacles.push(obstacle);
    };

    const checkCollision = (rect1: GameObject, rect2: GameObject) => {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
    };

    // Background elements
    const groundY = canvas.height - 10;
    let backgroundOffset = 0;

    const gameLoop = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw scrolling background elements
      if (!gameOver) {
        backgroundOffset = (backgroundOffset - gameStateRef.current.gameSpeed) % 50;
      }
      
      // Draw ground
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, groundY, canvas.width, 10);
      
      // Draw background elements (stripes to show movement)
      ctx.fillStyle = '#222222';
      for (let i = 0; i < canvas.width/50 + 1; i++) {
        ctx.fillRect(i * 50 + backgroundOffset, groundY - 2, 30, 2);
      }
      
      // Draw distant background elements
      ctx.fillStyle = '#111111';
      for (let i = 0; i < 10; i++) {
        const mountainSize = 30 + Math.sin(i * 0.3) * 20;
        ctx.beginPath();
        ctx.moveTo(i * 100 + (backgroundOffset * 0.5) % canvas.width, groundY);
        ctx.lineTo(i * 100 + 50 + (backgroundOffset * 0.5) % canvas.width, groundY - mountainSize);
        ctx.lineTo(i * 100 + 100 + (backgroundOffset * 0.5) % canvas.width, groundY);
        ctx.fill();
      }

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
        
        // Draw obstacle with color based on type
        if (obstacle.type === 'high') {
          ctx.fillStyle = '#FF4444'; // Red for high obstacles (jump)
        } else {
          ctx.fillStyle = '#4444FF'; // Blue for low obstacles (duck)
        }
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Check collision only if game is running
        if (!gameOver) {
          // Special collision handling for different obstacle types
          if (obstacle.type === 'low') {
            // For low obstacles, player must be ducking to avoid a collision
            if (checkCollision(player, obstacle) && !isDucking) {
              setGameOver(true);
              gameStateRef.current.isRunning = false;
              return false;
            }
          } else if (obstacle.type === 'high') {
            // For high obstacles, player must be jumping to avoid a collision
            if (checkCollision(player, obstacle) && !isJumping) {
              setGameOver(true);
              gameStateRef.current.isRunning = false;
              return false;
            }
          }
        }
        
        return obstacle.x > -obstacle.width;
      });

      // Only update game state if not game over
      if (!gameOver) {
        // Spawn new obstacles
        gameStateRef.current.frameCount++;
        if (gameStateRef.current.frameCount % 100 === 0) {
          spawnObstacle();
          // Score is now incremented inside spawnObstacle
        }

        // Increase difficulty
        if (gameStateRef.current.frameCount % 500 === 0) {
          gameStateRef.current.gameSpeed += 0.5;
        }
      }

      // Draw score - use the ref value directly to ensure we see updates in real time
      ctx.fillStyle = '#00FF00';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 30);
      
      // Also update the React state periodically for high score tracking
      if (!gameOver && scoreRef.current !== score) {
        setScore(scoreRef.current);
      }
      
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