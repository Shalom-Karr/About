// js/app.js
document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initScrollAnimations();
    initProgressBar();
});

function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    
    // Load saved preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
        htmlEl.setAttribute('data-theme', storedTheme);
        if (storedTheme === 'dark') htmlEl.classList.add('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        htmlEl.setAttribute('data-theme', 'dark');
        htmlEl.classList.add('dark');
    }
    
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme') || (htmlEl.classList.contains('dark') ? 'dark' : 'light');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlEl.setAttribute('data-theme', newTheme);
        if (newTheme === 'dark') {
            htmlEl.classList.add('dark');
        } else {
            htmlEl.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    });
}

// Intersection Observer for scroll animations
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Determine animation type based on class
                if (entry.target.classList.contains('slide-in-left') || entry.target.classList.contains('slide-in-right')) {
                    entry.target.classList.add('is-visible');
                } else {
                    entry.target.classList.add('animate-fade-in-up');
                }
                entry.target.style.opacity = 1;
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with the 'reveal', 'slide-in-left', or 'slide-in-right' classes
    document.querySelectorAll('.reveal, .slide-in-left, .slide-in-right').forEach(el => {
        // Only hide reveal elements initially (slide-ins are hidden by CSS)
        if (el.classList.contains('reveal')) {
             el.style.opacity = 0; 
        }
        observer.observe(el);
    });
}

// Reading Progress Bar
function initProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;
    
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// Make initScrollAnimations available globally for dynamically injected content
window.initScrollAnimations = initScrollAnimations;