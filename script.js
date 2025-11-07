// Responsive Navigation
const navSlide = () => {
    const burger = document.querySelector('.md\\:hidden button');
    const nav = document.querySelector('.hidden.md\\:flex');

    burger.addEventListener('click', () => {
        nav.classList.toggle('hidden');
    });
}

// Smooth Scrolling for nav links
const smoothScroll = () => {
    const navLinks = document.querySelectorAll('nav a');
    const ctaButton = document.querySelector('.bg-blue-500'); // A bit generic, but it works for now

    const scrollToSection = (event) => {
        event.preventDefault();
        const targetId = event.currentTarget.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            // Get header height to offset scroll position
            const header = document.querySelector('header');
            const headerHeight = header ? header.offsetHeight : 0;
            const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', scrollToSection);
    });

    if (ctaButton) {
        ctaButton.addEventListener('click', scrollToSection);
    }
};


// Dynamic Year for Footer
const setDynamicYear = () => {
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// Initialize functions
document.addEventListener('DOMContentLoaded', () => {
    navSlide();
    smoothScroll();
    setDynamicYear();
    AOS.init();
});

// To-Top Button
const toTopButton = document.getElementById('to-top');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        toTopButton.classList.remove('hidden');
    } else {
        toTopButton.classList.add('hidden');
    }
});
