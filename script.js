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
    if (!projectsGrid) {
        console.error("Could not find #projects-grid element.");
        return;
    }

    try {
        const { data: projects, error } = await supabase
            .from('profile_websites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching projects from Supabase:', error);
            projectsGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Failed to load projects. Please try again later.</p>';
            return;
        }

        if (projects.length === 0) {
            projectsGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full">No projects to display at the moment.</p>';
            return;
        }

        // 2. Clear placeholder and create a card for each project
        projectsGrid.innerHTML = '';
        projects.forEach((project, index) => {
            const card = document.createElement('a');
            card.href = project.url;
            card.target = '_blank';
            card.className = 'bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col hover:bg-gray-700 transition-colors duration-300';

            // Add AOS animation attributes
            card.setAttribute('data-aos', 'fade-up');
            card.setAttribute('data-aos-delay', `${(index % 3 + 1) * 100}`); // Stagger animation

            // Create technologies spans
            const techSpans = project.technologies.map(tech =>
                `<span class="text-xs font-semibold">${tech}</span>`
            ).join('');

            card.innerHTML = `
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
            `;

            projectsGrid.appendChild(card);
        });
    } catch (e) {
        console.error('A critical exception occurred in loadProjects:', e);
        projectsGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Failed to load projects. Please try again later.</p>';
    }
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
    AOS.init();
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
