const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

const mouse = {
  x: 0,
  y: 0,
};

canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  speed: 7,
  hp: 100,
};

const bullets = [];
const zombies = [];
const bosses = [];
const coins = [];

let score = 0;
let kills = 0;
let coinCount = 0;

let ammo = 10;
let maxAmmo = 10;
let reloadTimer = 0;

let laserCooldown = 0;
let laserActive = 0;

let gameOver = false;

canvas.addEventListener("click", () => {
  if (gameOver) {
    location.reload();
    return;
  }

  if (ammo <= 0) return;

  ammo--;

  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  bullets.push({
    x: player.x,
    y: player.y,
    dx: Math.cos(angle) * 12,
    dy: Math.sin(angle) * 12,
    radius: 5,
  });
});

function getSpawnPosition() {
  const side = Math.floor(Math.random() * 4);

  let x;
  let y;

  if (side === 0) {
    x = Math.random() * canvas.width;
    y = -50;
  }

  if (side === 1) {
    x = canvas.width + 50;
    y = Math.random() * canvas.height;
  }

  if (side === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + 50;
  }

  if (side === 3) {
    x = -50;
    y = Math.random() * canvas.height;
  }

  return { x, y };
}

function spawnZombie() {
  const pos = getSpawnPosition();

  zombies.push({
    x: pos.x,
    y: pos.y,
    radius: 18,
    speed: 1.2,
  });
}

function spawnBoss() {
  const pos = getSpawnPosition();

  bosses.push({
    x: pos.x,
    y: pos.y,
    radius: 30,
    speed: 2.2,
    hp: 10,
  });
}

function spawnCoin() {
  coins.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: 10,
  });
}

setInterval(spawnZombie, 1000);
setInterval(spawnCoin, 3000);
setInterval(spawnBoss, 11000);

function update() {
  if (gameOver) return;

  score++;
  reloadTimer++;

  if (laserCooldown > 0) laserCooldown--;
  if (laserActive > 0) laserActive--;

  if (reloadTimer >= 70) {
    reloadTimer = 0;

    if (ammo < maxAmmo) {
      ammo++;
    }
  }

  if (keys["z"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["q"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // SUPER LASER
  if (keys["e"] && laserCooldown <= 0) {
    laserCooldown = 300;
    laserActive = 15;

    zombies.forEach((zombie, index) => {
      const angleLaser = Math.atan2(mouse.y - player.y, mouse.x - player.x);

      const angleZombie = Math.atan2(zombie.y - player.y, zombie.x - player.x);

      const diff = Math.abs(angleLaser - angleZombie);

      if (diff < 0.15) {
        zombies.splice(index, 1);
        kills++;
        score += 100;
      }
    });

    bosses.forEach((boss, index) => {
      const angleLaser = Math.atan2(mouse.y - player.y, mouse.x - player.x);

      const angleBoss = Math.atan2(boss.y - player.y, boss.x - player.x);

      const diff = Math.abs(angleLaser - angleBoss);

      if (diff < 0.15) {
        boss.hp -= 6;

        if (boss.hp <= 0) {
          bosses.splice(index, 1);
          kills += 5;
          score += 1000;
        }
      }
    });
  }

  bullets.forEach((bullet) => {
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;
  });

  zombies.forEach((zombie) => {
    const angle = Math.atan2(player.y - zombie.y, player.x - zombie.x);

    zombie.x += Math.cos(angle) * zombie.speed;
    zombie.y += Math.sin(angle) * zombie.speed;

    const dist = Math.hypot(player.x - zombie.x, player.y - zombie.y);

    if (dist < player.radius + zombie.radius) {
      player.hp -= 0.2;

      if (player.hp <= 0) {
        gameOver = true;
      }
    }
  });

  bosses.forEach((boss) => {
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);

    boss.x += Math.cos(angle) * boss.speed;
    boss.y += Math.sin(angle) * boss.speed;

    const dist = Math.hypot(player.x - boss.x, player.y - boss.y);

    if (dist < player.radius + boss.radius) {
      player.hp -= 0.5;

      if (player.hp <= 0) {
        gameOver = true;
      }
    }
  });

  bullets.forEach((bullet, bIndex) => {
    zombies.forEach((zombie, zIndex) => {
      const dist = Math.hypot(bullet.x - zombie.x, bullet.y - zombie.y);

      if (dist < bullet.radius + zombie.radius) {
        bullets.splice(bIndex, 1);
        zombies.splice(zIndex, 1);

        kills++;
        score += 100;
      }
    });
  });

  bullets.forEach((bullet, bIndex) => {
    bosses.forEach((boss, bossIndex) => {
      const dist = Math.hypot(bullet.x - boss.x, bullet.y - boss.y);

      if (dist < bullet.radius + boss.radius) {
        bullets.splice(bIndex, 1);

        boss.hp--;

        if (boss.hp <= 0) {
          bosses.splice(bossIndex, 1);

          kills += 5;
          score += 1000;
        }
      }
    });
  });

  coins.forEach((coin, index) => {
    const dist = Math.hypot(player.x - coin.x, player.y - coin.y);

    if (dist < player.radius + coin.radius) {
      coinCount++;
      score += 50;

      coins.splice(index, 1);
    }
  });
}

function draw() {
  ctx.fillStyle = "#2f8f2f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  coins.forEach((coin) => {
    ctx.fillStyle = "gold";

    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  bullets.forEach((bullet) => {
    ctx.fillStyle = "yellow";

    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  zombies.forEach((zombie) => {
    ctx.fillStyle = "green";

    ctx.beginPath();
    ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  bosses.forEach((boss) => {
    ctx.fillStyle = "#ff00ff";

    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(boss.hp, boss.x - 8, boss.y + 5);
  });

  // VISEUR
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.stroke();

  // LASER
  if (laserActive > 0) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 12;

    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
  }

  // JOUEUR
  ctx.fillStyle = "blue";

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // UI
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";

  ctx.fillText("HP : " + Math.floor(player.hp), 20, 40);
  ctx.fillText("Score : " + score, 20, 80);
  ctx.fillText("Kills : " + kills, 20, 120);
  ctx.fillText("Pièces : " + coinCount, 20, 160);
  ctx.fillText("Munitions : " + ammo, 20, 200);

  ctx.fillText(
    "Laser : " +
      (laserCooldown <= 0 ? "PRET" : Math.ceil(laserCooldown / 60) + "s"),
    20,
    240,
  );

  ctx.strokeStyle = "white";
  ctx.strokeRect(20, 270, 200, 20);

  ctx.fillStyle = "yellow";
  ctx.fillRect(20, 270, (reloadTimer / 70) * 200, 20);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "70px Arial";

    ctx.fillText("GAME OVER", canvas.width / 2 - 220, canvas.height / 2);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
