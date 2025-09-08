/**
 * Profile Panel Manager
 * Handles the profile panel functionality similar to file manager
 */
class ProfilePanelManager {
    constructor() {
        // Panel elemek
        this.panel = document.getElementById('profile-panel');
        this.toggleButton = document.getElementById('profile-toggle-btn');
        this.closeButton = document.getElementById('close-profile-panel');
        
        // Állapot
        this.isOpen = false;
        
        // Inicializálás
        this.init();
    }
    
    init() {
        if (!this.panel) {
            console.warn('❌ Profile panel not found');
            return;
        }
        
        if (!this.toggleButton) {
            console.warn('❌ Profile toggle button not found');
            return;
        }
        
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        
        console.log('✅ Profile Panel Manager initialized');
    }
    
    setupEventListeners() {
        // Toggle button event listener
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggle());
        }
        
        // Close button event listener
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }
    }
    
    setupKeyboardShortcuts() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+P to toggle profile panel
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggle();
            }
            // Escape to close panel
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        if (!this.panel) return;
        
        console.log('📂 Opening profile panel...');
        
        // Close files panel if open
        if (window.fileManager && window.fileManager.isOpen) {
            window.fileManager.close();
        }
        
        // Use new panel system
        this.panel.classList.add('open');
        
        // Apply split-screen layout
        document.body.classList.add('profile-panel-open');
        
        // Update button state
        if (this.toggleButton) {
            this.toggleButton.classList.add('bg-blue-100', 'text-blue-600');
            this.toggleButton.classList.remove('text-gray-600', 'hover:text-gray-800');
        }
        
        this.isOpen = true;
        
        console.log('✅ Profile panel opened');
    }
    
    close() {
        if (!this.panel) return;
        
        console.log('📁 Closing profile panel...');
        
        // Use new panel system
        this.panel.classList.remove('open');
        
        // Remove split-screen layout
        document.body.classList.remove('profile-panel-open');
        
        // Update button state
        if (this.toggleButton) {
            this.toggleButton.classList.remove('bg-blue-100', 'text-blue-600');
            this.toggleButton.classList.add('text-gray-600', 'hover:text-gray-800');
        }
        
        this.isOpen = false;
        
        console.log('✅ Profile panel closed');
    }
    
    applySplitScreenLayout() {
        // Add body class for CSS targeting
        document.body.classList.add('profile-panel-open');
        
        // Resize chat container
        const chatContainer = document.querySelector('.flex-1.overflow-hidden');
        const chatMessages = document.getElementById('chat-messages');
        const footer = document.querySelector('footer');
        
        if (chatContainer) {
            chatContainer.style.width = '50%';
            chatContainer.style.transition = 'width 300ms ease-out';
        }
        
        if (chatMessages) {
            chatMessages.style.maxWidth = '100%';
            chatMessages.style.transition = 'max-width 300ms ease-out';
        }
        
        if (footer) {
            footer.style.width = '50%';
            footer.style.transition = 'width 300ms ease-out';
        }
    }
    
    removeSplitScreenLayout() {
        // Remove body class
        document.body.classList.remove('profile-panel-open');
        
        // Restore chat container
        const chatContainer = document.querySelector('.flex-1.overflow-hidden');
        const chatMessages = document.getElementById('chat-messages');
        const footer = document.querySelector('footer');
        
        if (chatContainer) {
            chatContainer.style.width = '100%';
        }
        
        if (chatMessages) {
            chatMessages.style.maxWidth = '100%';
        }
        
        if (footer) {
            footer.style.width = '100%';
        }
        
        // Clean up after transition
        setTimeout(() => {
            if (chatContainer) chatContainer.style.removeProperty('transition');
            if (chatMessages) chatMessages.style.removeProperty('transition');
            if (footer) footer.style.removeProperty('transition');
        }, 300);
    }
    
    updateStatistics() {
        // Update message count (example)
        const messageCount = document.querySelectorAll('#chat-messages .message').length;
        const messageStatElement = document.querySelector('.text-2xl.font-bold.text-blue-900');
        if (messageStatElement) {
            messageStatElement.textContent = messageCount;
        }
        
        // Update file count (if file manager is available)
        if (window.fileManager && window.fileManager.currentFiles) {
            const fileCount = window.fileManager.currentFiles.length;
            const fileStatElement = document.querySelector('.text-2xl.font-bold.text-green-900');
            if (fileStatElement) {
                fileStatElement.textContent = fileCount;
            }
        }
        
        // Update usage percentage (example)
        const usageElement = document.querySelector('.text-2xl.font-bold.text-purple-900');
        if (usageElement) {
            const usage = Math.floor(Math.random() * 100); // Random for demo
            usageElement.textContent = usage + '%';
        }
        
        // Update days count (example)
        const daysElement = document.querySelector('.text-2xl.font-bold.text-orange-900');
        if (daysElement) {
            const startDate = new Date('2024-01-01');
            const currentDate = new Date();
            const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
            daysElement.textContent = daysDiff;
        }
    }
    
    // Settings handlers
    setupSettingsHandlers() {
        // Theme toggle
        const themeToggle = document.querySelector('#profile-panel input[type="checkbox"]');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('dark-theme');
                } else {
                    document.body.classList.remove('dark-theme');
                }
            });
        }
    }
}

// Inicializálás amikor a DOM betöltődött
document.addEventListener('DOMContentLoaded', () => {
    window.profilePanelManager = new ProfilePanelManager();
    window.profileManager = window.profilePanelManager; // Alias for consistency
});
