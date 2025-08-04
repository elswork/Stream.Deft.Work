
const WebSocket = require('ws');
const robot = require('robotjs');
const https = require('https');
const fs = require('fs');
const { networkInterfaces } = require('os');

// Get local IP address
const nets = networkInterfaces();
let localIp = '';

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            localIp = net.address;
            break;
        }
    }
    if (localIp) break;
}

// Create HTTPS server
const server = https.createServer({
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem')
});

const wss = new WebSocket.Server({ server });

server.listen(8080, () => {
    console.log('╔═════════════════════════════════════════════════════════════╗');
    console.log('║                                                             ║');
    console.log(`║   Servidor WebSocket SEGURO escuchando en: wss://${localIp}:8080   ║`);
    console.log('║                                                             ║');
    console.log('╚═════════════════════════════════════════════════════════════╝');
});

wss.on('connection', ws => {
  console.log('Cliente conectado.');

  ws.on('message', message => {
    console.log('Mensaje recibido: %s', message);

    try {
        const data = JSON.parse(message);
        handleAction(data);
    } catch (e) {
        console.error('Error al parsear el mensaje JSON:', e);
    }
  });

  ws.on('close', () => {
    console.log('Cliente desconectado.');
  });
});

function handleAction(data) {
    if (!data.action) {
        console.log('No se ha especificado ninguna acción.');
        return;
    }

    switch (data.action) {
        case 'type':
            if (data.payload) {
                robot.typeString(data.payload);
                console.log(`Escribiendo: ${data.payload}`);
            }
            break;
        case 'key_tap':
            if (data.payload) {
                robot.keyTap(data.payload);
                console.log(`Pulsando tecla: ${data.payload}`);
            }
            break;
        case 'mouse_move':
             if (data.payload && typeof data.payload.x === 'number' && typeof data.payload.y === 'number') {
                const { x, y } = robot.getMousePos();
                robot.moveMouse(x + data.payload.x, y + data.payload.y);
                console.log(`Moviendo ratón a: x=${x + data.payload.x}, y=${y + data.payload.y}`);
            }
            break;
        case 'mouse_click':
            robot.mouseClick();
            console.log('Click de ratón.');
            break;
        default:
            console.log(`Acción desconocida: ${data.action}`);
    }
}

console.log('Servidor (seguro) iniciado. Esperando conexiones...');

