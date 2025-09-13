document.addEventListener('DOMContentLoaded', () => {
    // Connect to the 'monitor' namespace
    const socket = io(window.location.origin + '/monitor');
    const qrCodeImg = document.getElementById('qr-code');
    const eventsList = document.getElementById('events-list');

    socket.on('connect', () => {
        console.log('Connected to server monitor namespace with ID:', socket.id);
    });

    // Fetch the QR code from the server API
    fetch('/api/qr')
        .then(response => response.json())
        .then(data => {
            if (data.qrUrl) {
                qrCodeImg.src = data.qrUrl;
            }
        })
        .catch(error => console.error('Error fetching QR code:', error));

    // Listen for events from the server
    socket.on('event', (event) => {
        console.log('Received event:', event);
        const li = document.createElement('li');
        const timestamp = new Date(event.timestamp).toLocaleTimeString();
        
        let eventText = `[${timestamp}] ${event.type.toUpperCase()}: ${event.id}`;
        
        // Future handling for joystick
        if (event.type === 'joystick') {
            eventText += ` - Angle: ${event.data.angle.toFixed(2)}, Distance: ${event.data.distance.toFixed(2)}`;
        }

        li.textContent = eventText;
        eventsList.prepend(li); // Add new events to the top
    });
});
