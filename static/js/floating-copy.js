// floating-copy.js: Floating copy button for messages
// Maximum ~200 lines

class FloatingCopyManager {
    constructor() {
        this.floatingButton = null;
        this.currentMessage = null;
        this.isVisible = false;
        this.scrollTimeout = null;
        
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.createFloatingButton();
        this.setupScrollListener();
        this.observeMessages();
        console.log('Floating copy manager initialized');
    }
    
    createFloatingButton() {
        // Create floating copy button
        this.floatingButton = document.createElement('div');
        this.floatingButton.className = 'floating-copy-btn fixed z-50 opacity-0 pointer-events-none transition-all duration-300';
        this.floatingButton.innerHTML = `
            <div class="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-2 hover:bg-gray-50 transition-colors cursor-pointer">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
            </div>
        `;
        
        // Add click handler
        this.floatingButton.addEventListener('click', () => {
            this.copyCurrentMessage();
        });
        
        document.body.appendChild(this.floatingButton);
    }
    
    setupScrollListener() {
        const chatContainer = document.getElementById('chat-container');
        if (!chatContainer) return;
        
        chatContainer.addEventListener('scroll', () => {
            this.handleScroll();
        });
        
        // Also listen to window scroll as fallback
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }
    
    handleScroll() {
        clearTimeout(this.scrollTimeout);
        
        this.scrollTimeout = setTimeout(() => {
            this.updateFloatingButton();
        }, 10); // Debounce for performance
    }
    
    updateFloatingButton() {
        const messages = document.querySelectorAll('.message[data-role="assistant"]');
        if (messages.length === 0) {
            this.hideFloatingButton();
            return;
        }
        
        const chatContainer = document.getElementById('chat-container');
        if (!chatContainer) {
            this.hideFloatingButton();
            return;
        }
        
        // Find the topmost visible message that's partially scrolled out
        let targetMessage = null;
        const containerRect = chatContainer.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerHeight = containerRect.height;
        
        for (const message of messages) {
            const rect = message.getBoundingClientRect();
            
            // Check if message is partially above the container viewport but still has content below
            if (rect.top < containerTop && rect.bottom > containerTop + 100) {
                targetMessage = message;
                break;
            }
        }
        
        if (targetMessage && targetMessage !== this.currentMessage) {
            this.showFloatingButton(targetMessage);
        } else if (!targetMessage) {
            this.hideFloatingButton();
        }
    }
    
    showFloatingButton(message) {
        this.currentMessage = message;
        
        // Position the button
        const messageRect = message.getBoundingClientRect();
        const buttonActions = message.querySelector('.opacity-60'); // The action buttons container
        
        if (buttonActions) {
            const actionsRect = buttonActions.getBoundingClientRect();
            
            // Position floating button to align with message actions
            this.floatingButton.style.left = `${actionsRect.left}px`;
            this.floatingButton.style.top = `${Math.max(20, actionsRect.top)}px`;
        } else {
            // Fallback positioning
            this.floatingButton.style.right = '20px';
            this.floatingButton.style.top = '100px';
        }
        
        // Show button
        this.floatingButton.style.opacity = '1';
        this.floatingButton.style.pointerEvents = 'auto';
        this.isVisible = true;
        
        // Add pulse effect on first show
        this.floatingButton.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.floatingButton.style.transform = 'scale(1)';
        }, 200);
    }
    
    hideFloatingButton() {
        if (!this.isVisible) return;
        
        this.floatingButton.style.opacity = '0';
        this.floatingButton.style.pointerEvents = 'none';
        this.currentMessage = null;
        this.isVisible = false;
    }
    
    async copyCurrentMessage() {
        if (!this.currentMessage) return;
        
        const messageContent = this.currentMessage.querySelector('.message-content');
        if (!messageContent) return;
        
        // Get the text content (without HTML)
        const textContent = messageContent.textContent || messageContent.innerText;
        
        try {
            await navigator.clipboard.writeText(textContent);
            this.showCopyFeedback();
        } catch (err) {
            console.error('Failed to copy message:', err);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.showCopyFeedback();
        }
    }
    
    showCopyFeedback() {
        const originalContent = this.floatingButton.innerHTML;
        
        // Show success icon
        this.floatingButton.innerHTML = `
            <div class="bg-green-500 backdrop-blur-sm rounded-lg shadow-lg border border-green-400/50 p-2 transition-colors">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
        `;
        
        // Add scale animation
        this.floatingButton.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            this.floatingButton.style.transform = 'scale(1)';
            this.floatingButton.innerHTML = originalContent;
        }, 1500);
    }
    
    observeMessages() {
        // Use MutationObserver to watch for new messages
        const chatContainer = document.getElementById('chat-container');
        if (!chatContainer) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            node.classList.contains('message')) {
                            // New message added, update floating button
                            setTimeout(() => this.updateFloatingButton(), 100);
                        }
                    });
                }
            });
        });
        
        observer.observe(chatContainer, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize when DOM is ready
let floatingCopyManager;
document.addEventListener('DOMContentLoaded', () => {
    floatingCopyManager = new FloatingCopyManager();
    // Make it globally available
    window.floatingCopyManager = floatingCopyManager;
});

// Export for use in other modules
window.FloatingCopyManager = FloatingCopyManager;
