const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const robot = require('robotjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  }
});

const PORT = process.env.PORT || 8383;

// --- IP and QR Code Logic ---
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost'; // Fallback
}

const localIp = getLocalIpAddress();
const clientUrl = `http://${localIp}:${PORT}`;

app.get('/api/qr', (req, res) => {
    QRCode.toDataURL(clientUrl, (err, url) => {
        if (err) {
            res.status(500).send('Error generating QR code');
        } else {
            res.send({ qrUrl: url });
        }
    });
});


// --- Static Files Serving ---
// Serve the main client
app.use(express.static(path.join(__dirname, '..', 'client')));
// Serve the monitor UI
app.use('/monitor', express.static(path.join(__dirname, 'monitor')));


// --- Socket.IO Namespaces ---
const monitorIo = io.of('/monitor');

monitorIo.on('connection', socket => {
    console.log('Monitor client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Monitor client disconnected:', socket.id);
    });
});

io.on('connection', (socket) => {
  console.log('Stream Deft client connected:', socket.id);

  // Listen for a custom action from the client
  socket.on('stream-action', (payload) => {
    // Normalize payload: can be a string (e.g., 'action-1') or an object ({id: 'action-4', text: ...})
    const actionId = typeof payload === 'string' ? payload : payload.id;
    console.log(`Action received: ${actionId}`);

    // Broadcast a generic event for simple actions
    if (actionId !== 'action-3' && actionId !== 'action-4') {
      monitorIo.emit('event', { type: 'action', id: actionId, timestamp: new Date() });
    }

    // Define actions based on actionId
    switch (actionId) {
      case 'action-1':
        console.log('Executing: Open Notepad');
        exec('start notepad.exe', (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
        });
        break;
      case 'action-2':
        console.log('Executing: Right-click and Enter');
        try {
          robot.mouseClick('right');
          robot.keyTap('enter');
        } catch (error) {
          console.error('RobotJS action failed:', error);
        }
        break;
      case 'action-3':
        console.log('Executing: Pixel Inspector');
        try {
          const screenSize = robot.getScreenSize();
          const mouse = robot.getMousePos();
          let info;

          if (mouse.x >= 0 && mouse.x < screenSize.width && mouse.y >= 0 && mouse.y < screenSize.height) {
            const hexColor = robot.getPixelColor(mouse.x, mouse.y);
            info = `Coords: (X: ${mouse.x}, Y: ${mouse.y}) | Color: #${hexColor}`;
          } else {
            info = `Coords: (X: ${mouse.x}, Y: ${mouse.y}) | Color: (Mouse on secondary display)`;
          }
          
          console.log(info);
          monitorIo.emit('event', { type: 'info', id: info, timestamp: new Date() });
        } catch (error) {
          console.error('RobotJS action failed:', error);
        }
        break;
      case 'action-4':
        console.log('Executing: Remote Typer');
        if (payload.text) {
          try {
            robot.typeString(payload.text);
            monitorIo.emit('event', { type: 'typer', id: `Typed: "${payload.text}"`, timestamp: new Date() });
          } catch (error) {
            console.error('RobotJS action failed:', error);
          }
        }
        break;
      default:
        console.log(`No action defined for ${actionId}`);
    }
  });

  // Listen for joystick movement from the client
  socket.on('joystick-move', (data) => {
    // Broadcast to monitors
    monitorIo.emit('event', { type: 'joystick', id: 'move', data: data, timestamp: new Date() });
  });

  // --- TOUCHPAD EVENTS ---
  socket.on('touchpad-move', (data) => {
    try {
      const { dx, dy } = data;
      const mouse = robot.getMousePos();
      robot.moveMouse(mouse.x + dx, mouse.y + dy);
    } catch (error) {
      console.error('RobotJS touchpad move failed:', error);
    }
  });

  socket.on('touchpad-click', () => {
    try {
      robot.mouseClick();
      console.log('Touchpad click executed');
    } catch (error) {
      console.error('RobotJS touchpad click failed:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Stream Deft client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Controller URL: ${clientUrl}`);
  console.log(`Monitor URL: http://${localIp}:${PORT}/monitor`);
});
