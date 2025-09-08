// scroll-animations.js: Scroll-triggered animations for 2025 immersive experience
// Maximum ~100 lines

// Intersection Observer for scroll-triggered animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, observerOptions);

// Initialize scroll animations
function initScrollAnimations() {
    // Observe all scroll-reveal elements
    const scrollElements = document.querySelectorAll('.scroll-reveal');
    scrollElements.forEach(el => {
        scrollObserver.observe(el);
    });
}

// Parallax effect for background elements
function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.parallax');
    
    if (parallaxElements.length === 0) return;
    
    let ticking = false;
    
    function updateParallax() {
        const scrollTop = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrollTop * speed);
            element.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick, { passive: true });
}

// Smooth scroll enhancement
function initSmoothScrolling() {
    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize all scroll animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initParallaxEffects();
    initSmoothScrolling();
});

// Re-observe new elements when they're added to the DOM
function observeNewElements() {
    const newElements = document.querySelectorAll('.scroll-reveal:not([data-observed])');
    newElements.forEach(el => {
        el.setAttribute('data-observed', 'true');
        scrollObserver.observe(el);
    });
}

// Export for use in other modules
window.observeNewElements = observeNewElements;
