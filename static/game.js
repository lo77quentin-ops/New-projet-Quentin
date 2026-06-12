const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const playerImg = new Image();
playerImg.src = "/static/player.png";

const zombieImg = new Image();
zombieImg.src = "/static/zombie.png";

const bossImg = new Image();
bossImg.src = "/static/boss.png";
const backgroundImg = new Image();
backgroundImg.src = "/static/map.png";

const coinImg = new Image();
coinImg.src = "/static/coin.png";

const droneImg = new Image();
droneImg.src = "/static/drone.png";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const keys = {};
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 40,
  speed: 7,
  hp: 100,
};

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

const bullets = [];
const droneBullets = [];
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
let drone = null;
let droneCooldown = 0;

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
    radius: 10,
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
    radius: 20,
    speed: 1.2,
    hp: 1,
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
    radius: 25,
    rotation: 0,
  });
}

setInterval(spawnZombie, 1000);
setInterval(spawnCoin, 2500);
setInterval(spawnBoss, 11000);

function update() {
  if (gameOver) return;

  score++;
  reloadTimer++;

  if (laserCooldown > 0) laserCooldown--;
  if (laserActive > 0) laserActive--;

  if (reloadTimer >= 60) {
    reloadTimer = 0;

    if (ammo < maxAmmo) {
      ammo++;
    }
  }

  if (keys["z"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["q"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  if (keys["f"] && !drone && coinCount >= 20) {
    coinCount -= 20;

    drone = {
      x: player.x + 60,
      y: player.y - 80,
      hp: 20,
      maxHp: 20,
      damage: 1,
      shootTimer: 0,

      targetX: player.x,
      targetY: player.y,
      moveTimer: 0,
    };
  }
  if (drone) {
    drone.moveTimer++;

    if (drone.moveTimer >= 180) {
      // 3 secondes

      drone.moveTimer = 0;

      drone.targetX = player.x + (Math.random() * 400 - 200);
      drone.targetY = player.y + (Math.random() * 400 - 200);
    }

    const angle = Math.atan2(drone.targetY - drone.y, drone.targetX - drone.x);

    drone.x += Math.cos(angle) * 1.5;
    drone.y += Math.sin(angle) * 1.5;
  }

  if (drone) {
    drone.shootTimer++;

    if (drone.shootTimer >= 120) {
      console.log("DRONE FIRE");
      // 2 secondes (60 FPS)
      drone.shootTimer = 0;

      let target = null;
      let minDist = Infinity;

      zombies.forEach((zombie) => {
        const dist = Math.hypot(zombie.x - drone.x, zombie.y - drone.y);

        if (dist < minDist) {
          minDist = dist;
          target = zombie;
        }
      });

      if (target) {
        const angle = Math.atan2(target.y - drone.y, target.x - drone.x);

        droneBullets.push({
          x: drone.x,
          y: drone.y,
          dx: Math.cos(angle) * 8,
          dy: Math.sin(angle) * 8,
          damage: 1,
        });
      }

      if (target) {
        target.hp -= drone.damage;

        if (target.hp <= 0) {
          const index = zombies.indexOf(target);

          if (index > -1) {
            zombies.splice(index, 1);
            kills++;
          }
        }
      }
    }
  }

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
  droneBullets.forEach((bullet) => {
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;
  });

  zombies.forEach((zombie) => {
    const angle = Math.atan2(player.y - zombie.y, player.x - zombie.x);

    zombie.x += Math.cos(angle) * zombie.speed;
    zombie.y += Math.sin(angle) * zombie.speed;

    // ATTAQUE DU DRONE
    if (drone) {
      const distDrone = Math.hypot(zombie.x - drone.x, zombie.y - drone.y);

      if (distDrone < zombie.radius + 25) {
        drone.hp -= 0.05;

        if (drone.hp <= 0) {
          drone = null;
        }
      }
    }

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
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  coins.forEach((coin) => {
    ctx.drawImage(
      coinImg,
      coin.x - coin.radius,
      coin.y - coin.radius,
      coin.radius * 2,
      coin.radius * 2,
    );
  });

  bullets.forEach((bullet) => {
    ctx.fillStyle = "#ff2222";
    ctx.shadowColor = "red";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  });

  zombies.forEach((zombie) => {
    ctx.drawImage(
      zombieImg,
      zombie.x - zombie.radius,
      zombie.y - zombie.radius,
      zombie.radius * 2,
      zombie.radius * 2,
    );
  });

  bosses.forEach((boss) => {
    ctx.drawImage(
      bossImg,
      boss.x - boss.radius,
      boss.y - boss.radius,
      boss.radius * 2,
      boss.radius * 2,
    );
    // Nom du boss
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Alpha", boss.x - 45, boss.y - boss.radius - 35);

    // Barre de vie fond
    ctx.fillStyle = "black";
    ctx.fillRect(boss.x - 40, boss.y - boss.radius - 20, 80, 10);

    // Barre de vie rouge
    ctx.fillStyle = "green";
    ctx.fillRect(
      boss.x - 40,
      boss.y - boss.radius - 20,
      (boss.hp / 6) * 80,
      10,
    );

    // Contour
    ctx.strokeStyle = "white";
    ctx.strokeRect(boss.x - 40, boss.y - boss.radius - 20, 80, 10);
  });

  // VISEUR
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 3; // <-- AJOUTE ÇA
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 15;

  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.stroke();

  ctx.shadowBlur = 0;

  // LASER
  if (laserActive > 0) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 12;

    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();

    ctx.lineWidth = 3; // remise à la normale
  }

  // JOUEUR

  if (drone) {
    ctx.drawImage(droneImg, drone.x - 25, drone.y - 25, 50, 50);
  }
  if (drone) {
    ctx.fillStyle = "red";
    ctx.fillRect(drone.x - 20, drone.y - 40, 40, 6);

    ctx.fillStyle = "lime";
    ctx.fillRect(drone.x - 20, drone.y - 40, (drone.hp / drone.maxHp) * 40, 6);
  }

  ctx.drawImage(
    playerImg,
    player.x - player.radius,
    player.y - player.radius,
    player.radius * 2,
    player.radius * 2,
  );

  droneBullets.forEach((bullet) => {
    ctx.fillStyle = "cyan";

    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // UI
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";

  ctx.fillText("HP : " + Math.floor(player.hp), 20, 40);
  ctx.fillText("Score : " + score, 20, 80);
  ctx.fillText("Kills : " + kills, 20, 120);
  ctx.fillText("Pièces : " + coinCount, 20, 160);
  ctx.fillText("Munitions : " + ammo, 20, 200);
  ctx.fillText(
    drone ? "Drone [F] : ACTIF" : `Drone [F] : ${coinCount}/20 pièces`,
    20,
    320,
  );

  ctx.fillText(
    "Laser [E] : " +
      (laserCooldown <= 0 ? "PRET" : Math.ceil(laserCooldown / 60) + "s"),
    20,
    240,
  );

  ctx.strokeStyle = "white";
  ctx.strokeRect(20, 270, 200, 20);

  ctx.fillStyle = "yellow";
  ctx.fillRect(20, 270, (reloadTimer / 60) * 200, 20);

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
