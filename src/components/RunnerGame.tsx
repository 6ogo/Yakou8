import React, { useEffect, useRef, useState } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
  type?: 'high' | 'low';
  passed?: boolean;
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
  // Define types for background elements
  type MountainElement = { x: number; width: number; height: number };
  type HillElement = { x: number; width: number; height: number };
  type GroundElement = { x: number; width: number; height?: number };
  type SpeedNotification = {
    active: boolean;
    duration: number;
    message: string;
    opacity: number;
  };

  const gameStateRef = useRef({
    isRunning: true,
    obstacles: [] as GameObject[],
    frameCount: 0,
    gameSpeed: 5,
    backgroundLayers: [
      { offset: 0, speed: 1, elements: [] as MountainElement[] },  // Far background mountains
      { offset: 0, speed: 2, elements: [] as HillElement[] },      // Mid background hills
      { offset: 0, speed: 5, elements: [] as GroundElement[] }     // Ground details
    ],
    speedNotification: {
      active: false,
      duration: 3,
      message: '',
      opacity: 1.0
    } as SpeedNotification
  });

  const resetGame = () => {
    setGameOver(false);
    setScore(0);
    scoreRef.current = 0;
    gameStateRef.current = {
      isRunning: true,
      obstacles: [],
      frameCount: 0,
      gameSpeed: 5,
      backgroundLayers: [
        { offset: 0, speed: 1, elements: [] as MountainElement[] },
        { offset: 0, speed: 2, elements: [] as HillElement[] },
        { offset: 0, speed: 5, elements: [] as GroundElement[] }
      ],
      speedNotification: {
        active: false,
        duration: 0,
        message: '',
        opacity: 1.0
      }
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
      // Prevent game keys from affecting the terminal
      if (['ArrowUp', 'ArrowDown', 'w', 's', 'Escape'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
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
      // Prevent game keys from affecting the terminal
      if (['ArrowUp', 'ArrowDown', 'w', 's', 'Escape'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
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
        y: type === 'high' ? canvas.height - 60 : canvas.height - 20, // Position low obstacles much lower so they can't be ducked under
        width: 20,
        height: type === 'high' ? 30 : 20, // High obstacles require duck, low obstacles require jump
        speed: gameStateRef.current.gameSpeed,
        type: type, // Store the type for easier reference
        passed: false // Track if player has passed this obstacle
      };
      
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
    
    // Initialize background elements if empty
    const initBackgroundElements = () => {
      // Far background - mountains
      if (gameStateRef.current.backgroundLayers[0].elements.length === 0) {
        for (let i = 0; i < 15; i++) {
          const width = 120 + Math.random() * 80;
          const height = 30 + Math.random() * 40;
          gameStateRef.current.backgroundLayers[0].elements.push({
            x: i * (width - 40),
            width,
            height
          });
        }
      }
      
      // Mid background - hills
      if (gameStateRef.current.backgroundLayers[1].elements.length === 0) {
        for (let i = 0; i < 10; i++) {
          const width = 80 + Math.random() * 60;
          const height = 15 + Math.random() * 25;
          gameStateRef.current.backgroundLayers[1].elements.push({
            x: i * (width - 20),
            width,
            height
          });
        }
      }
      
      // Ground details
      if (gameStateRef.current.backgroundLayers[2].elements.length === 0) {
        for (let i = 0; i < 30; i++) {
          const width = 20 + Math.random() * 30;
          gameStateRef.current.backgroundLayers[2].elements.push({
            x: i * 50,
            width,
            height: 2 // Add height property for consistency
          });
        }
      }
    };
    
    initBackgroundElements();

    const gameLoop = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw scrolling background layers
      if (!gameOver) {
        // Update each background layer
        gameStateRef.current.backgroundLayers.forEach((layer, index) => {
          layer.offset = (layer.offset - (layer.speed * gameStateRef.current.gameSpeed / 5)) % canvas.width;
          
          // Draw the elements for this layer
          if (index === 0) { // Far mountains
            ctx.fillStyle = '#111122';
            layer.elements.forEach(mountain => {
              const xPos = (mountain.x + layer.offset) % (canvas.width * 2) - mountain.width/2;
              
              // Draw only if visible
              if (xPos < canvas.width && xPos + mountain.width > 0) {
                ctx.beginPath();
                ctx.moveTo(xPos, groundY);
                // Ensure height is defined with a fallback value
                const mountainHeight = mountain.height || 30;
                ctx.lineTo(xPos + mountain.width/2, groundY - mountainHeight);
                ctx.lineTo(xPos + mountain.width, groundY);
                ctx.fill();
              }
            });
          } else if (index === 1) { // Mid hills
            ctx.fillStyle = '#222233';
            layer.elements.forEach(hill => {
              const xPos = (hill.x + layer.offset) % (canvas.width * 1.5) - hill.width/2;
              
              // Draw only if visible
              if (xPos < canvas.width && xPos + hill.width > 0) {
                ctx.beginPath();
                ctx.moveTo(xPos, groundY);
                // Ensure height is defined with a fallback value
                const hillHeight = hill.height || 15;
                ctx.quadraticCurveTo(
                  xPos + hill.width/2, groundY - hillHeight,
                  xPos + hill.width, groundY
                );
                ctx.fill();
              }
            });
          } else if (index === 2) { // Ground details
            ctx.fillStyle = '#333344';
            layer.elements.forEach(detail => {
              const xPos = (detail.x + layer.offset) % (canvas.width * 1.2) - detail.width/2;
              const detailHeight = detail.height || 2; // Use height if provided, or default to 2
              
              // Draw only if visible
              if (xPos < canvas.width && xPos + detail.width > 0) {
                ctx.fillRect(xPos, groundY - detailHeight, detail.width, detailHeight);
              }
            });
          }
        });
      }
      
      // Draw ground
      ctx.fillStyle = '#333355';
      ctx.fillRect(0, groundY, canvas.width, 10);

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
          
          // Add score when passing an obstacle (when the obstacle passes the player)
          if (obstacle.x + obstacle.width < player.x && !obstacle.passed) {
            obstacle.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
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
            // For low obstacles, player must be jumping to avoid a collision
            if (checkCollision(player, obstacle) && !isJumping) {
              setGameOver(true);
              gameStateRef.current.isRunning = false;
              return false;
            }
          } else if (obstacle.type === 'high') {
            // For high obstacles, player must be ducking to avoid a collision
            if (checkCollision(player, obstacle) && !isDucking) {
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

        // Increase difficulty more aggressively
        if (gameStateRef.current.frameCount % 300 === 0 && gameStateRef.current.frameCount > 0) {
          gameStateRef.current.gameSpeed += 0.5;
          
          // Set the speed notification to be displayed for 180 frames (about 3 seconds at 60fps)
          gameStateRef.current.speedNotification = {
            active: true,
            duration: 180,
            message: `Speed increased to ${gameStateRef.current.gameSpeed.toFixed(1)}!`,
            opacity: 1.0
          };
        }
      }

      // Draw score and speed - use the ref value directly to ensure we see updates in real time
      ctx.fillStyle = '#00FF00';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 30);
      ctx.fillText(`Speed: ${gameStateRef.current.gameSpeed.toFixed(1)}`, 10, 60);
      
      // Draw speed increase notification if active
      if (gameStateRef.current.speedNotification.active) {
        // Create a pulsing effect by varying the opacity
        const notification = gameStateRef.current.speedNotification;
        const pulseRate = Math.sin(gameStateRef.current.frameCount * 0.1) * 0.2 + 0.8; // Value between 0.6 and 1.0
        
        // Set up text style with glow effect
        ctx.fillStyle = `rgba(255, 255, 0, ${notification.opacity * pulseRate})`;
        ctx.font = 'bold 28px Arial';
        
        // Add shadow/glow effect
        ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Center the text
        const text = notification.message;
        const textWidth = ctx.measureText(text).width;
        const textX = (canvas.width - textWidth) / 2;
        const textY = 100; // Position it lower on the screen for better visibility
        
        // Draw text with outline for better visibility
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(text, textX, textY);
        ctx.fillText(text, textX, textY);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Decrease the duration counter
        notification.duration--;
        
        // Fade out during the last 60 frames (1 second)
        if (notification.duration < 60) {
          notification.opacity = notification.duration / 60;
        }
        
        // Deactivate notification when duration reaches zero
        if (notification.duration <= 0) {
          notification.active = false;
        }
      }
      
      // Also update the React state periodically for high score tracking
      if (!gameOver && scoreRef.current !== score) {
        setScore(scoreRef.current);
      }
      
      // Draw controls info if game is running
      if (!gameOver) {
        ctx.font = '14px monospace';
        ctx.fillText('W/⬆️: Jump over low obstacles | S/⬇️: Duck under high obstacles | ESC: Quit', canvas.width / 2 - 240, 30);
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