<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Space Ray Evader</title>
    <style>
        body {
            margin: 0;
            background-color: #050510;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }
        canvas {
            border: 4px solid #333;
            background: radial-gradient(circle, #101026 0%, #050511 100%);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
        }
        #ui {
            margin-top: 15px;
            text-align: center;
        }
        .controls {
            color: #888;
            font-size: 0.9rem;
            margin-top: 5px;
        }
    </style>
</head>
<body>

    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <div id="ui">
        <div class="controls">Use <b>Left / Right Arrow Keys</b> or <b>A / D</b> to move</div>
    </div>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let score = 0;
let gameOver = false;
const colors = ['#ff3333', '#33ff33', '#3333ff', '#ffff33', '#ff33ff', '#33ffff'];

// Starfield background
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 0.5
    });
}

// Top Alien Ship (Fixed at Top Middle)
const topShip = {
    x: canvas.width / 2,
    y: 50,
    radius: 30,
    lastShotTime: 0,
    shootDelay: 400 // ms between ray emissions
};

// Player Ship (Bottom, Horizontal movement only)
const playerShip = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 50,
    height: 30,
    speed: 8,
    isMovingLeft: false,
    isMovingRight: false
};

// Rays array
const rays = [];

// Input Handlers
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') playerShip.isMovingLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') playerShip.isMovingRight = true;
    if (e.key === ' ' && gameOver) resetGame();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') playerShip.isMovingLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') playerShip.isMovingRight = false;
});

function resetGame() {
    score = 0;
    gameOver = false;
    rays.length = 0;
    playerShip.x = canvas.width / 2;
    requestAnimationFrame(update);
}

// Fire a new ray with a random angle and color
function fireRay(timestamp) {
    if (timestamp - topShip.lastShotTime > topShip.shootDelay) {
        // Calculate angle to spray downwards across the screen
        const angle = (Math.random() * Math.PI * 0.6) + (Math.PI * 0.2); // Sweeps mostly downwards
        const speed = Math.random() * 3 + 4; // Randomized time/speed separation
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        rays.push({
            x: topShip.x,
            y: topShip.y + 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            length: Math.random() * 20 + 30,
            color: randomColor,
            angle: angle
        });
        topShip.lastShotTime = timestamp;
    }
}

// Check collision between a ray line segment and player bounding box
function checkCollision(ray, player) {
    const rx2 = ray.x + Math.cos(ray.angle) * ray.length;
    const ry2 = ray.y + Math.sin(ray.angle) * ray.length;

    // Simple approximation: Check if either end of the ray is inside player bounds
    const pLeft = player.x - player.width / 2;
    const pRight = player.x + player.width / 2;
    const pTop = player.y - player.height / 2;
    const pBottom = player.y + player.height / 2;

    if ((ray.x >= pLeft && ray.x <= pRight && ray.y >= pTop && ray.y <= pBottom) ||
        (rx2 >= pLeft && rx2 <= pRight && ry2 >= pTop && ry2 <= pBottom)) {
        return true;
    }
    return false;
}

// Main Game Loop
function update(timestamp) {
    if (gameOver) return;

    // 1. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw & Update Background Stars
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // 3. Move Player
    if (playerShip.isMovingLeft && playerShip.x - playerShip.width/2 > 0) {
        playerShip.x -= playerShip.speed;
    }
    if (playerShip.isMovingRight && playerShip.x + playerShip.width/2 < canvas.width) {
        playerShip.x += playerShip.speed;
    }

    // 4. Enemy AI Shooting (Time delayed)
    fireRay(timestamp);

    // 5. Update & Draw Rays
    for (let i = rays.length - 1; i >= 0; i--) {
        const r = rays[i];
        r.x += r.vx;
        r.y += r.vy;

        // Draw Ray
        ctx.beginPath();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = r.color;
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + Math.cos(r.angle) * r.length, r.y + Math.sin(r.angle) * r.length);
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow

        // Check Collisions
        if (checkCollision(r, playerShip)) {
            gameOver = true;
        }

        // Remove out-of-bounds rays and add points
        if (r.y > canvas.height || r.x < 0 || r.x > canvas.width) {
            rays.splice(i, 1);
            score += 10;
        }
    }

    // 6. Draw Top Ship (Boss)
    ctx.fillStyle = '#44445c';
    ctx.beginPath();
    ctx.arc(topShip.x, topShip.y, topShip.radius, 0, Math.PI, true);
    ctx.fill();
    // Glowing core
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(topShip.x, topShip.y + 5, 10, 0, Math.PI * 2);
    ctx.fill();

    // 7. Draw Player Ship
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(playerShip.x, playerShip.y - playerShip.height / 2);
    ctx.lineTo(playerShip.x - playerShip.width / 2, playerShip.y + playerShip.height / 2);
    ctx.lineTo(playerShip.x + playerShip.width / 2, playerShip.y + playerShip.height / 2);
    ctx.closePath();
    ctx.fill();

    // 8. Draw Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 40);

    // Handle Game Over Screen
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ff3333';
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 60);
        ctx.textAlign = 'left'; // reset
        return;
    }

    requestAnimationFrame(update);
}

// Start game
requestAnimationFrame(update);
</script>

</body>
</html>
