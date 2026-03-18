// START OF FILE script.js
import { initTracker } from './tracker.js';
import { supabase } from './supabase-client.js';

// --- GSAP Animations ---
gsap.registerPlugin(ScrollTrigger);

// --- Particle Hero Canvas ---
const initParticleHero = () => {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let mouse = { x: null, y: null };
    const PARTICLE_COUNT = 120;  // Number of drifting particles
    const LINK_DISTANCE = 120;   // Max px between particles to draw a connecting line
    const MOUSE_DISTANCE = 150;  // Max px from cursor to draw a mouse connection line

    const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    canvas.parentElement.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
    }));

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(96, 165, 250, 0.6)';
            ctx.fill();
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < LINK_DISTANCE) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(96, 165, 250, ${1 - dist / LINK_DISTANCE})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
            if (mouse.x !== null) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_DISTANCE) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${1 - dist / MOUSE_DISTANCE})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    };
    animate();
};

// --- Magnetic Buttons ---
const initMagneticButtons = () => {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
        });
    });
};

// --- Text Scramble ---
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    setText(newText) {
        const old = this.el.innerText;
        const length = Math.max(old.length, newText.length);
        const promise = new Promise(resolve => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = old[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 10);
            const end = start + Math.floor(Math.random() * 15);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0; i < this.queue.length; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span style="opacity:0.4">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

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
        { scrollTrigger: { trigger: "#about", start: "top 80%", onEnter: () => {
            const el = document.querySelector('.section-title');
            if (el) new TextScramble(el).setText(el.innerText);
        }}, opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }
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
    gsap.fromTo("#skills-header",
        { opacity: 0, y: 50 },
        { scrollTrigger: { trigger: "#skills-header", start: "top 85%", onEnter: () => {
            const el = document.querySelector('#skills-description');
            if (el) new TextScramble(el).setText(el.innerText);
        }}, opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );

    gsap.fromTo(".skill-card", 
        { opacity: 0, scale: 0.5, rotationY: 45 },
        {
            scrollTrigger: { trigger: "#skills-header", start: "top 75%" },
            opacity: 1, scale: 1, rotationY: 0, duration: 0.6,
            stagger: { each: 0.05, from: "random" },
            ease: "back.out(2)"
        }
    );

    // 4. Projects Header Animation
    gsap.fromTo("#projects-header",
        { opacity: 0, y: 50 },
        { scrollTrigger: { trigger: "#projects-header", start: "top 85%", onEnter: () => {
            const el = document.querySelector('#projects-description');
            if (el) new TextScramble(el).setText(el.innerText);
        }}, opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );

    // 5. Blog Section Animations
    gsap.fromTo("#blog-header",
        { opacity: 0, y: 50 },
        { scrollTrigger: { trigger: "#blog-header", start: "top 85%" }, opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );

    gsap.fromTo("#blog-features",
        { opacity: 0, y: 50 },
        { scrollTrigger: { trigger: "#blog-features", start: "top 85%" }, opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power3.out" }
    );

    gsap.fromTo("#blog-cta",
        { opacity: 0, y: 30, scale: 0.95 },
        { scrollTrigger: { trigger: "#blog-cta", start: "top 85%" }, opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.4, ease: "back.out(1.5)" }
    );

    // 6. Contact Animation
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
            
            // Smoothly move the ring using GSAP. 
            // Note: Since we already use transform: translate(-50%, -50%) in CSS, 
            // we must use left/top here instead of x/y to prevent transform conflicts.
            gsap.to(cursorRing, {
                left: e.clientX,
                top: e.clientY,
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
    
    // Elements for ScrollSpy
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // 1. Glass Nav background
        if (scrollY > 20) {
            header.classList.add('scrolled-nav');
        } else {
            header.classList.remove('scrolled-nav');
        }
        
        // 2. ScrollSpy Logic
        let currentSectionId = '';
        
        // Use an offset so it highlights before you perfectly hit the top
        const spyOffset = scrollY + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (spyOffset >= sectionTop && spyOffset < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        // Loop through desktop links to apply active styling
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href.startsWith('#')) return; // Skip external links like /blog/
            
            const targetId = href.substring(1);
            const indicator = link.querySelector('.nav-indicator');
            
            if (targetId === currentSectionId) {
                link.classList.remove('text-gray-300');
                link.classList.add('text-white');
                if(indicator) indicator.classList.add('w-full');
            } else {
                link.classList.add('text-gray-300');
                link.classList.remove('text-white');
                if(indicator) indicator.classList.remove('w-full');
            }
        });
    });

    const toggleMenu = () => {
        burgerBtn.classList.toggle('active');
        const body = document.body;

        if (burgerBtn.classList.contains('active')) {
            mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
            body.classList.add('menu-open');
            // Add a small delay before showing menu items for better effect
            setTimeout(() => {
                mobileMenu.style.transform = 'scale(1)';
            }, 10);
        } else {
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
            body.classList.remove('menu-open');
            mobileMenu.style.transform = 'scale(0.95)';
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

          // Ultra-Premium Project Card Classes
          card.className = 'project-card spotlight-card tilt-card glare-effect glow-border frosted-glass relative rounded-2xl shadow-2xl p-8 flex flex-col transition-all duration-500 border border-gray-700/50 hover:border-blue-500/40 group overflow-hidden';
          const techSpans = project.technologies.map(tech =>
              `<span class="text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full backdrop-blur-sm relative z-10 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-300 group-hover:border-blue-400/40">${tech}</span>`
          ).join('');

          card.innerHTML = `
              <!-- Animated Glowing Top Border -->
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"></div>

              <div class="relative z-10 flex flex-col h-full">
                  <!-- Icon & Arrow Row -->
                  <div class="flex justify-between items-start mb-6">
                      <div class="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50 shadow-inner group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors duration-500">
                          <!-- Code Icon -->
                          <svg class="w-6 h-6 text-blue-400 opacity-80 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                          </svg>
                      </div>
                      <!-- External Link Arrow -->
                      <div class="p-2 rounded-full bg-transparent group-hover:bg-gray-800/50 transition-colors duration-300">
                          <svg class="w-5 h-5 text-gray-500 group-hover:text-blue-400 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                          </svg>
                      </div>
                  </div>

                  <!-- Content -->
                  <h3 class="text-2xl font-extrabold mb-4 text-gray-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300 tracking-tight leading-tight">${project.title}</h3>

                  <p class="text-gray-400 mb-8 leading-relaxed text-sm flex-grow">${project.description}</p>

                  <!-- Footer Tech Tags -->
                  <div class="mt-auto pt-6 border-t border-gray-700/40 group-hover:border-blue-500/20 transition-colors duration-500">
                      <div class="flex flex-wrap gap-2">
                          ${techSpans}
                      </div>
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
    // 1. Existing Subtitle Loop
    const typedElement = document.getElementById('typed');
    if (typedElement) {
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
    }

    // 2. Advanced Terminal Injection
    const terminalBody = document.getElementById('terminal-body');
    if (terminalBody) {
        setTimeout(() => {
            new TypeIt('#terminal-body', {
                speed: 30,
                startDelay: 1000,
                waitUntilVisible: true,
                cursorChar: '█',
                cursor: true,
            })
            .type('<span class="text-green-400">user@shalomkarr</span>:<span class="text-blue-400">~</span>$ ')
            .pause(500)
            .type('cat intro.txt')
            .break()
            .pause(300)
            .type('<br/>') // Blank line
            .type('I engineer high-performance web applications and digital infrastructure.<br/>')
            .pause(500)
            .type('Specializing in <span class="text-[#F7DF1E] font-semibold">JavaScript</span>, <span class="text-[#3ECF8E] font-semibold">Supabase</span>, and serverless architecture.<br/>')
            .pause(800)
            .type('<br/><span class="text-green-400">user@shalomkarr</span>:<span class="text-blue-400">~</span>$ ')
            .pause(800)
            .type('ls -la ./skills')
            .break()
            .pause(400)
            .type('<br/>') // Blank line
            .type('<span class="text-blue-300">drwxr-xr-x</span>  <span class="text-gray-400">frontend/</span>      <span class="text-gray-500">(React, Alpine, Tailwind)</span><br/>')
            .pause(200)
            .type('<span class="text-blue-300">drwxr-xr-x</span>  <span class="text-gray-400">backend/</span>       <span class="text-gray-500">(Node.js, Python, PostgreSQL)</span><br/>')
            .pause(200)
            .type('<span class="text-blue-300">drwxr-xr-x</span>  <span class="text-gray-400">integrations/</span>  <span class="text-gray-500">(GCP, OAuth 2.0, Stripe)</span><br/>')
            .pause(800)
            .type('<br/><span class="text-green-400">user@shalomkarr</span>:<span class="text-blue-400">~</span>$ ')
            .pause(800)
            .type('./run_deployment.sh')
            .break()
            .pause(300)
            .type('<br/>') // Blank line
            .type('<span class="text-green-500">✔</span> Compiling assets... [OK]<br/>')
            .pause(200)
            .type('<span class="text-green-500">✔</span> Establishing secure OAuth tunnels... [OK]<br/>')
            .pause(200)
            .type('<span class="text-green-500">✔</span> Booting Supabase Edge Functions... [OK]<br/>')
            .pause(200)
            .type('<span class="text-green-500">✔</span> Connecting Google Apps Script Webhooks... [OK]<br/>')
            .pause(200)
            .type('<span class="text-green-500">✔</span> Dispatching GroupMe notifications... [OK]<br/>')
            .pause(200)
            .type('<span class="text-green-500">✔</span> Deploying to Edge network... [OK]<br/>')
            .pause(400)
            .type('<br/><span class="text-blue-400">ℹ</span> Systems online and fully operational.<br/>')
            .pause(500)
            .type('<br/><span class="text-green-400">user@shalomkarr</span>:<span class="text-blue-400">~</span>$ ')
            .go();
        }, 500);
    }
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
    initParticleHero();
    initMagneticButtons();
    
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