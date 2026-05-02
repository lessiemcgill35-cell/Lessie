const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

const gravity = 0.65;
const keys = new Set();
let score = 0;

const world = {
  width: 2600,
  height: canvas.height,
  platforms: [
    { x: 0, y: 460, w: 900, h: 80 },
    { x: 960, y: 420, w: 360, h: 120 },
    { x: 1390, y: 360, w: 260, h: 180 },
    { x: 1750, y: 460, w: 850, h: 80 },
    { x: 1140, y: 290, w: 140, h: 18 },
    { x: 1290, y: 240, w: 140, h: 18 },
    { x: 1440, y: 190, w: 140, h: 18 },
  ],
  pizzas: [
    { x: 1020, y: 382, r: 12, taken: false },
    { x: 1460, y: 150, r: 12, taken: false },
    { x: 1840, y: 420, r: 12, taken: false },
    { x: 2080, y: 420, r: 12, taken: false },
    { x: 2320, y: 420, r: 12, taken: false },
  ],
  enemies: [
    { x: 1540, y: 332, w: 34, h: 34, dir: 1 },
    { x: 1990, y: 432, w: 34, h: 34, dir: -1 },
  ],
  finishX: 2480,
};

const player = {
  x: 80,
  y: 400,
  w: 46,
  h: 60,
  vx: 0,
  vy: 0,
  speed: 0.9,
  maxSpeed: 7.8,
  jump: -13,
  onGround: false,
  facing: 1,
  dashTimer: 0,
  tauntTimer: 0,
  hurtTimer: 0,
};

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updatePlayer() {
  const wantsLeft = keys.has("KeyA");
  const wantsRight = keys.has("KeyD");
  const dash = keys.has("ShiftLeft") || keys.has("ShiftRight");

  if (wantsLeft) {
    player.vx -= player.speed;
    player.facing = -1;
  }
  if (wantsRight) {
    player.vx += player.speed;
    player.facing = 1;
  }

  const top = dash ? player.maxSpeed * 1.45 : player.maxSpeed;
  player.vx *= wantsLeft || wantsRight ? 0.9 : 0.78;
  player.vx = Math.max(-top, Math.min(top, player.vx));

  if (dash && (wantsLeft || wantsRight)) {
    player.dashTimer = 12;
  }

  player.vy += gravity;
  player.x += player.vx;

  player.onGround = false;
  player.y += player.vy;

  for (const platform of world.platforms) {
    if (!aabb(player, platform)) continue;

    const prevBottom = player.y + player.h - player.vy;
    const prevTop = player.y - player.vy;

    if (prevBottom <= platform.y + 2 && player.vy >= 0) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (prevTop >= platform.y + platform.h - 2 && player.vy < 0) {
      player.y = platform.y + platform.h;
      player.vy = 1;
    } else {
      if (player.x + player.w / 2 < platform.x + platform.w / 2) {
        player.x = platform.x - player.w;
      } else {
        player.x = platform.x + platform.w;
      }
      player.vx *= -0.3;
    }
  }

  if (player.y > canvas.height + 200) {
    respawn("You fell! -50 points");
    score = Math.max(0, score - 50);
  }

  player.x = Math.max(0, Math.min(world.width - player.w, player.x));
  if (player.dashTimer > 0) player.dashTimer--;
  if (player.tauntTimer > 0) player.tauntTimer--;
  if (player.hurtTimer > 0) player.hurtTimer--;
}

function respawn(msg) {
  player.x = 80;
  player.y = 320;
  player.vx = 0;
  player.vy = 0;
  player.hurtTimer = 45;
  status.textContent = msg;
}

function updateCollectibles() {
  for (const pie of world.pizzas) {
    if (pie.taken) continue;
    const hit = {
      x: pie.x - pie.r,
      y: pie.y - pie.r,
      w: pie.r * 2,
      h: pie.r * 2,
    };
    if (aabb(player, hit)) {
      pie.taken = true;
      score += 100;
      status.textContent = "Delicious! +100";
    }
  }
}

function updateEnemies() {
  for (const enemy of world.enemies) {
    enemy.x += enemy.dir * 1.25;
    if (enemy.x < 1480 || enemy.x > 2220) enemy.dir *= -1;

    if (aabb(player, enemy)) {
      if (player.dashTimer > 0) {
        enemy.x = -999;
        score += 250;
        status.textContent = "Slammed! +250";
      } else if (player.hurtTimer === 0) {
        score = Math.max(0, score - 120);
        respawn("Ouch! -120 points");
      }
    }
  }
}

function drawBackground(camX) {
  ctx.fillStyle = "#fff3";
  for (let i = 0; i < 7; i++) {
    const x = (i * 240 - camX * 0.2) % (canvas.width + 200);
    ctx.fillRect(x, 90 + (i % 3) * 28, 120, 24);
  }
}

function drawWorld(camX) {
  drawBackground(camX);

  for (const platform of world.platforms) {
    ctx.fillStyle = "#a95a2e";
    ctx.fillRect(platform.x - camX, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#70401f";
    ctx.fillRect(platform.x - camX, platform.y, platform.w, 16);
  }

  for (const pie of world.pizzas) {
    if (pie.taken) continue;
    ctx.fillStyle = "#ffce45";
    ctx.beginPath();
    ctx.arc(pie.x - camX, pie.y, pie.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#db3f4d";
    ctx.fillRect(pie.x - camX - 2, pie.y - 5, 4, 4);
  }

  for (const enemy of world.enemies) {
    if (enemy.x < 0) continue;
    ctx.fillStyle = "#2b2047";
    ctx.fillRect(enemy.x - camX, enemy.y, enemy.w, enemy.h);
    ctx.fillStyle = "#ff7070";
    ctx.fillRect(enemy.x - camX + 6, enemy.y + 8, 8, 8);
    ctx.fillRect(enemy.x - camX + 20, enemy.y + 8, 8, 8);
  }

  ctx.fillStyle = "#ffd21f";
  ctx.fillRect(world.finishX - camX, 380, 20, 80);
}

function drawPlayer(camX) {
  const x = player.x - camX;
  ctx.fillStyle = player.hurtTimer > 0 ? "#ff7d7d" : "#fff";
  ctx.fillRect(x, player.y, player.w, player.h);
  ctx.fillStyle = "#111";
  const eyeX = player.facing === 1 ? x + 30 : x + 10;
  ctx.fillRect(eyeX, player.y + 16, 8, 8);

  if (player.dashTimer > 0) {
    ctx.fillStyle = "#ffe76a";
    ctx.fillRect(x - player.facing * 14, player.y + 18, 12, 12);
  }

  if (player.tauntTimer > 0) {
    ctx.fillStyle = "#ff4cc9";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("MAMMA MIA!", x - 10, player.y - 8);
  }
}

function drawUi() {
  const total = world.pizzas.length;
  const got = world.pizzas.filter((p) => p.taken).length;
  ctx.fillStyle = "#0008";
  ctx.fillRect(12, 10, 245, 74);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(`Score: ${score}`, 24, 36);
  ctx.fillText(`Pizza: ${got}/${total}`, 24, 62);
}

function gameLoop() {
  updatePlayer();
  updateCollectibles();
  updateEnemies();

  if (player.x >= world.finishX) {
    status.textContent = `Level clear! Final score: ${score}`;
  }

  const camX = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width * 0.45));
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawWorld(camX);
  drawPlayer(camX);
  drawUi();

  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => {
  keys.add(e.code);

  if (e.code === "Space" && player.onGround) {
    player.vy = player.jump;
  }

  if (e.code === "KeyE") {
    player.tauntTimer = 55;
    status.textContent = "Taunt! Pure style points.";
  }
});

document.addEventListener("keyup", (e) => {
  keys.delete(e.code);
});

status.textContent = "Grab every pizza slice and reach the golden door!";
gameLoop();
