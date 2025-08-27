import * as THREE from 'three';

const startButton = document.getElementById('startButton');
const container = document.getElementById('container');

startButton.addEventListener('click', init);

function init() {
    // Ocultar el botón y el contenedor
    container.style.display = 'none';

    // --- VARIABLES DE JUEGO ---
    const playerSpeed = 0.1;
    const moveDirection = { forward: 0, right: 0 };

    // 1. Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // 2. Cámara
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5);
    camera.rotation.order = 'YXZ';

    // 3. Renderizador
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 4. Geometría
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.y = 0.5;
    scene.add(cube);

    // 5. Controles
    function setupControls() {
        // Giroscopio
        if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
            window.DeviceOrientationEvent.requestPermission()
                .then(state => {
                    if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation);
                }).catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        // Joystick
        const joystickZone = document.getElementById('joystick-zone');
        const joystick = nipplejs.create({ zone: joystickZone, mode: 'static', position: { left: '50%', top: '50%' }, color: 'white' });

        joystick.on('move', (evt, data) => {
            const angle = data.angle.radian;
            const force = data.force;
            moveDirection.forward = Math.sin(angle) * force;
            moveDirection.right = Math.cos(angle) * force;
        });

        joystick.on('end', () => {
            moveDirection.forward = 0;
            moveDirection.right = 0;
        });
    }

    function handleOrientation(event) {
        const alpha = THREE.MathUtils.degToRad(event.alpha);
        const beta = THREE.MathUtils.degToRad(event.beta);
        const gamma = THREE.MathUtils.degToRad(event.gamma);
        camera.rotation.set(beta, alpha, gamma, 'YXZ');
    }

    setupControls();

    // --- CONEXIÓN MULTIJUGADOR ---
    // IMPORTANTE: Cambia 'localhost' por la IP de tu ordenador en tu red local
    const socket = io('http://deft.work:8383');

    socket.on('connect', () => {
        console.log('Conectado al servidor con ID:', socket.id);
    });

    // Enviar datos del jugador al servidor a intervalos regulares
    setInterval(() => {
        if (socket.connected) {
            socket.emit('playerMove', {
                position: camera.position,
                rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z } // Enviar un objeto plano
            });
        }
    }, 100); // 10 veces por segundo

    // 6. Bucle de Animación
    function animate() {
        requestAnimationFrame(animate);

        // Mover jugador
        if (moveDirection.forward !== 0) {
            camera.translateZ(-moveDirection.forward * playerSpeed);
        }
        if (moveDirection.right !== 0) {
            camera.translateX(moveDirection.right * playerSpeed);
        }

        renderer.render(scene, camera);
    }

    // 7. Manejo de redimensionamiento
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
    console.log('Controles de joystick y giroscopio inicializados.');
}