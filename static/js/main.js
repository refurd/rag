// main.js: Main chat application coordinator
// Coordinates all chat modules and initializes the application

// Global variables
window.userId = localStorage.getItem('userId');
if (!window.userId) {
    window.userId = 'user-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', window.userId);
}

// Global state
window.isWaitingForResponse = false;
window.currentAIMessage = null;

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Chat application...');
    
    // Check if Socket.IO is available
    if (typeof io === 'undefined') {
        console.error('Socket.IO not loaded!');
        return;
    }
    
    // Initialize Socket.IO connection
    const socket = io();
    window.socket = socket; // Make socket globally available
    
    // Get DOM elements
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    window.chatContainer = chatContainer; // Make globally available
    window.userInput = userInput;
    
    // Setup Socket.IO event listeners
    socket.on('stream', handleStreamMessage);
    socket.on('message_updated', handleMessageUpdate);
    socket.on('connected', handleConnection);
    socket.on('error', handleError);
    
    // Initialize message sender
    initializeMessageSender();
    
    console.log('Chat application loaded successfully');
});
