/**
 * Scroll to Bottom Helper - Intelligens scroll kezelés ütközések elkerülésével
 */

// Global state to prevent multiple simultaneous scrolls
let isScrolling = false;
let scrollQueue = [];
let domReadyChecked = false;
let lastScrollTime = 0;
const SCROLL_DEBOUNCE_MS = 100;

// Check if DOM is fully ready for scrolling
function isDOMReady() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return false;
    
    // Check if element has proper dimensions
    const rect = chatMessages.getBoundingClientRect();
    return rect.height > 0 && chatMessages.scrollHeight > 0;
}

// Wait for DOM to be ready
function waitForDOM(callback, maxAttempts = 10) {
    let attempts = 0;
    
    function check() {
        if (isDOMReady() || attempts >= maxAttempts) {
            domReadyChecked = true;
            callback();
            return;
        }
        
        attempts++;
        setTimeout(check, 100);
    }
    
    check();
}

function smoothScrollToBottom(duration = 1000, force = false) {
    const now = Date.now();
    
    // Debounce: ignore rapid successive calls unless forced
    if (!force && (now - lastScrollTime) < SCROLL_DEBOUNCE_MS) {
        return;
    }
    
    lastScrollTime = now;
    
    // If already scrolling and not forced, queue the request
    if (isScrolling && !force) {
        scrollQueue.push({ duration, force });
        return;
    }
    
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.warn('Chat messages element not found');
        return;
    }
    
    // Wait for DOM if not ready
    if (!domReadyChecked && !isDOMReady()) {
        waitForDOM(() => smoothScrollToBottom(duration, force));
        return;
    }
    
    const startPosition = chatMessages.scrollTop;
    const targetPosition = chatMessages.scrollHeight - chatMessages.clientHeight;
    const distance = targetPosition - startPosition;
    
    if (distance <= 5) { // Small threshold to avoid micro-scrolls
        console.log('Already at bottom (within 5px)');
        processScrollQueue();
        return;
    }
    
    isScrolling = true;
    const startTime = performance.now();
    
    function easeOutQuart(t) {
        return 1 - (--t) * t * t * t; // Smoother easing
    }
    
    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        
        const currentPosition = startPosition + (distance * easedProgress);
        chatMessages.scrollTop = currentPosition;
        
        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        } else {
            isScrolling = false;
            console.log('Smooth scroll to bottom completed');
            processScrollQueue();
        }
    }
    
    requestAnimationFrame(animateScroll);
}

// Process queued scroll requests
function processScrollQueue() {
    if (scrollQueue.length > 0) {
        const next = scrollQueue.shift();
        setTimeout(() => smoothScrollToBottom(next.duration, next.force), 50);
    }
}

// Fallback function for immediate scroll (no animation)
function forceScrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        console.log('Immediate scroll to bottom executed');
    }
}

// Automatikus scroll oldal betöltéskor
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, waiting for full render...');
    
    // Egyetlen intelligens scroll kísérlet DOM készség ellenőrzéssel
    waitForDOM(() => {
        console.log('DOM ready, starting smooth scroll to bottom');
        smoothScrollToBottom(1000, true); // Force scroll on page load
    });
});

// Socket kapcsolat létrejöttekor is
document.addEventListener('socketConnected', function() {
    setTimeout(() => smoothScrollToBottom(600), 500);
});

// Ablak átméretezésekor is
window.addEventListener('resize', function() {
    setTimeout(() => smoothScrollToBottom(300), 100);
});

// Helper functions for easy use
function scrollToBottomFast() {
    smoothScrollToBottom(400, false);
}

function scrollToBottomSlow() {
    smoothScrollToBottom(1200, false);
}

function scrollToBottomImmediate() {
    forceScrollToBottom();
}

// Globálisan elérhető
window.forceScrollToBottom = forceScrollToBottom;
window.smoothScrollToBottom = smoothScrollToBottom;
window.scrollToBottomFast = scrollToBottomFast;
window.scrollToBottomSlow = scrollToBottomSlow;
window.scrollToBottomImmediate = scrollToBottomImmediate;
