// textarea-handler.js: Dynamic textarea resizing and multiline support
// Maximum ~150 lines

class TextareaHandler {
    constructor() {
        this.textarea = null;
        this.minHeight = 56;
        this.maxHeight = 200;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready and give extra time for all elements to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setup(), 100);
            });
        } else {
            setTimeout(() => this.setup(), 100);
        }
    }
    
    setup() {
        console.log('Setting up textarea handler...');
        
        this.textarea = document.getElementById('user-input');
        
        console.log('Elements found:', {
            textarea: !!this.textarea,
            textareaId: this.textarea?.id
        });
        
        if (!this.textarea) {
            console.error('Textarea with ID "user-input" not found!');
            return;
        }
        
        this.setupEventListeners();
        this.adjustHeight();
        console.log('Textarea handler initialized successfully');
    }
    
    setupEventListeners() {
        // Auto-resize on input
        this.textarea.addEventListener('input', () => {
            this.adjustHeight();
        });
        
        // Handle Enter vs Shift+Enter
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Shift+Enter: Allow new line
                    return;
                } else {
                    // Enter: Send message
                    e.preventDefault();
                    this.sendMessage();
                }
            }
        });
        
        console.log('Textarea handler setup complete', {
            textarea: !!this.textarea
        });
    }
    
    adjustHeight() {
        if (!this.textarea) return;
        
        // Reset height to calculate scrollHeight
        this.textarea.style.height = this.minHeight + 'px';
        
        // Calculate new height
        const scrollHeight = this.textarea.scrollHeight;
        
        // Set new height within bounds
        const newHeight = Math.min(Math.max(scrollHeight, this.minHeight), this.maxHeight);
        this.textarea.style.height = newHeight + 'px';
        
        // Show/hide scrollbar if needed
        if (scrollHeight > this.maxHeight) {
            this.textarea.style.overflowY = 'auto';
        } else {
            this.textarea.style.overflowY = 'hidden';
        }
    }
    

    
    sendMessage() {
        // Trigger the existing send message function
        if (window.sendMessage) {
            window.sendMessage();
        }
    }
    
    // Public method to reset textarea
    reset() {
        if (this.textarea) {
            this.textarea.value = '';
            this.textarea.style.height = this.minHeight + 'px';
            this.textarea.style.overflowY = 'hidden';
        }
    }
    
    // Public method to focus textarea
    focus() {
        if (this.textarea) {
            this.textarea.focus();
        }
    }
}

// Initialize when DOM is ready
let textareaHandler;
document.addEventListener('DOMContentLoaded', () => {
    textareaHandler = new TextareaHandler();
    // Make it globally available
    window.textareaHandler = textareaHandler;
});
