const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const world = {
  gravity: 0.55,
  groundY: 580,
  cameraX: 0,
  rings: Array.from({ length: 80 }, (_, i) => ({
    x: 320 + i * 180 + Math.sin(i) * 60,
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
};

function update() {
  const accel = keys['shift'] ? 1.1 : 0.65;
  const maxSpeed = keys['shift'] ? 28 : 18;

  if (keys['arrowright'] || keys['d']) sonic.vx += accel;
  if (keys['arrowleft'] || keys['a']) sonic.vx -= accel;
  if ((keys[' '] || keys['w'] || keys['arrowup']) && sonic.onGround) {
    sonic.vy = -15;
    sonic.onGround = false;
  }

  sonic.vx *= 0.92;
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
    const dx = sonic.x - ring.x;
    const dy = sonic.y - ring.y;
    if (Math.hypot(dx, dy) < sonic.r + 14) {
      ring.taken = true;
      sonic.rings++;
    }
  }

  world.cameraX += ((sonic.x - 200) - world.cameraX) * 0.08;
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#74d7ff');
  grad.addColorStop(0.65, '#4bb2ff');
  grad.addColorStop(1, '#43c84d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 8; i++) {
    const x = ((i * 300 - world.cameraX * 0.2) % (canvas.width + 400)) - 200;
    ctx.beginPath();
    ctx.ellipse(x, 120 + (i % 3) * 40, 90, 35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const hill of world.hills) {
    const x = hill.x - world.cameraX * 0.45;
    ctx.fillStyle = '#2f9a41';
    ctx.beginPath();
    ctx.moveTo(x - 240, world.groundY + 20);
    ctx.quadraticCurveTo(x, world.groundY - hill.h, x + 240, world.groundY + 20);
    ctx.fill();
  }
}

function drawWorld() {
  ctx.fillStyle = '#2cbf3f';
  ctx.fillRect(0, world.groundY + 20, canvas.width, canvas.height - world.groundY);

  ctx.fillStyle = '#6f4f2f';
  for (let i = -1; i <= 14; i++) {
    const x = i * 110 - (world.cameraX % 110);
    ctx.fillRect(x, world.groundY + 20, 70, canvas.height - world.groundY);
  }

  for (const loopX of world.loops) {
    const x = loopX - world.cameraX;
    ctx.strokeStyle = '#e4d23e';
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.arc(x, world.groundY - 110, 105, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#3f7ee8';
    ctx.stroke();
  }

  for (const ring of world.rings) {
    if (ring.taken) continue;
    const x = ring.x - world.cameraX;
    ctx.strokeStyle = '#ffd84f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, ring.y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSonic() {
  const x = sonic.x - world.cameraX;
  ctx.save();
  ctx.translate(x, sonic.y);
  const spin = sonic.onGround ? 0 : performance.now() * 0.03;
  ctx.rotate(spin);

  ctx.fillStyle = '#0e56e8';
  ctx.beginPath();
  ctx.arc(0, 0, sonic.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5d2aa';
  ctx.beginPath();
  ctx.ellipse(8, 10, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(4, -6, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px system-ui';
  ctx.fillText(`Rings: ${sonic.rings}`, 30, 50);
  ctx.fillText(`Speed: ${Math.abs(sonic.vx).toFixed(1)}`, 30, 84);
}

function gameLoop() {
  update();
  drawBackground();
  drawWorld();
  drawSonic();
  requestAnimationFrame(gameLoop);
}

gameLoop();
