// --- CONFIGURATION ---
const DECK_BUTTONS = [
    { id: 'action-1', label: 'Action 1' },
    { id: 'action-2', label: 'Action 2' },
    { id: 'action-3', label: 'Action 3' },
    // { id: 'action-4', label: 'Action 4' }, // Replaced by Typer
];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Screen Orientation Lock ---
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait-primary').catch(function(error) {
        console.warn("Orientation lock failed:", error);
      });
    }

    const socket = io(); // Auto-connect to the server that serves the page
    const deckContainer = document.getElementById('deck-container');
    const joystickZone = document.getElementById('joystick-zone');
    const touchpadZone = document.getElementById('touchpad-zone');
    const textInput = document.getElementById('text-to-type');
    const typeButton = document.getElementById('type-button');

    socket.on('connect', () => {
        console.log('Connected to Stream Deft server with ID:', socket.id);
    });

    // --- REMOTE TYPER ---
    typeButton.addEventListener('click', () => {
        const text = textInput.value;
        if (text) {
            console.log(`Sending text: ${text}`);
            socket.emit('stream-action', { id: 'action-4', text: text });
            textInput.value = ''; // Clear input after sending
        }
    });

    // --- CREATE BUTTONS ---
    DECK_BUTTONS.forEach(buttonConfig => {
        if (!buttonConfig.id) return; // Skip empty configs
        const button = document.createElement('div');
        button.className = 'deck-button';
        button.textContent = buttonConfig.label;
        
        button.addEventListener('click', () => {
            // For simple buttons, the actionId is just the string
            const actionId = buttonConfig.id;
            console.log(`Sending action: ${actionId}`);
            socket.emit('stream-action', actionId);
        });

        deckContainer.appendChild(button);
    });

    // --- CREATE JOYSTICK ---
    const joystickOptions = {
        zone: joystickZone,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white'
    };
    const manager = nipplejs.create(joystickOptions);

    manager.on('move', function (evt, data) {
        // Limit the number of events sent to the server
        if (data.distance > 10) { // Only send if joystick is moved significantly
            socket.emit('joystick-move', { 
                angle: data.angle.degree,
                distance: data.distance
            });
        }
    });

    manager.on('end', function () {
        socket.emit('joystick-move', { angle: 0, distance: 0 }); // Reset position
    });

    // --- TOUCHPAD LOGIC ---
    let lastX = 0;
    let lastY = 0;
    let isDragging = false;
    let touchStartTime = 0;
    const deadZone = 1.5; // Ignore movements smaller than this threshold

    touchpadZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        lastX = touch.clientX;
        lastY = touch.clientY;
        isDragging = true;
        touchStartTime = new Date().getTime();
    }, { passive: false });

    touchpadZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDragging) return;

        const touch = e.touches[0];
        const dx = touch.clientX - lastX;
        const dy = touch.clientY - lastY;

        lastX = touch.clientX;
        lastY = touch.clientY;

        // Only send movement if it's outside the dead zone
        if (Math.abs(dx) > deadZone || Math.abs(dy) > deadZone) {
            socket.emit('touchpad-move', { dx, dy });
        }
    }, { passive: false });

    touchpadZone.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDragging = false;
        const touchEndTime = new Date().getTime();
        // If the touch duration is short, consider it a tap (click)
        if (touchEndTime - touchStartTime < 200) {
            socket.emit('touchpad-click');
        }
    }, { passive: false });
});
