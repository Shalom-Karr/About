// START OF FILE script.js
import { initTracker } from './tracker.js';
import { supabase } from './supabase-client.js';

// --- GSAP Animations ---
// Registered via CDN in index.html, but we access it via window.gsap
gsap.registerPlugin(ScrollTrigger);

const initAnimations = () => {
    // 1. Hero Animations (Run immediately on load)
    const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    
    heroTl.to(".hero-anim", {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
    });

    // 2. About Section Animation
    gsap.to(".section-title", {
        scrollTrigger: {
            trigger: "#about",
            start: "top 80%",
        },
        opacity: 1,
        y: 0,
        duration: 0.8
    });

    gsap.to(".about-text", {
        scrollTrigger: {
            trigger: "#about",
            start: "top 75%",
        },
        opacity: 1,
        x: 0,
        duration: 1
    });

    gsap.to(".about-img", {
        scrollTrigger: {
            trigger: "#about",
            start: "top 75%",
        },
        opacity: 1,
        x: 0,
        duration: 1
    });

    // 3. Skills Animation (Staggered Pop)
    gsap.to(".skill-card", {
        scrollTrigger: {
            trigger: "#skills",
            start: "top 75%",
        },
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: {
            each: 0.1,
            from: "random"
        }
    });

    // 4. Contact Animation
    gsap.to(".contact-anim", {
        scrollTrigger: {
            trigger: "#contact",
            start: "top 80%",
        },
        opacity: 1,
        y: 0,
        duration: 0.8
    });
};

// Function specifically to animate project cards AFTER they are loaded
const animateProjects = () => {
    // Kill any existing triggers to prevent conflicts if reloaded
    ScrollTrigger.getAll().filter(t => t.trigger && t.trigger.id === 'projects').forEach(t => t.kill());

    gsap.fromTo(".project-card", 
        { opacity: 0, y: 50 }, // Start state
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out",
            scrollTrigger: {
                id: 'projects',
                trigger: "#projects-grid",
                start: "top 85%", // Trigger when top of grid hits 85% of viewport height
            }
        }
    );
};


// --- Functionality ---

const setupNavigation = () => {
    const header = document.querySelector('header');
    const burgerBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    // 1. Scroll Effect for Glassmorphism
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled-nav');
        } else {
            header.classList.remove('scrolled-nav');
        }
    });

    // 2. Mobile Menu Toggle
    const toggleMenu = () => {
        burgerBtn.classList.toggle('active');
        const isActive = burgerBtn.classList.contains('active');

        if (isActive) {
            // Open Menu
            mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            // Close Menu
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        }
    };

    burgerBtn.addEventListener('click', toggleMenu);

    // 3. Close menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (burgerBtn.classList.contains('active')) {
                toggleMenu();
            }
        });
    });
};


const smoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
};

const setDynamicYear = () => {
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// --- Data Loading ---

const loadProjects = async () => {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;

    try {
        const { data: projects, error } = await supabase
            .from('profile_websites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        projectsGrid.innerHTML = ''; // Clear loading spinner

        if (!projects || projects.length === 0) {
            projectsGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full">No projects to display at the moment.</p>';
            return;
        }

        projects.forEach((project) => {
            const card = document.createElement('a');
            card.href = project.url;
            card.target = '_blank';
            // Add .project-card class for GSAP targeting
            card.className = 'project-card bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col hover:bg-gray-700 transition-colors duration-300 border border-gray-700 hover:border-blue-500 group';

            const techSpans = project.technologies.map(tech =>
                `<span class="text-xs font-semibold bg-gray-900 text-blue-400 px-2 py-1 rounded">${tech}</span>`
            ).join('');

            card.innerHTML = `
                <h3 class="text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">${project.title}</h3>
                <p class="text-gray-400 mb-6 leading-relaxed text-sm">${project.description}</p>
                <div class="mt-auto pt-4 border-t border-gray-700">
                    <div class="flex items-center justify-between">
                        <div class="flex flex-wrap gap-2">
                            ${techSpans}
                        </div>
                        <svg class="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </div>
                </div>
            `;

            projectsGrid.appendChild(card);
        });

        // IMPORTANT: Call animation specifically for these new elements
        animateProjects();

    } catch (e) {
        console.error('Load projects error:', e);
        projectsGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Failed to load projects.</p>';
    }
};

const initTypingAnimation = () => {
    const typedElement = document.getElementById('typed');
    if (!typedElement) return;

    setTimeout(() => {
        new TypeIt('#typed', {
            speed: 50,
            startDelay: 500,
            loop: true,
            cursorChar: '_',
            waitUntilVisible: true,
        })
        .type("Full-Stack Developer")
        .pause(2000)
        .delete()
        .type("JavaScript Enthusiast")
        .pause(2000)
        .delete()
        .type("Supabase Expert")
        .pause(2000)
        .delete()
        .type("Problem Solver")
        .pause(2000)
        .delete()
        .go();
    }, 100); 
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTypingAnimation();
    setupNavigation(); // Updated navigation setup
    smoothScroll();
    setDynamicYear();
    initTracker();
    
    // Initialize Static Animations
    initAnimations();
    
    // Load Dynamic Content (Animations triggered inside)
    loadProjects();
});

// To-Top Button Logic
const toTopButton = document.getElementById('to-top');
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        toTopButton.classList.remove('hidden');
    } else {
        toTopButton.classList.add('hidden');
    }
});