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

  useEffect(() => {
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

    let obstacles: GameObject[] = [];
    let animationFrameId: number;
    let isJumping = false;
    let isDucking = false;
    let jumpVelocity = 0;
    const gravity = 0.8;
    const jumpStrength = -15;
    let gameSpeed = 5;
    let frameCount = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onQuit();
        return;
      }
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
      if (e.key === 'ArrowDown' || e.key === 's') {
        isDucking = false;
        player.height = 40;
        player.y = canvas.height - 40;
      }
    };

    const spawnObstacle = () => {
      const type = Math.random() > 0.5 ? 'high' : 'low';
      const obstacle: GameObject = {
        x: canvas.width,
        y: type === 'high' ? canvas.height - 60 : canvas.height - 20,
        width: 20,
        height: type === 'high' ? 20 : 40,
        speed: gameSpeed
      };
      obstacles.push(obstacle);
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

      // Draw player
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(player.x, player.y, player.width, player.height);

      // Update and draw obstacles
      obstacles = obstacles.filter(obstacle => {
        obstacle.x -= obstacle.speed!;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        if (checkCollision(player, obstacle)) {
          setGameOver(true);
          return false;
        }
        
        return obstacle.x > -obstacle.width;
      });

      // Spawn new obstacles
      frameCount++;
      if (frameCount % 100 === 0) {
        spawnObstacle();
        setScore(prev => prev + 1);
      }

      // Increase difficulty
      if (frameCount % 500 === 0) {
        gameSpeed += 0.5;
      }

      // Draw score
      ctx.fillStyle = '#00FF00';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${score}`, 10, 30);

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    // Start game
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onQuit]);

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
            <p className="mb-4">Score: {score}</p>
            <button
              onClick={onQuit}
              className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400"
            >
              Quit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};