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

import { initTracker } from './tracker.js';
import { supabase } from './supabase-client.js';

// --- Project Card Dynamic Loading ---
const loadProjects = async () => {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;

    const skeletonCards = projectsGrid.querySelectorAll('.skeleton-card');

    try {
        const { data: projects, error } = await supabase
            .from('profile_websites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            projectsGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Failed to load projects.</p>';
            return;
        }

        // Hide all skeleton cards initially
        skeletonCards.forEach(card => card.style.display = 'none');

        if (projects.length === 0) {
            projectsGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full">No projects to display yet.</p>';
            return;
        }
        
        // Populate skeleton cards with real data
        projects.forEach((project, index) => {
            if (index < skeletonCards.length) {
                const card = skeletonCards[index];
                card.classList.remove('skeleton-card'); // Remove skeleton class to stop shimmer
                card.style.display = 'block'; // Make it visible

                const techSpans = project.technologies.map(tech =>
                    `<span class="text-xs font-semibold">${tech}</span>`
                ).join('');

                card.innerHTML = `
                    <a href="${project.url}" target="_blank" class="project-card block p-6 h-full flex flex-col">
                        <h3 class="text-2xl font-bold mb-2 text-blue-400">${project.title}</h3>
                        <p class="text-gray-400 mb-4">${project.description}</p>
                        <div class="mt-auto">
                            <div class="flex items-center justify-between text-gray-500">
                                <div class="flex space-x-2">
                                    ${techSpans}
                                </div>
                                <div class="flex space-x-4">
                                    <i class="fas fa-link"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                `;
            }
        });

        animateProjectCards(); // This function will be created in the next step

    } catch (e) {
        console.error('Error loading projects:', e);
        projectsGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Failed to load projects.</p>';
    }
};

// --- GSAP Animations ---
const animateProjectCards = () => {
    gsap.registerPlugin(ScrollTrigger);

    // Set the initial state of the cards (invisible and slightly moved down)
    gsap.set(".project-card", { y: 50, opacity: 0 });

    ScrollTrigger.batch(".project-card", {
        start: "top 80%", // Trigger when the top of the card hits 80% from the top of the viewport
        onEnter: batch => {
            gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out"
            });
        },
        once: true // Only run the animation once
    });
};


// --- Hero Section Typing Animation ---
const initTypingAnimation = () => {
    const typedElement = document.getElementById('typed');
    if (!typedElement) return;

    // Use a small timeout to ensure the DOM is fully ready before starting the animation.
    // This helps prevent race conditions in some browser environments.
    setTimeout(() => {
        new TypeIt('#typed', {
            strings: [
                'Full-Stack Developer',
                'JavaScript Enthusiast',
                'Supabase Expert',
                'Creator of Practical & Engaging Web Applications'
            ],
            speed: 50,
            backSpeed: 50,
            loop: true,
            cursorChar: '_',
            waitUntilVisible: true,
            breakLines: false,
        }).go();
    }, 100);
};


// Initialize functions
document.addEventListener('DOMContentLoaded', () => {
    initTypingAnimation();
    navSlide();
    smoothScroll();
    setDynamicYear();
    initTracker();
    loadProjects();
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
