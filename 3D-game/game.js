const scoreEl = document.getElementById("score");
const restartBtn = document.getElementById("restartBtn");

// 1. Setup 3D Scene, Camera, and Renderer
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000011, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10);
camera.lookAt(0, 0, -5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Add Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0x00ffcc, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// 3. Create 3D Player Spaceship (Cone)
const shipGeo = new THREE.ConeGeometry(0.8, 2.2, 8);
shipGeo.rotateX(-Math.PI / 2); // Point forward into the screen
const shipMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, flatShading: true });
const player = new THREE.Mesh(shipGeo, shipMat);
scene.add(player);

// 4. Create 3D Starfield
const starGeo = new THREE.BufferGeometry();
const starCoords = [];
for (let i = 0; i < 600; i++) {
  starCoords.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, -Math.random() * 100);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 }));
scene.add(stars);

let bullets = [], enemies = [], score = 0, gameOver = false, keys = {}, canShoot = true;

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.code === "Space" && canShoot && !gameOver) {
    shootLaser();
    canShoot = false;
  }
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
  if (e.code === "Space") canShoot = true;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function shootLaser() {
  const geo = new THREE.BoxGeometry(0.15, 0.15, 1.5);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
  const laser = new THREE.Mesh(geo, mat);
  laser.position.copy(player.position);
  scene.add(laser);
  bullets.push(laser);
}

function spawnEnemy() {
  if (Math.random() < 0.04) {
    const geo = new THREE.DodecahedronGeometry(1.1, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff4d4d, flatShading: true });
    const asteroid = new THREE.Mesh(geo, mat);
    asteroid.position.set((Math.random() - 0.5) * 16, 0, -60);
    scene.add(asteroid);
    enemies.push(asteroid);
  }
}

function startGame() {
  bullets.forEach(b => scene.remove(b));
  enemies.forEach(e => scene.remove(e));
  bullets = [];
  enemies = [];
  player.position.set(0, 0, 0);
  player.visible = true;
  score = 0;
  gameOver = false;
  scoreEl.innerText = score;
  restartBtn.style.display = "none";
  animate();
}

function animate() {
  if (gameOver) return;
  requestAnimationFrame(animate);

  // Move and tilt spaceship
  if (keys["ArrowLeft"] && player.position.x > -8) {
    player.position.x -= 0.25;
    player.rotation.z = 0.4; // Bank left
  } else if (keys["ArrowRight"] && player.position.x < 8) {
    player.position.x += 0.25;
    player.rotation.z = -0.4; // Bank right
  } else {
    player.rotation.z *= 0.85; // Level out
  }

  // Move lasers
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].position.z -= 1.2;
    if (bullets[i].position.z < -70) {
      scene.remove(bullets[i]);
      bullets.splice(i, 1);
    }
  }

  spawnEnemy();

  // Move asteroids & check collisions
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    enemy.position.z += 0.45 + (score * 0.001);
    enemy.rotation.x += 0.03;
    enemy.rotation.y += 0.03;

    // Laser hits asteroid
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (bullets[j].position.distanceTo(enemy.position) < 1.4) {
        score += 10;
        scoreEl.innerText = score;
        scene.remove(enemy);
        scene.remove(bullets[j]);
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }

    // Asteroid hits player
    if (enemy.parent && enemy.position.distanceTo(player.position) < 1.3) {
      gameOver = true;
      player.visible = false;
      restartBtn.style.display = "inline-block";
    } else if (enemy.position.z > 12) {
      scene.remove(enemy);
      enemies.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

startGame();