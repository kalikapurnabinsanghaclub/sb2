
// ARCADE ENGINE
let activeGameMode = null; // 'rhythm' or 'brick'
let gameAnimId = null;
let gameScore = 0;
let gameRunning = false;

window.launchRhythmGame = function() {
  activeGameMode = 'rhythm';
  document.getElementById('game-title-icon').innerText = '≡ƒÄ╢';
  document.getElementById('game-title-text').innerText = 'Stage Rhythm Blitz';
  document.getElementById('game-subtitle').innerText = 'Tap 4 Note Lanes to the Beat!';
  document.getElementById('game-score-display').innerText = 'Score: 0';
  
  document.getElementById('go-icon').innerText = '≡ƒÄ╢';
  document.getElementById('go-title').innerText = 'Stage Rhythm Blitz';
  document.getElementById('go-desc').innerText = 'Tap the 4 target buttons at the bottom as notes drop down!';
  document.getElementById('go-final-score').style.display = 'none';
  document.getElementById('go-start-btn').innerText = '≡ƒÜÇ Start Playing';
  
  document.getElementById('game-overlay').style.display = 'flex';
  document.getElementById('arcade-game-modal').style.display = 'flex';
  initCanvas();
  drawRhythmPreview();
};

window.launchBrickGame = function() {
  activeGameMode = 'brick';
  document.getElementById('game-title-icon').innerText = '≡ƒº▒';
  document.getElementById('game-title-text').innerText = 'Neon Brick Breaker';
  document.getElementById('game-subtitle').innerText = 'Smash Category Bricks & Catch Power-ups!';
  document.getElementById('game-score-display').innerText = 'Score: 0';

  document.getElementById('go-icon').innerText = '≡ƒº▒';
  document.getElementById('go-title').innerText = 'Neon Brick Breaker';
  document.getElementById('go-desc').innerText = 'Drag your finger or mouse left and right to control the paddle!';
  document.getElementById('go-final-score').style.display = 'none';
  document.getElementById('go-start-btn').innerText = '≡ƒÜÇ Start Playing';

  document.getElementById('game-overlay').style.display = 'flex';
  document.getElementById('arcade-game-modal').style.display = 'flex';
  initCanvas();
  drawBrickPreview();
};

window.closeArcadeModal = function() {
  gameRunning = false;
  if (gameAnimId) cancelAnimationFrame(gameAnimId);
  document.getElementById('arcade-game-modal').style.display = 'none';
};

function initCanvas() {
  const cvs = document.getElementById('arcade-canvas');
  cvs.width = 400;
  cvs.height = 600;
}

window.startActiveGame = function() {
  document.getElementById('game-overlay').style.display = 'none';
  gameScore = 0;
  gameRunning = true;
  if (gameAnimId) cancelAnimationFrame(gameAnimId);
  
  if (activeGameMode === 'rhythm') {
    runRhythmGameEngine();
  } else if (activeGameMode === 'brick') {
    runBrickGameEngine();
  }
};


// ---------------------------------------------------------
// GAME 1: STAGE RHYTHM BLITZ
// ---------------------------------------------------------
let rhythmState = {};

function drawRhythmPreview() {
  const cvs = document.getElementById('arcade-canvas');
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 400, 600);
  
  // Draw 4 lanes preview
  const laneW = 100;
  const colors = ['#ec4899', '#3b82f6', '#f59e0b', '#10b981'];
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(i * laneW, 0, laneW, 600);
    
    ctx.fillStyle = colors[i];
    ctx.globalAlpha = 0.2;
    ctx.fillRect(i * laneW + 10, 510, laneW - 20, 60);
    ctx.globalAlpha = 1.0;
  }
}

function runRhythmGameEngine() {
  const cvs = document.getElementById('arcade-canvas');
  const ctx = cvs.getContext('2d');
  
  const laneColors = ['#ec4899', '#3b82f6', '#f59e0b', '#10b981'];
  const laneKeys = ['D', 'F', 'J', 'K'];
  
  rhythmState = {
    notes: [],
    particles: [],
    combo: 0,
    health: 100,
    lastHitText: '',
    lastHitColor: '#fff',
    spawnTimer: 0
  };

  // Touch & Mouse Handler for Lane Taps
  function handleTap(x, y) {
    if (!gameRunning) return;
    const laneIndex = Math.floor((x / cvs.clientWidth) * 4);
    if (laneIndex >= 0 && laneIndex < 4) {
      checkRhythmHit(laneIndex);
    }
  }

  cvs.onpointerdown = (e) => {
    const rect = cvs.getBoundingClientRect();
    handleTap(e.clientX - rect.left, e.clientY - rect.top);
  };

  window.onkeydown = (e) => {
    if (!gameRunning || activeGameMode !== 'rhythm') return;
    const k = e.key.toUpperCase();
    if (k === 'D' || k === '1') checkRhythmHit(0);
    if (k === 'F' || k === '2') checkRhythmHit(1);
    if (k === 'J' || k === '3') checkRhythmHit(2);
    if (k === 'K' || k === '4') checkRhythmHit(3);
  };

  function checkRhythmHit(lane) {
    const targetY = 530;
    let hitFound = false;
    
    for (let i = rhythmState.notes.length - 1; i >= 0; i--) {
      const n = rhythmState.notes[i];
      if (n.lane === lane) {
        const dist = Math.abs(n.y - targetY);
        if (dist < 45) {
          hitFound = true;
          rhythmState.notes.splice(i, 1);
          rhythmState.combo++;
          
          let pts = 100;
          if (dist < 18) {
            pts = 150;
            rhythmState.lastHitText = 'PERFECT!';
            rhythmState.lastHitColor = '#f59e0b';
          } else {
            rhythmState.lastHitText = 'GREAT!';
            rhythmState.lastHitColor = '#10b981';
          }
          
          gameScore += pts * (1 + Math.floor(rhythmState.combo / 10) * 0.5);
          document.getElementById('game-score-display').innerText = `Score: ${Math.floor(gameScore)}`;
          
          // Spawn particles
          for (let p = 0; p < 8; p++) {
            rhythmState.particles.push({
              x: lane * 100 + 50,
              y: targetY,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: laneColors[lane],
              life: 20
            });
          }
          break;
        }
      }
    }
    
    if (!hitFound) {
      rhythmState.combo = 0;
      rhythmState.lastHitText = 'MISS!';
      rhythmState.lastHitColor = '#ef4444';
      rhythmState.health = Math.max(0, rhythmState.health - 5);
    }
  }

  function loop() {
    if (!gameRunning) return;
    
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 400, 600);
    
    // Spawn notes
    rhythmState.spawnTimer++;
    if (rhythmState.spawnTimer % 35 === 0) {
      const lane = Math.floor(Math.random() * 4);
      rhythmState.notes.push({ lane: lane, y: -20, speed: 4 + Math.min(6, gameScore / 500) });
    }
    
    // Draw Lanes
    const laneW = 100;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeRect(i * laneW, 0, laneW, 600);
      
      // Target Line
      ctx.fillStyle = laneColors[i];
      ctx.globalAlpha = 0.25;
      ctx.fillRect(i * laneW + 8, 510, laneW - 16, 45);
      ctx.globalAlpha = 1.0;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(laneKeys[i], i * laneW + 50, 538);
    }

    // Update & Draw Notes
    for (let i = rhythmState.notes.length - 1; i >= 0; i--) {
      const n = rhythmState.notes[i];
      n.y += n.speed;
      
      ctx.fillStyle = laneColors[n.lane];
      ctx.beginPath();
      ctx.roundRect(n.lane * 100 + 12, n.y - 12, 76, 24, 8);
      ctx.fill();
      ctx.shadowColor = laneColors[n.lane];
      ctx.shadowBlur = 10;
      ctx.shadowBlur = 0;

      // Missed note off screen
      if (n.y > 580) {
        rhythmState.notes.splice(i, 1);
        rhythmState.combo = 0;
        rhythmState.lastHitText = 'MISS!';
        rhythmState.lastHitColor = '#ef4444';
        rhythmState.health = Math.max(0, rhythmState.health - 8);
      }
    }

    // Update Particles
    for (let i = rhythmState.particles.length - 1; i >= 0; i--) {
      const p = rhythmState.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      if (p.life <= 0) rhythmState.particles.splice(i, 1);
    }

    // Draw UI HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Combo: ${rhythmState.combo}x`, 15, 30);

    // Health bar
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(260, 15, 125, 14);
    ctx.fillStyle = rhythmState.health > 30 ? '#10b981' : '#ef4444';
    ctx.fillRect(260, 15, (rhythmState.health / 100) * 125, 14);

    // Hit feedback text
    if (rhythmState.lastHitText) {
      ctx.fillStyle = rhythmState.lastHitColor;
      ctx.font = '900 22px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(rhythmState.lastHitText, 200, 470);
    }

    // Game Over check
    if (rhythmState.health <= 0) {
      gameRunning = false;
      document.getElementById('go-final-score').innerText = `Final Score: ${Math.floor(gameScore)}`;
      document.getElementById('go-final-score').style.display = 'block';
      document.getElementById('go-title').innerText = 'Game Over!';
      document.getElementById('go-start-btn').innerText = '≡ƒöä Play Again';
      document.getElementById('game-overlay').style.display = 'flex';
      return;
    }

    gameAnimId = requestAnimationFrame(loop);
  }

  loop();
}


// ---------------------------------------------------------
// GAME 2: NEON BRICK BREAKER
// ---------------------------------------------------------
let brickState = {};

function drawBrickPreview() {
  const cvs = document.getElementById('arcade-canvas');
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 400, 600);
  
  // Sample Bricks
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      ctx.fillStyle = colors[r % colors.length];
      ctx.fillRect(c * 76 + 12, r * 28 + 40, 70, 22);
    }
  }
}

function runBrickGameEngine() {
  const cvs = document.getElementById('arcade-canvas');
  const ctx = cvs.getContext('2d');
  
  const brickColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
  
  brickState = {
    paddleW: 90,
    paddleX: 155,
    balls: [{ x: 200, y: 520, vx: 3.5, vy: -4.5, fireball: false }],
    bricks: [],
    powerups: [],
    particles: [],
    lives: 3
  };

  // Build Bricks
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      brickState.bricks.push({
        x: c * 74 + 16,
        y: r * 26 + 50,
        w: 68,
        h: 20,
        color: brickColors[r],
        active: true
      });
    }
  }

  // Pointer & Touch drag paddle
  cvs.onpointermove = (e) => {
    if (!gameRunning) return;
    const rect = cvs.getBoundingClientRect();
    const x = e.clientX - rect.left;
    brickState.paddleX = Math.max(0, Math.min(400 - brickState.paddleW, x - brickState.paddleW / 2));
  };

  function loop() {
    if (!gameRunning) return;
    
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 400, 600);
    
    // Draw Paddle
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(brickState.paddleX, 560, brickState.paddleW, 14, 7);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Bricks
    let activeCount = 0;
    brickState.bricks.forEach(b => {
      if (b.active) {
        activeCount++;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();
      }
    });

    // Win check -> reset bricks
    if (activeCount === 0) {
      brickState.bricks.forEach(b => b.active = true);
      gameScore += 500;
    }

    // Update & Draw Balls
    for (let i = brickState.balls.length - 1; i >= 0; i--) {
      const ball = brickState.balls[i];
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall Bounce
      if (ball.x <= 8 || ball.x >= 392) ball.vx *= -1;
      if (ball.y <= 8) ball.vy *= -1;

      // Paddle Bounce
      if (ball.y >= 550 && ball.y <= 566 && ball.x >= brickState.paddleX && ball.x <= brickState.paddleX + brickState.paddleW) {
        ball.vy = -Math.abs(ball.vy);
        const hitPos = (ball.x - (brickState.paddleX + brickState.paddleW / 2)) / (brickState.paddleW / 2);
        ball.vx = hitPos * 5;
      }

      // Brick Collision
      brickState.bricks.forEach(b => {
        if (b.active && ball.x >= b.x && ball.x <= b.x + b.w && ball.y >= b.y && ball.y <= b.y + b.h) {
          b.active = false;
          if (!ball.fireball) ball.vy *= -1;
          gameScore += 20;
          document.getElementById('game-score-display').innerText = `Score: ${gameScore}`;

          // Spawn Powerup chance
          if (Math.random() < 0.25) {
            const types = ['multi', 'wide', 'fire'];
            brickState.powerups.push({
              x: b.x + b.w / 2,
              y: b.y,
              type: types[Math.floor(Math.random() * types.length)]
            });
          }
        }
      });

      // Draw Ball
      ctx.fillStyle = ball.fireball ? '#ef4444' : '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
      ctx.fill();

      // Ball Out of Bounds
      if (ball.y > 610) {
        brickState.balls.splice(i, 1);
      }
    }

    // Check lost all balls
    if (brickState.balls.length === 0) {
      brickState.lives--;
      if (brickState.lives > 0) {
        brickState.balls.push({ x: 200, y: 520, vx: 3.5, vy: -4.5, fireball: false });
      } else {
        gameRunning = false;
        document.getElementById('go-final-score').innerText = `Final Score: ${gameScore}`;
        document.getElementById('go-final-score').style.display = 'block';
        document.getElementById('go-title').innerText = 'Game Over!';
        document.getElementById('go-start-btn').innerText = '≡ƒöä Play Again';
        document.getElementById('game-overlay').style.display = 'flex';
        return;
      }
    }

    // Update & Draw Powerups
    for (let i = brickState.powerups.length - 1; i >= 0; i--) {
      const pw = brickState.powerups[i];
      pw.y += 2.5;

      const pColors = { multi: '#f59e0b', wide: '#3b82f6', fire: '#ef4444' };
      const pIcons = { multi: 'ΓÜí', wide: '≡ƒ¢í∩╕Å', fire: '≡ƒöÑ' };

      ctx.fillStyle = pColors[pw.type];
      ctx.beginPath();
      ctx.arc(pw.x, pw.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(pIcons[pw.type], pw.x, pw.y + 3);

      // Catch Powerup
      if (pw.y >= 555 && pw.y <= 575 && pw.x >= brickState.paddleX && pw.x <= brickState.paddleX + brickState.paddleW) {
        if (pw.type === 'multi') {
          brickState.balls.push({ x: brickState.paddleX + 20, y: 540, vx: -3, vy: -4, fireball: false });
          brickState.balls.push({ x: brickState.paddleX + 60, y: 540, vx: 3, vy: -4, fireball: false });
        } else if (pw.type === 'wide') {
          brickState.paddleW = 140;
          setTimeout(() => brickState.paddleW = 90, 8000);
        } else if (pw.type === 'fire') {
          brickState.balls.forEach(b => b.fireball = true);
          setTimeout(() => brickState.balls.forEach(b => b.fireball = false), 6000);
        }
        brickState.powerups.splice(i, 1);
      } else if (pw.y > 610) {
        brickState.powerups.splice(i, 1);
      }
    }

    // Draw HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${'Γ¥ñ∩╕Å'.repeat(brickState.lives)}`, 15, 30);

    gameAnimId = requestAnimationFrame(loop);
  }

  loop();
}

