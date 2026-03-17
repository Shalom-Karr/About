// START OF FILE script.js
import { initTracker } from './tracker.js';
import { supabase } from './supabase-client.js';

// --- GSAP Animations ---
gsap.registerPlugin(ScrollTrigger);

const initAnimations = () => {
    // 1. Advanced Hero Animations
    const heroTl = gsap.timeline({ defaults: { ease: "back.out(1.7)" } });
    
    heroTl.fromTo(".hero-anim", 
        { y: 60, opacity: 0, scale: 0.9, rotationX: 15 },
        { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 1.2, stagger: 0.15 }
    );

    // 2. About Section Animation
    gsap.fromTo(".section-title", 
        { opacity: 0, y: 40, scale: 0.8 },
        { scrollTrigger: { trigger: "#about", start: "top 80%" }, opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }
    );

    gsap.fromTo(".about-text", 
        { opacity: 0, x: -80 },
        { scrollTrigger: { trigger: "#about", start: "top 75%" }, opacity: 1, x: 0, duration: 1.2, ease: "power3.out" }
    );

    gsap.fromTo(".about-img", 
        { opacity: 0, x: 80, rotation: 10 },
        { scrollTrigger: { trigger: "#about", start: "top 75%" }, opacity: 1, x: 0, rotation: 0, duration: 1.2, ease: "back.out(1.5)" }
    );

    // 3. Skills Animation (Staggered 3D Pop)
    gsap.fromTo(".skill-card", 
        { opacity: 0, scale: 0.5, rotationY: 45 },
        {
            scrollTrigger: { trigger: "#skills", start: "top 75%" },
            opacity: 1, scale: 1, rotationY: 0, duration: 0.6,
            stagger: { each: 0.05, from: "random" },
            ease: "back.out(2)"
        }
    );

    // 4. Contact Animation
    gsap.fromTo(".contact-anim", 
        { opacity: 0, y: 50 },
        { scrollTrigger: { trigger: "#contact", start: "top 80%" }, opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );
};

// Function specifically to animate project cards AFTER they are loaded
const animateProjects = () => {
    ScrollTrigger.getAll().filter(t => t.trigger && t.trigger.id === 'projects').forEach(t => t.kill());

    gsap.fromTo(".project-card", 
        { opacity: 0, y: 80, scale: 0.9 }, 
        {
            opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.15, ease: "back.out(1.2)",
            scrollTrigger: { id: 'projects', trigger: "#projects-grid", start: "top 85%" }
        }
    );
};


// --- CUSTOM EFFECTS (Cursor & 3D Cards) ---

const initCustomEffects = () => {
    // 1. Custom Cursor
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    
    if (cursorDot && cursorRing && window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener('mousemove', (e) => {
            // Instantly move the dot
            cursorDot.style.left = `${e.clientX}px`;
            cursorDot.style.top = `${e.clientY}px`;
            
            // Smoothly move the ring using GSAP
            gsap.to(cursorRing, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.15,
                ease: "power2.out"
            });
        });

        // Add hover states for all interactive elements
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, .cursor-pointer');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }

    // 2. Global Spotlight Effect for all cards (Skills & Projects)
    document.addEventListener('mousemove', (e) => {
        document.querySelectorAll('.spotlight-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // 3. 3D Tilt Effect for specific cards
    document.addEventListener('mousemove', (e) => {
        document.querySelectorAll('.tilt-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            // Check if mouse is over the card
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const xPos = (e.clientX - rect.left) / rect.width - 0.5;
                const yPos = (e.clientY - rect.top) / rect.height - 0.5;
                const xOffset = yPos * 20; // Max rotation X
                const yOffset = -xPos * 20; // Max rotation Y
                
                gsap.to(card, {
                    rotationX: xOffset,
                    rotationY: yOffset,
                    scale: 1.05,
                    ease: "power2.out",
                    duration: 0.3
                });
            } else {
                // Reset card when mouse leaves
                gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    scale: 1,
                    ease: "power2.out",
                    duration: 0.5
                });
            }
        });
    });
};


// --- Functionality ---

const setupNavigation = () => {
    const header = document.querySelector('header');
    const burgerBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled-nav');
        } else {
            header.classList.remove('scrolled-nav');
        }
    });

    const toggleMenu = () => {
        burgerBtn.classList.toggle('active');
        if (burgerBtn.classList.contains('active')) {
            mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        }
    };

    if(burgerBtn) burgerBtn.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (burgerBtn.classList.contains('active')) toggleMenu();
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
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        });
    });
};

const setDynamicYear = () => {
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
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

        projectsGrid.innerHTML = ''; 

        if (!projects || projects.length === 0) {
            projectsGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full">No projects to display at the moment.</p>';
            return;
        }

        projects.forEach((project) => {
            const card = document.createElement('a');
            card.href = project.url;
            card.target = '_blank';
            // Added tilt-card and spotlight-card for advanced effects
            card.className = 'project-card spotlight-card tilt-card bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col transition-colors duration-300 border border-gray-700 group';

            const techSpans = project.technologies.map(tech =>
                `<span class="text-xs font-semibold bg-gray-900 text-blue-400 px-2 py-1 rounded relative z-10">${tech}</span>`
            ).join('');

            card.innerHTML = `
                <div class="relative z-10">
                    <h3 class="text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">${project.title}</h3>
                    <p class="text-gray-400 mb-6 leading-relaxed text-sm">${project.description}</p>
                </div>
                <div class="mt-auto pt-4 border-t border-gray-700 relative z-10">
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

        // Initialize animations on the new DOM nodes
        animateProjects();

        // Re-bind cursor hover states for dynamically added project cards
        const cursorRing = document.getElementById('cursor-ring');
        if (cursorRing) {
            document.querySelectorAll('.project-card').forEach(el => {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
            });
        }

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
        .type("Digital Infrastructure Specialist")
        .pause(2000).delete()
        .type("Full-Stack Software Engineer")
        .pause(2000).delete()
        .type("JavaScript & Python Expert")
        .pause(2000).delete()
        .type("Automation Architect")
        .pause(2000).delete()
        .go();
    }, 100); 
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTypingAnimation();
    setupNavigation(); 
    smoothScroll();
    setDynamicYear();
    initTracker();
    
    initAnimations();
    initCustomEffects(); // Initialize new mind-blowing effects
    
    loadProjects();
});

// To-Top Button Logic
const toTopButton = document.getElementById('to-top');
if (toTopButton) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            toTopButton.classList.remove('hidden');
        } else {
            toTopButton.classList.add('hidden');
        }
    });
}