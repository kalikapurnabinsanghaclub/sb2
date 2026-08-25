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

</script>
<script src="lib/supabase.js">
// =========================================================
// ≡ƒÄ« KNSDC ARCADE GAMES ENGINE (Rhythm Blitz & Brick Breaker)
// =========================================================
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

</script>
<script src="lib/localSync-v4.js?v=250">
// =========================================================
// ≡ƒÄ« KNSDC ARCADE GAMES ENGINE (Rhythm Blitz & Brick Breaker)
// =========================================================
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

</script>
<script>
window.syncEngine = new (window.LocalSync || LocalSync)();

let CURRENT_USER = null;
let lastStageStatus = null;
let lastRound = null;
let initialSyncFired = false;
let vibrationInterval = null;

// ==========================================
// SHARE POSTER LOGIC (Canvas-Based)
// ==========================================
let currentShareColor = '#7c3aed';
let currentBorderStyle = 'greek';
let temporarySelfieUrl = null;
let cameraStream = null;
let _posterCanvas = null;

function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustColorBrightness(hex, percent) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

function openShareModal() {
  document.getElementById('share-modal').style.display = 'flex';
  selectBorder(currentBorderStyle);
  openCamera(); // Automatically launch selfie camera inside the frame
}

function selectBorder(style) {
  currentBorderStyle = style;
  
  const btnIds = ['greek', 'wave', 'leaf', 'double', 'line', 'none'];
  btnIds.forEach(id => {
    const btn = document.getElementById(`border-btn-${id}`);
    if (btn) {
      if (id === style) {
        btn.style.background = 'var(--accent)';
        btn.style.color = '#ffffff';
        btn.style.borderColor = 'var(--accent)';
      } else {
        btn.style.background = 'rgba(255,255,255,0.06)';
        btn.style.color = 'var(--text)';
        btn.style.borderColor = 'rgba(255,255,255,0.1)';
      }
    }
  });

  selectFrame(currentShareColor);
}

function closeShareModal() {
  stopCamera();
  document.getElementById('share-modal').style.display = 'none';
  if (temporarySelfieUrl) {
    URL.revokeObjectURL(temporarySelfieUrl);
    temporarySelfieUrl = null;
  }
  if (window._tempPhotoBlob) {
    URL.revokeObjectURL(window._tempPhotoBlob);
    window._tempPhotoBlob = null;
  }
}

// ---- Live Camera ----
function openCamera() {
  const video = document.getElementById('selfie-video');
  const overlay = document.getElementById('camera-overlay');
  const canvas = document.getElementById('poster-canvas');
  
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
      video.style.display = 'block';
      canvas.style.display = 'block'; // Keep canvas visible
      overlay.style.display = 'flex';
      window._isCameraLive = true;
      selectFrame(currentShareColor); // Re-render canvas as transparent overlay
    })
    .catch(() => {
      toast('Camera not available. Please upload a photo instead.');
      // Fallback: open file picker
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        if (temporarySelfieUrl) URL.revokeObjectURL(temporarySelfieUrl);
        temporarySelfieUrl = URL.createObjectURL(file);
        selectFrame(currentShareColor);
      };
      inp.click();
    });
}

function captureFromCamera() {
  const video = document.getElementById('selfie-video');
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  tempCanvas.getContext('2d').drawImage(video, 0, 0);
  tempCanvas.toBlob(blob => {
    if (temporarySelfieUrl) URL.revokeObjectURL(temporarySelfieUrl);
    temporarySelfieUrl = URL.createObjectURL(blob);
    stopCamera();
    selectFrame(currentShareColor);
  }, 'image/jpeg', 0.95);
}

function stopCamera() {
  const video = document.getElementById('selfie-video');
  const overlay = document.getElementById('camera-overlay');
  const canvas = document.getElementById('poster-canvas');
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  video.srcObject = null;
  video.style.display = 'none';
  canvas.style.display = 'block';
  overlay.style.display = 'none';
  window._isCameraLive = false;
}

function selectFrame(colorHex) {
  if (colorHex && colorHex.startsWith('#')) {
    currentShareColor = colorHex;
  }
 
  // Update UI color circle elements
  const preview = document.getElementById('color-preview-circle');
  if (preview) preview.style.background = currentShareColor;
  const label = document.getElementById('color-hex-label');
  if (label) label.innerText = currentShareColor.toUpperCase();
  const inputEl = document.getElementById('poster-color-picker');
  if (inputEl && inputEl.value !== currentShareColor) {
    inputEl.value = currentShareColor;
  }
 
  const state = window.syncEngine.getData() || {};
  const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER));
  if (!p) return;
  const ev = (state.events || []).find(e => String(e.id) === String(p.eventId));
  if (!ev) return;
 
  const c = (ev.categories || []).find(x => String(x.id) === String(p.catId));
  const catName = c ? c.name.toUpperCase() : 'OPEN CATEGORY';
 
  let scoreText = null;
  if (p.stageStatus === 'done' && p.scores && Object.keys(p.scores).length > 0) {
    let totalScore = 0;
    Object.values(p.scores).forEach(s => totalScore += (Number(s.total) || 0));
    scoreText = `TOTAL SCORE: ${totalScore.toFixed(1)}`;
  }
 
  // Determine photo URL
  const photoField = (ev.formFields || []).find(f => f.type === 'photo');
  let photoUrl = null;
  if (temporarySelfieUrl) {
    photoUrl = temporarySelfieUrl;
  } else if (photoField && p.formAnswers && p.formAnswers[photoField.id]) {
    photoUrl = p.formAnswers[photoField.id];
  }
 
  const pData = {
    name: (p.name || 'Participant').toUpperCase(),
    eventName: (ev.name || 'DANCE IGNITION 5').toUpperCase(),
    orgName: (ev.org || 'KALIKAPUR NABIN SANGHA').toUpperCase(),
    catName,
    scoreText,
    photoUrl
  };
 
  drawPosterOnCanvas(currentShareColor, pData);
}
 
function onCustomColorChange(val) {
  selectFrame(val);
}

// ---- Canvas Poster Renderer ----
function drawWavesBorder(ctx, W, H, pad, color, shadowColor) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 10;
  const step = 15;
  const amp = 6;

  const drawWaves = (startX, endX, y, isBottom) => {
    ctx.beginPath();
    const dir = startX < endX ? 1 : -1;
    const factor = isBottom ? -1 : 1;
    let cx = startX;
    ctx.moveTo(cx, y);
    while ((dir === 1 && cx + step <= endX) || (dir === -1 && cx - step >= endX)) {
      ctx.quadraticCurveTo(cx + (step / 2) * dir, y + amp * factor, cx + step * dir, y);
      cx += step * dir;
    }
    ctx.stroke();
  };

  const drawVerticalWaves = (startX, yStart, yEnd, isRight) => {
    ctx.beginPath();
    const dir = yStart < yEnd ? 1 : -1;
    const factor = isRight ? -1 : 1;
    let cy = yStart;
    ctx.moveTo(startX, cy);
    while ((dir === 1 && cy + step <= yEnd) || (dir === -1 && cy - step >= yEnd)) {
      ctx.quadraticCurveTo(startX + amp * factor, cy + (step / 2) * dir, startX, cy + step * dir);
      cy += step * dir;
    }
    ctx.stroke();
  };

  drawWaves(pad, W - pad, pad, false);
  drawWaves(pad, W - pad, H - pad, true);
  drawVerticalWaves(pad, pad, H - pad, false);
  drawVerticalWaves(W - pad, pad, H - pad, true);
  ctx.restore();
}

function drawLeafBorder(ctx, W, H, pad, color, shadowColor) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 8;
  const step = 20;

  const drawLeaves = (startX, endX, y, isVertical) => {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    if (isVertical) ctx.lineTo(startX, endX);
    else ctx.lineTo(endX, y);
    ctx.stroke();

    const dir = startX < endX ? 1 : -1;
    let curr = startX;
    while ((dir === 1 && curr + step <= endX) || (dir === -1 && curr - step >= endX)) {
      ctx.beginPath();
      if (isVertical) {
        ctx.ellipse(startX - 6, curr + step/2, 4, 8, Math.PI / 4, 0, 2 * Math.PI);
        ctx.ellipse(startX + 6, curr + step/2, 4, 8, -Math.PI / 4, 0, 2 * Math.PI);
      } else {
        ctx.ellipse(curr + step/2, y - 6, 8, 4, Math.PI / 4, 0, 2 * Math.PI);
        ctx.ellipse(curr + step/2, y + 6, 8, 4, -Math.PI / 4, 0, 2 * Math.PI);
      }
      ctx.fill();
      curr += step * dir;
    }
  };

  drawLeaves(pad, W - pad, pad, false);
  drawLeaves(pad, W - pad, H - pad, false);
  drawLeaves(pad, pad, H - pad, true);
  drawLeaves(W - pad, pad, H - pad, true);
  ctx.restore();
}

function drawDoubleLineBorder(ctx, W, H, pad, color, shadowColor) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 15;
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
  
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1;
  const innerPad = pad + 6;
  ctx.strokeRect(innerPad, innerPad, W - innerPad * 2, H - innerPad * 2);
  ctx.restore();
}

function drawGreekKeyBorder(ctx, W, H, pad, color, shadowColor) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 15;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
 
  const S = 18;
  const D = 9;
 
  const drawHorizontalKey = (startX, endX, y, isBottom) => {
    ctx.beginPath();
    const direction = startX < endX ? 1 : -1;
    const absStep = S * direction;
    const absDepth = D * (isBottom ? -1 : 1);
    
    let currentX = startX;
    ctx.moveTo(currentX, y);
 
    while ((direction === 1 && currentX + S <= endX) || (direction === -1 && currentX - S >= endX)) {
      ctx.lineTo(currentX + absStep * 0.75, y);
      ctx.lineTo(currentX + absStep * 0.75, y + absDepth);
      ctx.lineTo(currentX + absStep * 0.25, y + absDepth);
      ctx.lineTo(currentX + absStep * 0.25, y + absDepth * 0.4);
      ctx.lineTo(currentX + absStep * 0.5, y + absDepth * 0.4);
      ctx.lineTo(currentX + absStep * 0.5, y + absDepth * 0.7);
      ctx.lineTo(currentX + absStep * 0.38, y + absDepth * 0.7);
      ctx.lineTo(currentX + absStep, y + absDepth * 0.7);
      ctx.lineTo(currentX + absStep, y);
      currentX += absStep;
    }
    ctx.stroke();
  };
 
  const drawVerticalKey = (startX, yStart, yEnd, isRight) => {
    ctx.beginPath();
    const direction = yStart < yEnd ? 1 : -1;
    const absStep = S * direction;
    const absDepth = D * (isRight ? -1 : 1);
 
    let currentY = yStart;
    ctx.moveTo(startX, currentY);
 
    while ((direction === 1 && currentY + S <= yEnd) || (direction === -1 && currentY - S >= yEnd)) {
      ctx.lineTo(startX, currentY + absStep * 0.75);
      ctx.lineTo(startX + absDepth, currentY + absStep * 0.75);
      ctx.lineTo(startX + absDepth, currentY + absStep * 0.25);
      ctx.lineTo(startX + absDepth * 0.4, currentY + absStep * 0.25);
      ctx.lineTo(startX + absDepth * 0.4, currentY + absStep * 0.5);
      ctx.lineTo(startX + absDepth * 0.7, currentY + absStep * 0.5);
      ctx.lineTo(startX + absDepth * 0.7, currentY + absStep * 0.38);
      ctx.lineTo(startX + absDepth * 0.7, currentY + absStep);
      ctx.lineTo(startX, currentY + absStep);
      currentY += absStep;
    }
    ctx.stroke();
  };
 
  drawHorizontalKey(pad, W - pad, pad, false);
  drawHorizontalKey(pad, W - pad, H - pad, true);
  drawVerticalKey(pad, pad, H - pad, false);
  drawVerticalKey(W - pad, pad, H - pad, true);
 
  ctx.restore();
}

function drawPosterOnCanvas(frame, pData) {
  const container = document.getElementById('poster-preview-container');
  const canvas = document.getElementById('poster-canvas');
  const W = container.clientWidth;
  const H = container.clientHeight;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  _posterCanvas = null;

  const accent = frame || '#7c3aed';
  const border = frame || '#7c3aed';
  const shadow = hexToRgba(accent, 0.8);
  const grad1 = adjustColorBrightness(accent, -110);
  const grad2 = adjustColorBrightness(accent, -60);
  
  const f = {
    gradient: [grad1, grad2],
    accent: accent,
    border: border,
    shadow: shadow,
    text: '#ffffff'
  };

  const doRender = (photoImg, logoImg) => {
    if (!window._isCameraLive) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, f.gradient[0]);
      grad.addColorStop(1, f.gradient[1]);
      ctx.fillStyle = grad;
      ctx.roundRect ? ctx.beginPath() : null;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H); // Transparent background for live camera
    }

    // Photo as full background
    if (photoImg && !window._isCameraLive) {
      ctx.save();
      ctx.globalAlpha = 1;
      // Draw photo cover
      const ir = photoImg.naturalWidth / photoImg.naturalHeight;
      const cr = W / H;
      let sx = 0, sy = 0, sw = photoImg.naturalWidth, sh = photoImg.naturalHeight;
      if (ir > cr) { sw = photoImg.naturalHeight * cr; sx = (photoImg.naturalWidth - sw) / 2; }
      else { sh = photoImg.naturalWidth / cr; sy = (photoImg.naturalHeight - sh) / 2; }
      ctx.drawImage(photoImg, sx, sy, sw, sh, 0, 0, W, H);
      ctx.restore();
    }

    // Gradient overlays for text readability
    const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.28);
    topGrad.addColorStop(0, 'rgba(0,0,0,0.9)');
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, H * 0.28);

    const btmGrad = ctx.createLinearGradient(0, H * 0.72, 0, H);
    btmGrad.addColorStop(0, 'rgba(0,0,0,0)');
    btmGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = btmGrad;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // Draw chosen border style in matching accent color
    const padOuter = W * 0.035;
    if (currentBorderStyle === 'greek') {
      drawGreekKeyBorder(ctx, W, H, padOuter, f.border, f.shadow);
    } else if (currentBorderStyle === 'wave') {
      drawWavesBorder(ctx, W, H, padOuter, f.border, f.shadow);
    } else if (currentBorderStyle === 'leaf') {
      drawLeafBorder(ctx, W, H, padOuter, f.border, f.shadow);
    } else if (currentBorderStyle === 'double') {
      drawDoubleLineBorder(ctx, W, H, padOuter, f.border, f.shadow);
    } else if (currentBorderStyle === 'line') {
      ctx.save();
      ctx.strokeStyle = f.border;
      ctx.lineWidth = 3;
      ctx.shadowColor = f.shadow;
      ctx.shadowBlur = 15;
      ctx.strokeRect(padOuter, padOuter, W - padOuter * 2, H - padOuter * 2);
      
      // Decorative corner brackets for line border
      ctx.strokeStyle = f.accent;
      ctx.lineWidth = 3;
      const len = W * 0.05;
      // Top-Left
      ctx.beginPath(); ctx.moveTo(padOuter, padOuter + len); ctx.lineTo(padOuter, padOuter); ctx.lineTo(padOuter + len, padOuter); ctx.stroke();
      // Top-Right
      ctx.beginPath(); ctx.moveTo(W - padOuter - len, padOuter); ctx.lineTo(W - padOuter, padOuter); ctx.lineTo(W - padOuter, padOuter + len); ctx.stroke();
      // Bottom-Left
      ctx.beginPath(); ctx.moveTo(padOuter, H - padOuter - len); ctx.lineTo(padOuter, H - padOuter); ctx.lineTo(padOuter + len, H - padOuter); ctx.stroke();
      // Bottom-Right
      ctx.beginPath(); ctx.moveTo(W - padOuter - len, H - padOuter); ctx.lineTo(W - padOuter, H - padOuter); ctx.lineTo(W - padOuter, H - padOuter - len); ctx.stroke();
      
      ctx.restore();
    }

    // ---- TOP SECTION ----
    const logoSize = W * 0.12;
    const logoY = H * 0.07;
    
    if (logoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, logoY, logoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, W / 2 - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
      ctx.restore();
      
      ctx.beginPath();
      ctx.arc(W / 2, logoY, logoSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = f.accent;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const topY = logoY + logoSize / 2 + H * 0.03;
    ctx.textAlign = 'center';

    // Club name
    ctx.font = `800 ${W * 0.035}px 'Outfit', sans-serif`;
    ctx.fillStyle = f.accent;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(pData.orgName, W / 2, topY);

    // Event name
    ctx.font = `900 ${W * 0.075}px 'Outfit', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillText(pData.eventName, W / 2, topY + H * 0.055);
    ctx.shadowBlur = 0;

    // Stylized Event Accent Line
    ctx.strokeStyle = f.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - W * 0.15, topY + H * 0.072);
    ctx.lineTo(W / 2 + W * 0.15, topY + H * 0.072);
    ctx.stroke();

    // ---- BOTTOM SECTION ----
    let currentY = H * 0.82;

    // Name
    ctx.font = `900 ${W * 0.09}px 'Outfit', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 15;
    ctx.fillText(pData.name, W / 2, currentY);
    
    currentY += H * 0.025;

    // Category pill (Premium Glassmorphic style)
    const catW = W * 0.62;
    const catH = H * 0.042;
    const catX = (W - catW) / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(catX, currentY, catW, catH, catH / 2);
    ctx.fill();
    ctx.strokeStyle = f.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.font = `800 ${W * 0.038}px 'Outfit', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(pData.catName, W / 2, currentY + catH * 0.68);
    
    currentY += catH + H * 0.015;

    // Score box (ONLY if there is a score)
    if (pData.scoreText) {
      const scoreW = W * 0.7;
      const scoreH = H * 0.045;
      const scoreX = (W - scoreW) / 2;
      ctx.strokeStyle = f.accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(scoreX, currentY, scoreW, scoreH, 10);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `800 ${W * 0.04}px 'Outfit', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(pData.scoreText, W / 2, currentY + scoreH * 0.68);
      
      currentY += scoreH + H * 0.015;
    }

    // Footer
    ctx.font = `600 ${W * 0.032}px 'Outfit', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Watch me perform at knsdc.in', W / 2, currentY + H * 0.015);

    // Save the final canvas reference for download/share
    _posterCanvas = canvas;
  };

  // Load images
  let photoImg = null;
  let logoImg = null;
  let loadedCount = 0;
  
  const checkDone = () => {
    loadedCount++;
    if (loadedCount === 2) {
      doRender(photoImg, logoImg);
    }
  };

  const lImg = new Image();
  lImg.crossOrigin = 'anonymous';
  lImg.onload = () => { logoImg = lImg; checkDone(); };
  lImg.onerror = () => { checkDone(); };
  lImg.src = 'logo.png';

  if (pData.photoUrl) {
    const pImg = new Image();
    pImg.crossOrigin = 'anonymous';
    pImg.onload = () => { photoImg = pImg; checkDone(); };
    pImg.onerror = () => { checkDone(); };
    pImg.src = pData.photoUrl;
  } else {
    checkDone();
  }
}

// ---- Share & Download ----
function getPosterBlob(callback) {
  if (!_posterCanvas) {
    toast('Please wait for the poster to render first!');
    return;
  }
  _posterCanvas.toBlob(blob => callback(blob), 'image/jpeg', 0.95);
}

function sharePoster() {
  const btn = document.getElementById('share-now-btn');
  const loading = document.getElementById('share-loading');
  btn.disabled = true;
  loading.style.display = 'block';

  getPosterBlob(async (blob) => {
    btn.disabled = false;
    loading.style.display = 'none';
    if (!blob) { toast('Could not generate poster!'); return; }
    const file = new File([blob], 'knsdc-poster.jpg', { type: 'image/jpeg' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'KNSDC ΓÇô Dance Ignition 5',
          text: 'Check out my official poster for Dance Ignition Season 5 by Kalikapur Nabin Sangha! ≡ƒöÑ',
          files: [file]
        });
        return;
      } catch (e) { /* fall through to download */ }
    }
    // Fallback: download
    triggerDownload(blob);
  });
}

function downloadPoster() {
  const loading = document.getElementById('share-loading');
  loading.style.display = 'block';
  getPosterBlob((blob) => {
    loading.style.display = 'none';
    if (!blob) { toast('Could not generate poster!'); return; }
    triggerDownload(blob);
  });
}

function triggerDownload(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'knsdc-dance-ignition-5-poster.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function markParticipantReady() {
  if (!CURRENT_USER || !window.syncEngine) return;
  
  // Request native background notification permissions on interaction
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
  
  // Unlock audio engine
  if (typeof initAudio === 'function') initAudio();

  const state = window.syncEngine.getData() || {};
  const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER));
  if (!p) return;

  const newState = !p.isReady;
  
  window.syncEngine.updateParticipant(CURRENT_USER, { isReady: newState })
    .then(() => {
      const btn = document.getElementById('ready-btn');
      if (btn) {
        if (newState) {
          btn.innerHTML = 'Γ£à Ready Alert Sent (Click to Cancel)';
          btn.style.background = 'var(--green)';
          btn.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
        } else {
          btn.innerHTML = '≡ƒöÑ I am Ready for Performance';
          btn.style.background = 'linear-gradient(135deg, #FF0080, #FF8C00)';
          btn.style.boxShadow = '0 6px 20px rgba(255,0,128,0.3)';
        }
      }
      toast(newState ? 'Γ£à Organizer notified that you are ready!' : 'Ready alert cancelled.');
    })
    .catch(e => console.error(e));
}

let queueAudioCtx = null;
let queueOscillators = [];
let queueAudioInterval = null;

function initAudio() {
  if (!queueAudioCtx) {
    try { queueAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  if (queueAudioCtx && queueAudioCtx.state === 'suspended') {
    queueAudioCtx.resume();
  }
}

document.addEventListener('click', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });

function playRingTone() {
  try {
    initAudio();
    if (!queueAudioCtx) return;
    
    const playBeep = () => {
      const osc1 = queueAudioCtx.createOscillator();
      const osc2 = queueAudioCtx.createOscillator();
      const gain = queueAudioCtx.createGain();
      
      osc1.type = 'sine'; osc1.frequency.value = 440;
      osc2.type = 'sine'; osc2.frequency.value = 480;
      
      gain.gain.setValueAtTime(0, queueAudioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, queueAudioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.5, queueAudioCtx.currentTime + 1.2);
      gain.gain.linearRampToValueAtTime(0, queueAudioCtx.currentTime + 1.3);
      
      osc1.connect(gain); osc2.connect(gain); gain.connect(queueAudioCtx.destination);
      
      osc1.start(queueAudioCtx.currentTime); osc2.start(queueAudioCtx.currentTime);
      osc1.stop(queueAudioCtx.currentTime + 1.3); osc2.stop(queueAudioCtx.currentTime + 1.3);
      queueOscillators.push(osc1, osc2);
    };
    
    playBeep();
    queueAudioInterval = setInterval(playBeep, 2000);
  } catch(e) { console.error('Audio api error:', e); }
}

function stopRingTone() {
  if (queueAudioInterval) { clearInterval(queueAudioInterval); queueAudioInterval = null; }
  queueOscillators.forEach(osc => { try { osc.stop(); } catch(e){} });
  queueOscillators = [];
  if (queueAudioCtx && queueAudioCtx.state === 'running') queueAudioCtx.suspend();
}

function stopVibration() {
  stopRingTone();
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  if ('vibrate' in navigator) navigator.vibrate(0);
  document.getElementById('stop-vibration-banner').style.display = 'none';
}

function toast(msg) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// 1. App Init
function initApp() {
  const storedId = localStorage.getItem('knsdc_participant_id');
  if (storedId) {
    autoLogin(storedId);
  } else {
    document.getElementById('login-view').style.display = 'block';
  }
}

// Wait for syncEngine to initialize
const waitSync = setInterval(() => {
  if (window.syncEngine && window.syncEngine.isInitialized) {
    clearInterval(waitSync);
    initApp();
  }
}, 100);

// 2. Authentication
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('login-user').value.trim().toLowerCase();
  const passId = document.getElementById('login-pass').value.trim().toUpperCase();
  
  const state = window.syncEngine.getData() || {};
  const participants = state.participants || [];
  
  const p = participants.find(part => {
    if (username === 'admin' && passId === 'ADMIN') return true;
    if (String(part.id).toUpperCase() !== passId) return false;
    const firstName = (part.name || '').split(' ')[0].toLowerCase();
    return firstName === username;
  });
  
  if (p) {
    localStorage.setItem('knsdc_participant_id', p.id);
    CURRENT_USER = p.id;
    toast('Logged in successfully!');
    renderDashboard();
  } else {
    toast('Invalid Username or ID Number');
  }
});

function autoLogin(id) {
  // We trust the stored ID. The actual participant data might still be loading async via syncEngine.
  // We will set the CURRENT_USER and let the subscription handle rendering when data arrives.
  CURRENT_USER = id;
  renderDashboard();
}

function logout() {
  localStorage.removeItem('knsdc_participant_id');
  CURRENT_USER = null;
  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('login-view').style.display = 'block';
  document.getElementById('login-form').reset();
}

window.uploadParticipantFileToCloud = async function(input, targetId) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
      toast("File too large. Please select a file smaller than 20MB.");
      input.value = "";
      return;
  }
  
  toast("Uploading image to MongoDB... Please wait.");
  input.disabled = true;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Url = e.target.result;
    input.disabled = false;
    document.getElementById(targetId).value = base64Url;
    toast("Γ£à Image uploaded & stored in MongoDB Atlas!");
    
    // Photo/Image preview
    const imgPreview = document.getElementById(targetId + '-preview');
    if (imgPreview) {
      imgPreview.src = base64Url;
      imgPreview.style.display = 'block';
    }
    
    // Media preview wrap
    const previewWrap = document.getElementById(targetId + '-preview-wrap');
    if (previewWrap) {
      previewWrap.style.display = 'block';
      const mediaPreview = document.getElementById(targetId + '-preview');
      if (mediaPreview) {
        mediaPreview.src = base64Url;
      }
    }
    
    // Download link
    const previewLink = document.getElementById(targetId + '-preview-link');
    if (previewLink) {
      previewLink.href = base64Url;
    }

    // Automatically sync participant state to MongoDB
    if (window.syncEngine) {
      await window.syncEngine.forceSaveStateToSupabase();
    }
  };
  reader.onerror = function() {
    input.disabled = false;
    toast("ΓÜá∩╕Å Failed to read image file.");
  };
  reader.readAsDataURL(file);
};

// 3. Render Dashboard & Lock Logic
function renderDashboard() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('dashboard-view').style.display = 'block';
  // Initialize inline chat read tracking
  setTimeout(() => initInlineChatReadTracking(), 500);
  
  const state = window.syncEngine.getData() || {};
  const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER));
  
  if (!p) {
    // If the participant isn't in the state yet (due to async loading), just wait.
    // The subscription will call renderDashboard again once data arrives.
    return; 
  }
  
  // Set Dynamic Identity Watermark
  const watermarkText = `${p.name || 'Participant'} - ${p.id} - ${new Date().toLocaleString()}`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='350' height='250'>
    <text x='50%' y='50%' transform='rotate(-30 175 125)' text-anchor='middle' 
    font-family='Inter, sans-serif' font-size='16' font-weight='800' fill='#000' opacity='0.7'>${watermarkText}</text>
  </svg>`;
  const b64 = btoa(svg);
  const wm = document.getElementById('identity-watermark');
  if (wm) wm.style.backgroundImage = `url('data:image/svg+xml;base64,${b64}')`;
  
  
  const ans = p.formAnswers || {};
  const ansKeys = Object.keys(ans);
  
  // Get active event and form fields
  const ev = (state.events || []).find(e => String(e.id) === String(p.eventId));
  let formFields = [];
  if (ev) {
    if (state.eventFormFields && state.eventFormFields[ev.id]) {
      formFields = state.eventFormFields[ev.id];
    } else {
      formFields = (ev.formFields && ev.formFields.length > 0) ? ev.formFields : (state.formFields || []);
      if (typeof formFields === 'string') {
        try { formFields = JSON.parse(formFields); } catch(e) { formFields = []; }
      }
    }
  }

  if (!formFields || formFields.length === 0) {
    formFields = [
      { type: 'text', label: 'Full Name', required: true, placeholder: 'As per ID proof' },
      { type: 'radio', label: 'Gender', required: true, options: ['Male', 'Female', 'Other'] },
      { type: 'number', label: 'Phone Number', required: true, placeholder: '98XXXXXXXX' }
    ];
  }

  const container = document.getElementById('dynamic-form-container');
  let html = '';

  window.participantFormFields = formFields; // Save for submit handler

  formFields.forEach((f, i) => {
    const fieldId = `dyn-field-${i}`;
    const reqMark = f.required ? '<span style="color:#ef4444">*</span>' : '';
    let val = '';
    
    // Map existing value from p
    const lbl = f.label.toUpperCase();
    if (lbl.includes('NAME')) val = p.name || '';
    else if (lbl.includes('PHONE') || lbl.includes('MOBILE')) val = p.phone || '';
    else if (lbl === 'AGE' || (lbl.includes('AGE') && !lbl.includes('MIN') && !lbl.includes('MAX'))) val = p.age || '';
    else if (f.type === 'category') val = p.catId || '';
    else if (f.type === 'venue') val = p.venueId || '';
    else {
      // Find in formAnswers (case-insensitive)
      const foundKey = ansKeys.find(k => k.toLowerCase() === f.label.toLowerCase() || k.toLowerCase().includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(k.toLowerCase()));
      if (foundKey) val = ans[foundKey];
      else val = '';
    }

    const isImgField = f.type === 'photo' || /photo|image|pic|picture|selfie|headshot/i.test(f.label || '');
    if (!val && isImgField) {
      if (p.photo) val = p.photo;
      else if (p.selfieImage) val = p.selfieImage;
      else if (ans) {
        for (const [k, v] of Object.entries(ans)) {
          if (typeof v === 'string' && (v.startsWith('data:image/') || v.includes('/api/participant/image/') || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(v))) {
            val = v;
            break;
          }
        }
      }
    }

    html += `<div class="fg">
      <label>${f.label} ${reqMark}</label>`;

    if (f.type === 'text') {
      html += `<input type="text" id="${fieldId}" value="${val}" ${f.required ? 'required' : ''}>`;
    } else if (f.type === 'number') {
      html += `<input type="number" id="${fieldId}" value="${val}" ${f.required ? 'required' : ''}>`;
    } else if (f.type === 'textarea') {
      html += `<textarea id="${fieldId}" rows="3" ${f.required ? 'required' : ''}>${val}</textarea>`;
    } else if (f.type === 'radio' && f.options) {
      html += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">`;
      f.options.forEach(opt => {
        const isChecked = (val === opt) ? 'checked' : '';
        html += `<label style="display:flex; align-items:center; gap:5px; font-weight:normal; text-transform:none;"><input type="radio" name="${fieldId}" value="${opt}" ${isChecked} ${f.required ? 'required' : ''}> ${opt}</label>`;
      });
      html += `</div>`;
    } else if (f.type === 'checkbox' && f.options) {
      const valArr = Array.isArray(val) ? val : [val];
      html += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">`;
      f.options.forEach(opt => {
        const isChecked = valArr.includes(opt) ? 'checked' : '';
        html += `<label style="display:flex; align-items:center; gap:5px; font-weight:normal; text-transform:none;"><input type="checkbox" name="${fieldId}" value="${opt}" ${isChecked}> ${opt}</label>`;
      });
      html += `</div>`;
    } else if (f.type === 'category') {
      html += `<select id="${fieldId}" ${f.required ? 'required' : ''}>
        <option value="">Select Category</option>`;
      (ev.categories || []).forEach(c => {
        html += `<option value="${c.id}" ${String(c.id) === String(val) ? 'selected' : ''}>${c.name} (${c.ageMin}-${c.ageMax} yrs)</option>`;
      });
      html += `</select>`;
    } else if (f.type === 'venue') {
      html += `<select id="${fieldId}" ${f.required ? 'required' : ''}>
        <option value="">Select Venue</option>`;
      (ev.venues || []).forEach(v => {
        html += `<option value="${v.id}" ${String(v.id) === String(val) ? 'selected' : ''}>${v.name}</option>`;
      });
      html += `</select>`;
    } else if (f.type === 'tc') {
      const isChecked = val ? 'checked' : '';
      const fullTc = f.tcText || 'I agree to the terms and conditions of KNSDC.';
      const isLong = fullTc.length > 70;
      const shortTc = isLong ? fullTc.substring(0, 65) + '...' : fullTc;

      html += `<div style="background:#f8fafc; padding:12px 14px; border-radius:12px; border:1px solid #cbd5e1; margin-top:8px;">
        <label style="display:flex; align-items:flex-start; gap:10px; font-weight:normal; text-transform:none; font-size:13px; line-height:1.4; cursor:pointer; margin:0;">
          <input type="checkbox" id="${fieldId}" ${isChecked} ${f.required ? 'required' : ''} style="width:18px; height:18px; margin-top:2px; accent-color:var(--primary); flex-shrink:0;">
          <div style="flex:1;">
            <span style="font-weight:700; color:var(--text);">I agree to the Terms & Conditions</span>
            ${isLong ? `
              <div style="font-size:12px; color:var(--text-muted); margin-top:3px;">${shortTc}</div>
              <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.toggleTcExpand('${fieldId}-tc-box', this)" style="background:rgba(59,130,246,0.1); color:#2563eb; border:1px dashed rgba(59,130,246,0.4); padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; margin-top:6px; display:inline-flex; align-items:center; gap:4px;">
                ≡ƒô£ Read Full Terms & Conditions (Tap to Expand)
              </button>
            ` : `
              <div style="font-size:12px; color:var(--text-muted); margin-top:3px;">${fullTc}</div>
            `}
          </div>
        </label>
        ${isLong ? `
          <div id="${fieldId}-tc-box" style="display:none; margin-top:10px; padding:10px 12px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; line-height:1.5; color:#334155; max-height:180px; overflow-y:auto; word-break:break-word;">
            <strong style="color:#1e293b; display:block; margin-bottom:6px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">≡ƒô£ Complete Terms & Conditions:</strong>
            ${fullTc.replace(/\n/g, '<br>')}
          </div>
        ` : ''}
      </div>`;
    } else if (f.type === 'date' || f.label.toUpperCase().includes('DATE')) {
      html += `<input type="date" id="${fieldId}" value="${val}" ${f.required ? 'required' : ''}>`;
    } else if (f.type === 'file_link') {
      html += `<input type="text" id="${fieldId}" placeholder="Paste link (e.g. Google Drive, YouTube)" value="${val}" ${f.required ? 'required' : ''}>`;
    } else if (f.type === 'video_link_or_file' || f.type === 'audio_link_or_file') {
      const accept = f.type === 'video_link_or_file' ? 'video/*' : 'audio/*';
      const isVideo = f.type === 'video_link_or_file';
      html += `<div style="display:flex;flex-direction:column;gap:10px;background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #cbd5e1;">
        <input type="file" accept="${accept}" onchange="uploadParticipantFileToCloud(this, '${fieldId}')" style="margin-bottom:0;">
        <input type="hidden" id="${fieldId}" value="${val}">
        <div id="${fieldId}-preview-wrap" style="margin-top:6px; display:${val ? 'block' : 'none'};">
          ${isVideo 
            ? `<video id="${fieldId}-preview" src="${val}" controls style="max-width:100%; max-height:200px; border-radius:8px;"></video>` 
            : `<audio id="${fieldId}-preview" src="${val}" controls style="width:100%;"></audio>`
          }
        </div>
      </div>`;
    } else if (f.type === 'file' || f.type === 'photo') {
      const isImgField = f.type === 'photo' || /photo|image|pic|picture|selfie|headshot/i.test(f.label || '') || (val && (val.startsWith('data:image') || val.includes('/api/participant/image/') || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(val)));
      const accept = isImgField ? 'image/*' : '*/*';
      html += `<div style="display:flex;flex-direction:column;gap:10px;background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #cbd5e1;">
        <input type="file" accept="${accept}" onchange="uploadParticipantFileToCloud(this, '${fieldId}')" style="margin-bottom:0;">
        <input type="hidden" id="${fieldId}" value="${val}">
        ${isImgField 
          ? `<div style="margin-top:5px;"><img id="${fieldId}-preview" src="${val}" onclick="event.preventDefault(); event.stopPropagation(); openFullImageModal(this.src, event)" title="Tap to view full screen" style="max-width:160px; max-height:160px; object-fit:cover; border-radius:10px; border:2px solid var(--primary); display:${val ? 'block' : 'none'}; box-shadow:0 4px 12px rgba(0,0,0,0.15); cursor:pointer;"><div style="font-size:10px; color:#64748b; margin-top:2px;">≡ƒöì Tap image to view full screen</div></div>` 
          : `<div id="${fieldId}-preview-wrap" style="font-size:12px;color:green;margin-top:4px;display:${val ? 'block' : 'none'};">File uploaded: <a id="${fieldId}-preview-link" href="${val}" target="_blank">View File</a></div>`
        }
      </div>`;
    } else {
      html += `<input type="text" id="${fieldId}" value="${val}" ${f.required ? 'required' : ''}>`;
    }
    
    html += `</div>`;
  });

  if (formFields.length === 0) {
    html = `<div style="text-align:center; padding:20px; color:var(--text-muted);">No form fields configured for this event.</div>`;
  }

  container.innerHTML = html;
  
  // Lock Logic
  const inputs = document.querySelectorAll('#participant-form input, #participant-form select, #participant-form textarea');
  const btn = document.getElementById('save-btn');
  const banner = document.getElementById('lock-banner');
  
  const formLocked = p.formLocked === true;
  if (formLocked === true) {
    inputs.forEach(inp => inp.disabled = true);
    btn.disabled = true;
    btn.style.background = 'var(--text-muted)';
    btn.style.cursor = 'not-allowed';
    btn.textContent = '≡ƒöÆ Form Locked by Monitor';
    banner.style.display = 'flex';
  } else {
    inputs.forEach(inp => inp.disabled = false);
    btn.disabled = false;
    btn.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
    btn.style.cursor = 'pointer';
    btn.textContent = 'Save Updates';
    banner.style.display = 'none';
  }
  
  // Render Detailed Results
  renderDetailedResults(p);
  // Render Performance Journey Chart
  renderPerformanceJourney(p);
  // Render Global Stats Charts
  renderGlobalEventStatistics(p);

  // Render Certificate Card
  const eventSwitches = (state.eventSwitches && ev ? state.eventSwitches[ev.id] : null) 
    || (ev ? ev.switchStates : null) 
    || state.switchStates 
    || {};
  if (ev && (eventSwitches.certificatePublic === true || eventSwitches.downloadPublic === true)) {
    document.getElementById('certificate-card').style.display = 'block';
  } else {
    document.getElementById('certificate-card').style.display = 'none';
  }

  // Render Feedback Card
  const existingFeedback = p.formAnswers && p.formAnswers._feedback;
  if (existingFeedback) {
    document.getElementById('feedback-card').style.display = 'block';
    document.getElementById('feedback-form-container').style.display = 'none';
    document.getElementById('feedback-success-msg').style.display = 'block';
  } else {
    document.getElementById('feedback-card').style.display = 'block';
    document.getElementById('feedback-form-container').style.display = 'block';
    document.getElementById('feedback-success-msg').style.display = 'none';
  }

  // Render Services Card based on monitor switch
  const servicesSec = document.getElementById('services-section');
  if (servicesSec) {
    if (eventSwitches.servicesToggle === true) {
      servicesSec.style.display = 'block';
      // Load current active services orders/bookings
      renderActiveServicesData(p);
    } else {
      servicesSec.style.display = 'none';
    }
  }
}

async function submitParticipantFeedback() {
  const ratingEl = document.querySelector('input[name="fb_rating"]:checked');
  if (!ratingEl) {
    toast("ΓÜá∩╕Å Please select a star rating.");
    return;
  }
  const rating = parseInt(ratingEl.value, 10);
  const text = document.getElementById('feedback-text').value.trim();
  
  if (window.syncEngine && window.syncEngine.submitFeedback) {
    const success = await window.syncEngine.submitFeedback(CURRENT_USER, rating, text);
    if (success) {
      document.getElementById('feedback-form-container').style.display = 'none';
      document.getElementById('feedback-success-msg').style.display = 'block';
      toast("≡ƒÆû Feedback sent successfully!");
    } else {
      toast("Γ¥î Failed to send feedback.");
    }
  }
}
function generateParticipantCertificateHTML() {
  if (!CURRENT_USER) return;
  const state = window.syncEngine.getData() || {};
  const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER));
  const ev = (state.events || []).find(e => String(e.id) === String(p.eventId));
  if (!p || !ev) return toast('Error: Participant or Event not found.');

  const eventSwitches = (state.eventSwitches ? state.eventSwitches[ev.id] : state.switchStates) || {};
  const certSetup = eventSwitches.certificateSetup || {};

  const certNo = `KNSDC-${Date.now().toString().slice(-6)}-${(p.name || 'P').slice(0, 2).toUpperCase()}`;
  
  const cat = (ev.categories || []).find(c => String(c.id) === String(p.catId));
  const catName = cat ? cat.name.toUpperCase() : 'OPEN CATEGORY';

  let secSigHtml = `<div style="border-top:1px solid #333; width:120px; margin-top:30px; font-size:0.75rem;">Secretary</div>`;
  let presSigHtml = `<div style="border-top:1px solid #333; width:120px; margin-top:30px; font-size:0.75rem;">President</div>`;
  let judgeSigHtml = `<div style="border-top:1px solid #333; width:120px; margin-bottom:10px; font-size:0.75rem;">Judge</div>`;

  if (certSetup.secretary) {
    secSigHtml = `<div style="display:flex; flex-direction:column; align-items:center; width:120px; margin-top:10px;">
                    <img src="${certSetup.secretary}" style="max-height:50px; max-width:100px; object-fit:contain; margin-bottom:5px;">
                    <div style="border-top:1px solid #333; width:100%; font-size:0.75rem; padding-top:2px;">Secretary</div>
                  </div>`;
  }
  if (certSetup.president) {
    presSigHtml = `<div style="display:flex; flex-direction:column; align-items:center; width:120px; margin-top:10px;">
                    <img src="${certSetup.president}" style="max-height:50px; max-width:100px; object-fit:contain; margin-bottom:5px;">
                    <div style="border-top:1px solid #333; width:100%; font-size:0.75rem; padding-top:2px;">President</div>
                  </div>`;
  }
  if (certSetup.judge) {
    judgeSigHtml = `<div style="text-align:center;">
                      <div style="display:flex; flex-direction:column; align-items:center; width:120px; margin-bottom:10px;">
                        <img src="${certSetup.judge}" style="max-height:50px; max-width:100px; object-fit:contain; margin-bottom:5px;">
                        <div style="border-top:1px solid #333; width:100%; font-size:0.75rem; padding-top:2px;">Judge</div>
                      </div>
                    </div>`;
  }

  const content = `
    <div style="background:#fff; width:100%; height:100%; border:15px double #1A237E; padding:30px; text-align:center; position:relative; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; align-items:center;">
      <!-- Top Logo -->
      <div style="margin-bottom:15px;">
        <img src="logo.png" style="height:100px; width:auto; border-radius:50%; box-shadow:0 4px 10px rgba(0,0,0,0.15);" alt="KNS Logo">
      </div>

      <div style="font-family:'Cinzel Decorative', cursive; font-size:1.1rem; color:#1A237E; margin-bottom:5px; font-weight:800;">Kalikapur Nabin Sangha</div>
      <div style="font-size:2rem; font-weight:900; color:#1A237E; margin-bottom:15px; font-family:'Playfair Display', serif; text-transform:uppercase; letter-spacing:1px;">Certificate of Participation</div>
      
      <div style="margin:10px 0; font-size:1.1rem; color:#555;">This is to certify that</div>
      <div style="font-size:2.5rem; font-weight:900; color:#FF6B35; font-family:'Playfair Display', serif; border-bottom:2px solid #eee; display:inline-block; padding:0 40px; margin-bottom:15px; letter-spacing:0.5px;">${p.name || 'Participant'}</div>
      
      <div style="margin:10px 0; font-size:1.1rem; color:#333; line-height:1.6;">
        Participant ID: <strong style="color:#1A237E;">${p.id || 'N/A'}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Category: <strong style="color:#1A237E;">${catName}</strong> <br>
        has successfully participated in the <br>
        <strong style="color:#1A237E; font-size:1.2rem;">${ev.name || 'Event'}</strong> <br>
        held on <strong style="color:#444;">${ev.disp || (ev.date ? new Date(ev.date).toLocaleDateString() : '')}</strong> at <strong>Kalikapur, Kolkata</strong>.
      </div>

      <div style="margin-top:35px; width:100%; display:flex; justify-content:space-between; align-items:flex-end; padding:0 40px;">
        <div style="display:flex; gap:50px; align-items:flex-end; text-align:center;">
          <div>
            ${secSigHtml}
          </div>
          <div>
            ${presSigHtml}
          </div>
        </div>
        
        <div style="display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center;">
          ${judgeSigHtml}
          <div>
            <div style="font-size:0.65rem; color:#777; margin-bottom:5px; font-weight:600;">Certificate No: ${certNo}</div>
            <div style="background:linear-gradient(135deg, #1A237E, #3949AB); color:#fff; padding:5px 14px; font-size:0.75rem; font-weight:800; border-radius:6px; letter-spacing:1.5px; box-shadow:0 2px 4px rgba(0,0,0,0.15);">KNSDC OFFICIAL</div>
          </div>
        </div>
      </div>
      
      <!-- Power By Footer -->
      <div style="margin-top:25px; font-size:0.65rem; color:#9ca3af; text-transform:uppercase; letter-spacing:2px; font-weight:700;">
        Powered by Kalikapur Nabin Sangha
      </div>
      
      <!-- Logo Watermark -->
      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:15rem; opacity:0.02; pointer-events:none; font-weight:900;">KNS</div>
    </div>
  `;

  const win = window.open('', '', 'height=800,width=1200');
  if (!win) {
    toast("ΓÜá∩╕Å Please allow popups to view and print your certificate.");
    return;
  }
  
  win.document.write(`
    <html>
      <head>
        <title>KNSDC Certificate</title>
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Cinzel+Decorative:wght@700&display=swap"); 
          body { margin:0; padding:20px; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #e2e8f0; }
          #cert-wrapper { width: 1056px; height: 750px; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2); margin-bottom: 20px; }
          #controls { display: flex; gap: 15px; margin-bottom: 20px; }
          .btn { padding: 10px 20px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; color: white; display: flex; align-items: center; gap: 8px; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: opacity 0.2s; }
          .btn:active { opacity: 0.8; }
          .btn-print { background: #7c3aed; }
          .btn-jpg { background: #ea580c; }
          @media print {
            @page { size: landscape; margin: 0; }
            body { padding: 0; background: white; align-items: flex-start; justify-content: flex-start; }
            #controls { display: none !important; }
            #cert-wrapper { width: 100%; height: 100%; box-shadow: none; margin: 0; }
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
      </head>
      <body>
        <div id="controls">
          <button class="btn btn-print" onclick="window.print()">≡ƒû¿∩╕Å Print / Save as PDF</button>
          <button class="btn btn-jpg" onclick="downloadJPG()">≡ƒû╝∩╕Å Download JPG</button>
        </div>
        <div id="cert-wrapper">
          ${content}
        </div>
        <script>
          function downloadJPG() {
            const btn = document.querySelector('.btn-jpg');
            btn.textContent = 'Generating...';
            btn.disabled = true;
            
            html2canvas(document.getElementById('cert-wrapper'), { scale: 2, useCORS: true }).then(canvas => {
              const link = document.createElement('a');
              link.download = '${(p.name || 'Participant').replace(/\s+/g,'_')}_Certificate.jpg';
              link.href = canvas.toDataURL('image/jpeg', 0.95);
              link.click();
              
              btn.textContent = '≡ƒû╝∩╕Å Download JPG';
              btn.disabled = false;
            }).catch(err => {
              alert('Failed to generate JPG.');
              btn.textContent = '≡ƒû╝∩╕Å Download JPG';
              btn.disabled = false;
            });
          }
        <\/script>
      
<!-- ARCADE FULLSCREEN GAME MODAL -->
<div id="arcade-game-modal" style="display:none; position:fixed; inset:0; z-index:9999999; background:#090d16; flex-direction:column; padding:10px; box-sizing:border-box; overflow:hidden;">
  <!-- Header Bar -->
  <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:#1e293b; border-radius:14px; margin-bottom:10px; border:1px solid #334155;">
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-size:24px;" id="game-title-icon">≡ƒÄ«</span>
      <div>
        <h3 style="margin:0; font-size:16px; font-weight:800; color:#f8fafc;" id="game-title-text">KNSDC Arcade</h3>
        <div style="font-size:10px; color:#94a3b8;" id="game-subtitle">2D Browser Game</div>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-size:13px; font-weight:900; color:#f59e0b; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); padding:4px 12px; border-radius:8px;" id="game-score-display">Score: 0</span>
      <button onclick="closeArcadeModal()" style="background:rgba(255,255,255,0.1); border:none; color:#fff; font-size:22px; width:38px; height:38px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;">Γ£ò</button>
    </div>
  </div>

  <!-- Canvas Container -->
  <div style="flex:1; position:relative; width:100%; max-width:440px; margin:0 auto; background:#020617; border-radius:18px; overflow:hidden; border:2px solid #334155; display:flex; flex-direction:column; box-shadow:0 15px 35px rgba(0,0,0,0.6);">
    <canvas id="arcade-canvas" width="400" height="600" style="width:100%; height:100%; display:block; touch-action:none; object-fit:contain;"></canvas>

    <!-- Overlay Start / Game Over Screen -->
    <div id="game-overlay" style="position:absolute; inset:0; background:rgba(15,23,42,0.94); backdrop-filter:blur(8px); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center;">
      <div style="font-size:56px; margin-bottom:12px;" id="go-icon">≡ƒÄ╢</div>
      <h2 style="margin:0 0 8px 0; color:#fff; font-size:24px; font-weight:900;" id="go-title">Stage Rhythm Blitz</h2>
      <p style="color:#94a3b8; font-size:13px; margin:0 0 18px 0; max-width:280px; line-height:1.5;" id="go-desc">Tap 4 note lanes to the beat as tiles drop down!</p>
      <div style="font-size:20px; font-weight:900; color:#f59e0b; margin-bottom:18px; display:none; background:rgba(245,158,11,0.1); padding:8px 16px; border-radius:10px; border:1px dashed #f59e0b;" id="go-final-score">Final Score: 0</div>
      <button onclick="startActiveGame()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:14px 32px; border-radius:14px; font-size:17px; font-weight:900; cursor:pointer; box-shadow:0 6px 20px rgba(16,185,129,0.4); display:flex; align-items:center; gap:8px;" id="go-start-btn">
        ≡ƒÜÇ Start Playing
      </button>
    </div>
  </div>
</div>

</body>
    </html>
  `);
  win.document.close();
  
  toast("≡ƒôÑ Popup opened! You can Print/PDF or Download JPG.");
}

// 4. Save Updates (Auto-Lock)
document.getElementById('participant-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-btn');
  if (btn.disabled) return;
  
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  const state = window.syncEngine.getData() || {};
  const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER)) || {};
  
  const formFields = window.participantFormFields || [];
  let payload = { formAnswers: { ...(p.formAnswers || {}) }, formLocked: true };
  
  for (let i = 0; i < formFields.length; i++) {
    const f = formFields[i];
    const fieldId = `dyn-field-${i}`;
    const el = document.getElementById(fieldId);
    let val = '';

    if (f.type === 'radio') {
      const checked = document.querySelector(`input[name="${fieldId}"]:checked`);
      val = checked ? checked.value : '';
    } else if (f.type === 'checkbox') {
      const checked = Array.from(document.querySelectorAll(`input[name="${fieldId}"]:checked`)).map(c => c.value);
      val = checked;
    } else if (f.type === 'tc') {
      val = el ? el.checked : false;
    } else if (el) {
      val = el.value.trim ? el.value.trim() : el.value;
    }

    if (f.required && (!val || (Array.isArray(val) && val.length === 0))) {
      toast(`Please fill required field: ${f.label}`);
      btn.disabled = false;
      btn.textContent = 'Save Updates';
      return;
    }

    payload.formAnswers[f.label] = val;

    // Map to standard properties
    const lbl = f.label.toUpperCase();
    if (lbl.includes('NAME')) payload.name = val;
    else if (lbl.includes('PHONE') || lbl.includes('MOBILE')) payload.phone = val;
    else if (lbl === 'AGE' || (lbl.includes('AGE') && !lbl.includes('MIN') && !lbl.includes('MAX'))) payload.age = val;
    else if (f.type === 'category') payload.catId = val;
    else if (f.type === 'venue') payload.venueId = val;
  }
  
  try {
    await window.syncEngine.updateParticipant(CURRENT_USER, payload);
    toast('Γ£à Your form updated successfully!');
    // Render will naturally lock the UI because we pushed formLocked:true
  } catch(err) {
    console.error(err);
    toast('Error saving updates');
    btn.disabled = false;
    btn.textContent = 'Save Updates';
  }
});

// Reactively re-render if Monitor unlocks them while they are logged in!
let renderTimer = null;
const debouncedRenderDashboard = () => {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    renderDashboard();
  }, 250);
};

if (window.syncEngine) {
  window.syncEngine.subscribe(() => {
    if (CURRENT_USER && document.getElementById('dashboard-view').style.display === 'block') {
      const state = window.syncEngine.getData() || {};
      const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER)) || {};
      
      // Prevent ringing on initial page load if already in queue
      if (!initialSyncFired) {
        lastStageStatus = p.stageStatus;
        lastRound = p.round || 'audition';
        initialSyncFired = true;
        
        // Initial load check: if they are already done, or if the round in the DB has changed
        // compared to what was last saved in localStorage while the app was closed.
        const savedLastRound = localStorage.getItem('knsdc_last_known_round_' + CURRENT_USER);
        let initialResetNeeded = false;
        
        if (p.stageStatus === 'done' && p.isReady) {
          console.log('[Sync] Participant is done. Resetting ready status on load.');
          initialResetNeeded = true;
        } else if (savedLastRound && savedLastRound !== (p.round || 'audition') && p.isReady) {
          console.log(`[Sync] Round changed from ${savedLastRound} to ${p.round || 'audition'}. Resetting ready status on load.`);
          initialResetNeeded = true;
        }
        
        localStorage.setItem('knsdc_last_known_round_' + CURRENT_USER, p.round || 'audition');
        
        if (initialResetNeeded) {
          window.syncEngine.updateParticipant(CURRENT_USER, { isReady: false }).catch(e => console.error(e));
        }
      }

      // --- VIBRATION & READY RESET LOGIC ---
      if (lastStageStatus !== 'queue' && p.stageStatus === 'queue') {
        // Added to queue! Vibrate and ring for 15 seconds.
        if ('vibrate' in navigator) {
          navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000]);
        }
        playRingTone();
        if ('Notification' in window && Notification.permission === 'granted') {
           try {
             new Notification('≡ƒÜ¿ YOU ARE UP NEXT!', {
               body: 'You have been added to the queue! Please head to the stage immediately.',
               requireInteraction: true
             });
           } catch(e) { console.error('Notification error', e); }
        }
        document.getElementById('stop-vibration-banner').style.display = 'flex';
        setTimeout(() => { stopVibration(); }, 15000);
      }

      // Reset isReady if round changed in real-time or if stageStatus became 'done'
      let runtimeResetNeeded = false;
      const currentRound = p.round || 'audition';
      if (lastRound !== null && lastRound !== currentRound) {
        console.log(`[Sync] Round changed in real-time from ${lastRound} to ${currentRound}.`);
        runtimeResetNeeded = true;
      }
      if (lastStageStatus !== null && lastStageStatus !== 'done' && p.stageStatus === 'done') {
        console.log('[Sync] Stage status changed to done in real-time.');
        runtimeResetNeeded = true;
      }

      // Always track stage status and round (outside any guard)
      if (p.stageStatus !== undefined) {
        lastStageStatus = p.stageStatus;
      }
      lastRound = currentRound;
      localStorage.setItem('knsdc_last_known_round_' + CURRENT_USER, currentRound);

      if (runtimeResetNeeded && p.isReady) {
        console.log('[Sync] Resetting ready status to false.');
        window.syncEngine.updateParticipant(CURRENT_USER, { isReady: false }).catch(e => console.error(e));
      }

      if (p.stageStatus) {
        // Sync button UI with current state if loaded
        const btn = document.getElementById('ready-btn');
        if (btn) {
          if (p.isReady) {
            btn.innerHTML = 'Γ£à Ready Alert Sent (Click to Cancel)';
            btn.style.background = 'var(--green)';
            btn.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            btn.style.cursor = 'pointer';
            btn.disabled = false;
          } else {
            btn.innerHTML = '≡ƒöÑ I am Ready for Performance';
            btn.style.background = 'linear-gradient(135deg, #FF0080, #FF8C00)';
            btn.style.boxShadow = '0 6px 20px rgba(255,0,128,0.3)';
            btn.style.cursor = 'pointer';
            btn.disabled = false;
          }
        }
        
        const upcomingCard = document.getElementById('upcoming-performer-card');
        const upcomingList = document.getElementById('upcoming-performer-list');
        if (upcomingCard && upcomingList) {
          if (p.stageStatus === 'queue' || p.stageStatus === 'on-stage') {
            const state = window.syncEngine.getData() || {};
            let queue = (state.participants || []).filter(part => part.stageStatus === 'queue' && String(part.eventId) === String(p.eventId));
            // Sort by queueOrder
            queue.sort((a, b) => (a.queueOrder || 0) - (b.queueOrder || 0));
            
            let html = '';
            if (p.stageStatus === 'on-stage') {
              html += `<div style="background:var(--green); color:white; padding:12px; border-radius:8px; font-weight:800; text-align:center; box-shadow:0 4px 15px rgba(16, 185, 129, 0.3); margin-bottom:10px;">≡ƒîƒ YOU ARE ON STAGE! ≡ƒîƒ</div>`;
            }
            
            if (queue.length > 0) {
              queue.forEach((q, idx) => {
                const isMe = String(q.id) === String(CURRENT_USER);
                html += `
                  <div style="background:var(--surface); padding:10px 15px; border-radius:8px; display:flex; align-items:center; gap:12px; border:1px solid ${isMe ? 'var(--primary)' : 'var(--border)'}; box-shadow:${isMe ? '0 0 10px rgba(124,58,237,0.2)' : 'none'};">
                    <div style="background:rgba(124,58,237,0.15); color:var(--primary); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px;">${idx + 1}</div>
                    <div style="flex:1;">
                      <div style="font-weight:700; color:var(--text);">${isMe ? '≡ƒæë ' + q.name + ' (YOU)' : q.name}</div>
                      <div style="font-size:11px; color:var(--text-muted); font-family:var(--fm);">${q.id}</div>
                    </div>
                  </div>
                `;
              });
            } else if (p.stageStatus !== 'on-stage') {
              html += `<div style="color:var(--text-muted); font-size:13px; text-align:center; padding:10px;">Queue is empty</div>`;
            }
            upcomingList.innerHTML = html;
            upcomingCard.style.display = 'block';
          } else {
            upcomingCard.style.display = 'none';
          }
        }
        
      }
      // --- END LOGIC ---
      
      // Update Chat
      renderChatMessages();

      const formLocked = p.formLocked === true;
      const btn = document.getElementById('save-btn');
      const isCurrentlyLocked = btn && btn.disabled;
      
      // If form was just locked remotely, force re-render immediately
      if (formLocked && !isCurrentlyLocked) {
        debouncedRenderDashboard();
        return;
      }
      
      // If form was unlocked remotely, force re-render immediately
      if (!formLocked && isCurrentlyLocked) {
        debouncedRenderDashboard();
        return;
      }

      // Otherwise, only re-render if the user is not actively typing
      const activeEl = document.activeElement;
      const isTyping = activeEl && document.getElementById('participant-form').contains(activeEl);
      
      if (!isTyping) {
        debouncedRenderDashboard();
      }
      
      // Update food menu in real-time if open
      const foodModal = document.getElementById('food-modal');
      if (foodModal && foodModal.style.display === 'flex' && window.renderFoodMenuUI) {
        window.renderFoodMenuUI();
      }
    }
  });
}

// 5-second auto-polling loop: only runs when participant is logged in and form is currently locked
setInterval(async () => {
  if (CURRENT_USER && window.syncEngine) {
    const state = window.syncEngine.getData() || {};
    const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER));
    if (p) {
      const formLocked = p.formLocked === true;
      if (formLocked) {
        try {
          await window.syncEngine.loadParticipants();
        } catch(e) {
          console.error('[Participant] Auto-poll status failed:', e);
        }
      }
    }
  }
}, 5000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.syncEngine) {
    window.syncEngine.loadParticipants().catch(e => console.error(e));
  }
});

