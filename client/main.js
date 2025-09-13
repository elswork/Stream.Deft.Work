// --- CONFIGURATION ---
const DECK_BUTTONS = [
    { id: 'action-1', label: 'Action 1' },
    { id: 'action-2', label: 'Action 2' },
    { id: 'action-3', label: 'Action 3' },
    { id: 'action-4', label: 'Action 4' },
    { id: 'action-5', label: 'Action 5' },
    { id: 'action-6', label: 'Action 6' },
    { id: 'action-7', label: 'Action 7' },
    { id: 'action-8', label: 'Action 8' },
];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const socket = io('http://deft.work:8383'); // IMPORTANT: Use your server's local IP or address
    const deckContainer = document.getElementById('deck-container');

    socket.on('connect', () => {
        console.log('Connected to Stream Deft server with ID:', socket.id);
    });

    // --- CREATE BUTTONS ---
    DECK_BUTTONS.forEach(buttonConfig => {
        const button = document.createElement('div');
        button.className = 'deck-button';
        button.textContent = buttonConfig.label;
        button.dataset.actionId = buttonConfig.id;

        button.addEventListener('click', () => {
            const actionId = button.dataset.actionId;
            console.log(`Sending action: ${actionId}`);
            socket.emit('stream-action', actionId);
        });

        deckContainer.appendChild(button);
    });
});
