let scene, camera, renderer, controls;
let bullets = [];
let zombies = [];
let clock = new THREE.Clock();
const bulletSpeed = 1;
const zombieSpeed = 0.01;
const spawnDirectionAngle = 0;
const spawnRadius = 25; 
const planeHeight = 0;
const playerHeight = 1;
const zombieSize = 1;
let magazineSize = 30;
let bulletsInMagazine = magazineSize;
let isReloading = false;
let health = 100;
let isGameOver = false;
let sword;
let canDash = true;


init();
animate();


function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);
    camera.position.y = planeHeight + playerHeight;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    controls = new THREE.PointerLockControls(camera, renderer.domElement);

    document.addEventListener('click', () => {
        controls.lock();
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', shoot);
    document.addEventListener('keydown', meleeAttack);

    window.addEventListener('resize', onWindowResize, false);
        
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x87ceeb });
    const backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    backgroundPlane.rotation.x = -Math.PI / 2;
    backgroundPlane.position.y = -2;
    backgroundPlane.renderOrder = -1;
    scene.add(backgroundPlane);

    const gunGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 32);
    const gunMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.rotation.x = Math.PI / 2;
    gun.position.set(0.5, -0.5, -1);
    camera.add(gun);

    const swordGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 32);
    const swordMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    sword = new THREE.Mesh(swordGeometry, swordMaterial);
    sword.rotation.z = Math.PI / 4;
    sword.position.set(-0.5, -0.5, -1);
    sword.visible = false;
    camera.add(sword);

    for (let i = 0; i < 10; i++) {
        addZombie();
    }

    scene.add(camera);

    document.getElementById('restart-button').addEventListener('click', restartGame);

    updateHUD();
}

function updateHUD() {
    document.getElementById('ammo-count').textContent = bulletsInMagazine;
    document.getElementById('reload-state').textContent = isReloading ? 'Reload: Reloading' : 'Reload: Ready';
}


function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            controls.moveForward(0.1);
            break;
        case 'ArrowLeft':
        case 'KeyA':
            controls.moveRight(-0.1);
            break;
        case 'ArrowDown':
        case 'KeyS':
            controls.moveForward(-0.1);
            break;
        case 'ArrowRight':
        case 'KeyD':
            controls.moveRight(0.1);
            break;
        case 'KeyE':
            if (canDash) {
                dash();
            }
            break;
    }
}
function calculateSpawnPosition() {
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle + spawnDirectionAngle) * spawnRadius;
    const z = Math.sin(angle + spawnDirectionAngle) * spawnRadius;
    return { x, z };
}

function meleeAnimation() {
    const initialRotation = sword.rotation.z;
    const targetRotation = initialRotation - Math.PI / 2;

    const duration = 200;
    const startTime = Date.now();

    function animate() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed >= duration) {
            sword.rotation.z = targetRotation;
            setTimeout(() => {
                sword.rotation.z = initialRotation;
                sword.visible = false;
                checkMeleeHit();
            }, 100);
            return;
        }

        const progress = elapsed / duration;
        sword.rotation.z = initialRotation + progress * (targetRotation - initialRotation);

        requestAnimationFrame(animate);
    }

    animate();
}


function meleeAttack(event) {
    if (event.code === 'KeyQ' && !isGameOver) {
        sword.visible = true;
        meleeAnimation();
    }
}

function updateCompass() {
    const compass = document.getElementById('compass');
    const radians = camera.rotation.y;

    const degrees = THREE.MathUtils.radToDeg(radians);
    let direction = '';

    if (degrees >= -45 && degrees < 45) {
        direction = 'N';
    } else if (degrees >= 45 && degrees < 135) {
        direction = 'E';
    } else if (degrees >= 135 || degrees < -135) {
        direction = 'S';
    } else if (degrees >= -135 && degrees < -45) {
        direction = 'W';
    }

    compass.textContent = `${direction} ${Math.round(degrees)}°`;
}



function reload() {
    if (!isReloading) {
        isReloading = true;
        bulletsInMagazine = magazineSize;
        updateHUD();
        setTimeout(() => {
            isReloading = false;
            updateHUD();
        }, 5000);
    }
}


function shoot() {
    if (isGameOver && !isReloading && bulletsInMagazine > 0) return; {
        const bulletGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bulletsInMagazine--;
        updateHUD(); 
        bullet.position.copy(camera.position);
        bullet.quaternion.copy(camera.quaternion);
        scene.add(bullet);
        bullets.push(bullet);
    }
}

document.addEventListener('keydown', event => {
    if (event.code === 'KeyR') {
        reload();
    }
});


function dash() {
    canDash = false;
    controls.moveForward(1);
    setTimeout(() => canDash = true, 1000);
}

function addZombie() {
    const spawnPosition = calculateSpawnPosition();
    const zombieGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const zombieMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const zombie = new THREE.Mesh(zombieGeometry, zombieMaterial);
    zombie.position.set(spawnPosition.x, 0.5, spawnPosition.z);
    scene.add(zombie);
    zombies.push(zombie);
    zombie.position.y = planeHeight + zombieSize / 2; 
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    if (isGameOver) return;

    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    bullets.forEach((bullet, index) => {
        bullet.translateZ(-bulletSpeed);
        if (bullet.position.length() > 100) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });

    zombies.forEach(zombie => {
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, zombie.position).normalize();
        zombie.position.add(direction.multiplyScalar(zombieSpeed));

        bullets.forEach((bullet, bulletIndex) => {
            if (bullet.position.distanceTo(zombie.position) < 0.5) {
                scene.remove(zombie);
                scene.remove(bullet);
                zombies.splice(zombies.indexOf(zombie), 1);
                bullets.splice(bulletIndex, 1);
                addZombie();
            }
        });

        if (zombie.position.distanceTo(camera.position) < 1) {
            health -= 25;
            updateHealthBar();
            console.log("Health: " + health);
            if (health <= 0) {
                gameOver();
            }
        }
    });
    updateCompass();

    renderer.render(scene, camera);
}


function checkMeleeHit() {
    zombies.forEach(zombie => {
        if (zombie.position.distanceTo(camera.position) < 1.5) {
            scene.remove(zombie);
            zombies.splice(zombies.indexOf(zombie), 1);
            addZombie();
        }
    });
}

function updateHealthBar() {
    const healthBar = document.getElementById('health-bar');
    healthBar.style.width = health + '%';
}

function gameOver() {
    isGameOver = true;
    document.getElementById('game-over').style.display = 'block';
}

function restartGame() {
    health = 100;
    isGameOver = false;
    document.getElementById('game-over').style.display = 'none';

    zombies.forEach(zombie => scene.remove(zombie));
    zombies = [];

    bullets.forEach(bullet => scene.remove(bullet));
    bullets = [];

    for (let i = 0; i < 10; i++) {
        addZombie();
    }

    updateHealthBar();

    animate();
}