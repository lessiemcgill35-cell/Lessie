const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const world = {
  gravity: 0.55,
  groundY: 580,
  cameraX: 0,
  rings: Array.from({ length: 95 }, (_, i) => ({
    x: 320 + i * 160 + Math.sin(i) * 60,
    y: 460 - (i % 4) * 40,
    taken: false,
  })),
  hills: Array.from({ length: 16 }, (_, i) => ({
    x: i * 1100,
    h: 120 + (i % 3) * 50,
  })),
  loops: [1800, 4200, 6800],
};

const keys = {};
addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

const sonic = {
  x: 100,
  y: world.groundY,
  vx: 0,
  vy: 0,
  r: 30,
  rings: 0,
  onGround: true,
  facing: 1,
  state: 'run',
  abilityEnergy: 100,
  cooldown: 0,
};

const particles = [];

function emit(x, y, count, color, speed = 4) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * (Math.random() * speed),
      vy: Math.sin(a) * (Math.random() * speed),
      life: 20 + Math.random() * 16,
      size: 3 + Math.random() * 5,
      color,
    });
  }
}

function updateAbilities() {
  sonic.state = 'run';
  if (sonic.cooldown > 0) sonic.cooldown--;
  sonic.abilityEnergy = Math.min(100, sonic.abilityEnergy + 0.18);

  if ((keys['e'] || keys['shift']) && sonic.abilityEnergy > 0.2) {
    sonic.state = 'boost';
    sonic.abilityEnergy -= 0.35;
    sonic.vx += 1.25 * sonic.facing;
    emit(sonic.x - 20 * sonic.facing, sonic.y - 6, 2, '#5de7ff', 2);
  }

  if (keys['q'] && sonic.cooldown === 0 && sonic.abilityEnergy > 8) {
    sonic.state = 'spin';
    sonic.cooldown = 24;
    sonic.abilityEnergy -= 8;
    sonic.vx += 16 * sonic.facing;
    sonic.vy = Math.min(sonic.vy, -2);
    emit(sonic.x, sonic.y, 16, '#58bcff', 5);
  }

  if (keys['c'] && sonic.onGround) {
    sonic.state = 'slide';
    sonic.vx *= 1.01;
    emit(sonic.x, sonic.y + 24, 1, '#d9d9d9', 2);
  }

  if (keys['z'] && sonic.onGround && Math.abs(sonic.vx) > 8) {
    sonic.state = 'drift';
    sonic.vx *= 0.985;
    emit(sonic.x - sonic.facing * 28, sonic.y + 20, 2, '#e6e6e6', 2.5);
    emit(sonic.x, sonic.y - 10, 1, '#7ce8ff', 1.4);
  }

  if (keys['x'] && sonic.abilityEnergy > 25 && sonic.cooldown === 0) {
    sonic.state = 'homing';
    sonic.abilityEnergy -= 25;
    sonic.cooldown = 45;
    sonic.vx = 23 * sonic.facing;
    sonic.vy = -5;
    emit(sonic.x + 30 * sonic.facing, sonic.y - 6, 20, '#fff480', 6);
  }
}

function update() {
  const accel = sonic.state === 'boost' ? 1.2 : 0.65;
  const maxSpeed = sonic.state === 'boost' ? 32 : 18;

  if (keys['arrowright'] || keys['d']) {
    sonic.vx += accel;
    sonic.facing = 1;
  }
  if (keys['arrowleft'] || keys['a']) {
    sonic.vx -= accel;
    sonic.facing = -1;
  }
  if ((keys[' '] || keys['w'] || keys['arrowup']) && sonic.onGround) {
    sonic.vy = -15;
    sonic.onGround = false;
  }

  updateAbilities();

  const friction = sonic.state === 'slide' ? 0.975 : 0.92;
  sonic.vx *= friction;
  sonic.vx = Math.max(-maxSpeed, Math.min(maxSpeed, sonic.vx));

  sonic.vy += world.gravity;
  sonic.x += sonic.vx;
  sonic.y += sonic.vy;

  if (sonic.y >= world.groundY) {
    sonic.y = world.groundY;
    sonic.vy = 0;
    sonic.onGround = true;
  }

  for (const ring of world.rings) {
    if (ring.taken) continue;
    if (Math.hypot(sonic.x - ring.x, sonic.y - ring.y) < sonic.r + 14) {
      ring.taken = true;
      sonic.rings++;
      emit(ring.x, ring.y, 8, '#ffe06e', 4);
    }
  }

  world.cameraX += ((sonic.x - 230) - world.cameraX) * 0.08;

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life--;
  }
  while (particles.length && particles[0].life <= 0) particles.shift();
}

function drawBackground() { /* unchanged style */
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#74d7ff'); grad.addColorStop(0.65, '#4bb2ff'); grad.addColorStop(1, '#43c84d');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 8; i++) {
    const x = ((i * 300 - world.cameraX * 0.2) % (canvas.width + 400)) - 200;
    ctx.beginPath(); ctx.ellipse(x, 120 + (i % 3) * 40, 90, 35, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawWorld() {
  ctx.fillStyle = '#2cbf3f'; ctx.fillRect(0, world.groundY + 20, canvas.width, canvas.height - world.groundY);
  ctx.fillStyle = '#6f4f2f';
  for (let i = -1; i <= 14; i++) {
    const x = i * 110 - (world.cameraX % 110);
    ctx.fillRect(x, world.groundY + 20, 70, canvas.height - world.groundY);
  }
  for (const hill of world.hills) {
    const x = hill.x - world.cameraX * 0.45;
    ctx.fillStyle = '#2f9a41'; ctx.beginPath();
    ctx.moveTo(x - 240, world.groundY + 20);
    ctx.quadraticCurveTo(x, world.groundY - hill.h, x + 240, world.groundY + 20);
    ctx.fill();
  }
  for (const loopX of world.loops) {
    const x = loopX - world.cameraX;
    ctx.strokeStyle = '#e4d23e'; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(x, world.groundY - 110, 105, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 12; ctx.strokeStyle = '#3f7ee8'; ctx.stroke();
  }
  for (const ring of world.rings) {
    if (ring.taken) continue;
    const x = ring.x - world.cameraX;
    ctx.strokeStyle = '#ffd84f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, ring.y, 14, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 36);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - world.cameraX, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSonic() {
  const x = sonic.x - world.cameraX;
  ctx.save();
  ctx.translate(x, sonic.y);

  if (sonic.state === 'spin') ctx.rotate(performance.now() * 0.06);
  if (!sonic.onGround) ctx.rotate(performance.now() * 0.03);

  const squishY = sonic.state === 'slide' ? 0.72 : 1;
  const squishX = sonic.state === 'slide' ? 1.2 : 1;
  ctx.scale(squishX, squishY);

  if (sonic.state === 'boost') {
    ctx.fillStyle = 'rgba(120,240,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-32 * sonic.facing, 0, 44, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#0e56e8'; ctx.beginPath(); ctx.arc(0, 0, sonic.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5d2aa'; ctx.beginPath(); ctx.ellipse(8, 10, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(4, -6, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px system-ui';
  ctx.fillText(`Rings: ${sonic.rings}`, 30, 46);
  ctx.fillText(`Speed: ${Math.abs(sonic.vx).toFixed(1)}`, 30, 76);
  ctx.fillText(`State: ${sonic.state.toUpperCase()}`, 30, 106);
  ctx.fillText(`Energy: ${Math.round(sonic.abilityEnergy)}`, 30, 136);
}

function gameLoop() {
  update();
  drawBackground();
  drawWorld();
  drawParticles();
  drawSonic();
  requestAnimationFrame(gameLoop);
}

gameLoop();
