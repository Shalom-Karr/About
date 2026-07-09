#!/usr/bin/env node
/**
 * Bakes three things into index.html before Tailwind runs:
 *   1. An inline SVG <symbol> sprite for the skill icons (replaces a 1.6 MB icon font).
 *   2. The skills grid itself, generated from SKILL_GROUPS below.
 *   3. The project cards, fetched from Supabase (replaces a runtime fetch + CDN client).
 *
 * The sprite is derived from SKILL_GROUPS, so it can only ever contain icons that are
 * actually rendered — add a skill here and both the card and its symbol appear.
 *
 * All three are written between HTML comment markers and are safe to re-run. If Supabase
 * is unreachable the existing project markup is left untouched, so a network blip at
 * build time can never ship an empty portfolio.
 */
const fs = require('fs');
const path = require('path');
const simpleIcons = require('simple-icons');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');

const SUPABASE_URL = 'https://qvoxpfigbukidlmshiei.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2b3hwZmlnYnVraWRsbXNoaWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTM2OTEsImV4cCI6MjA2NTg2OTY5MX0.CEbyeIw6QiMxbLBhU7x7Re7SL_unWJMyaJQPS9y-k60';

// [label, simple-icons export, accent colour]
//
// The accent is chosen here rather than taken from simple-icons: several brands ship a
// near-black hex (Java/OpenJDK, Angular, Ember, Three.js, Discourse, SQLite) that would
// be invisible against the dark background.
const SKILL_GROUPS = [
    {
        title: 'Languages',
        items: [
            ['JavaScript', 'siJavascript', '#F7DF1E'],
            ['TypeScript', 'siTypescript', '#3178C6'],
            ['Python',     'siPython',     '#3776AB'],
            ['Go',         'siGo',         '#00ADD8'],
            ['Ruby',       'siRuby',       '#CC342D'],
            ['Kotlin',     'siKotlin',     '#7F52FF'],
            ['C',          'siC',          '#A8B9CC'],
            ['Java',       'siOpenjdk',    '#E76F00'],
            ['HTML5',      'siHtml5',      '#E34F26'],
            ['CSS',        'siCss',        '#3D8FD1'],
        ],
    },
    {
        title: 'Frontend & Frameworks',
        items: [
            ['Tailwind',  'siTailwindcss', '#06B6D4'],
            ['Sass/SCSS', 'siSass',        '#CC6699'],
            ['Angular',   'siAngular',     '#E23237'],
            ['Ember.js',  'siEmberdotjs',  '#E04E39'],
            ['Alpine.js', 'siAlpinedotjs', '#8BC0D0'],
            ['Vite',      'siVite',        '#9135FF'],
            ['Three.js',  'siThreedotjs',  '#D1D5DB'],
            ['PWA',       'siPwa',         '#8B5CF6'],
        ],
    },
    {
        title: 'Backend, Data & Platform',
        items: [
            ['Node.js',     'siNodedotjs',          '#5FA04E'],
            ['Supabase',    'siSupabase',           '#3FCF8E'],
            ['PostgreSQL',  'siPostgresql',         '#6C8EF5'],
            ['SQLite',      'siSqlite',             '#4FA6D8'],
            ['MySQL',       'siMysql',              '#4479A1'],
            ['Flask',       'siFlask',              '#3BABC3'],
            ['Cloudflare',  'siCloudflare',         '#F38020'],
            ['Workers',     'siCloudflareworkers',  '#F6821F'],
            ['WebAssembly', 'siWebassembly',        '#7C6BF5'],
            ['Netlify',     'siNetlify',            '#00C7B7'],
        ],
    },
    {
        title: 'Libraries, Data & AI',
        items: [
            ['Chart.js',  'siChartdotjs',   '#FF6384'],
            ['Pandas',    'siPandas',       '#A78BFA'],
            ['NumPy',     'siNumpy',        '#4DABCF'],
            ['Selenium',  'siSelenium',     '#43B02A'],
            ['Gemini',    'siGooglegemini', '#8E75B2'],
            ['Claude',    'siAnthropic',    '#D97757'],
        ],
    },
    {
        title: 'Tooling & Ecosystem',
        items: [
            ['Git',          'siGit',         '#F03C2E'],
            ['NPM',          'siNpm',         '#CB3837'],
            ['Google Cloud', 'siGooglecloud', '#4285F4'],
            ['Discourse',    'siDiscourse',   '#D1D5DB'],
            ['Android',      'siAndroid',     '#3DDC84'],
            ['FFmpeg',       'siFfmpeg',      '#4E9A06'],
        ],
    },
];

const slug = (label) => label.toLowerCase().replace(/[^a-z0-9]/g, '');

const replaceBlock = (html, name, body) => {
    const start = `<!--${name}:START-->`;
    const end = `<!--${name}:END-->`;
    const re = new RegExp(`${start}[\\s\\S]*?${end}`);
    if (!re.test(html)) throw new Error(`Missing ${start} … ${end} markers in index.html`);
    return html.replace(re, `${start}\n${body}\n${end}`);
};

const buildSprite = () => {
    const symbols = SKILL_GROUPS.flatMap(g => g.items).map(([label, exportName]) => {
        const icon = simpleIcons[exportName];
        if (!icon) throw new Error(`simple-icons has no export "${exportName}" (for ${label})`);
        return `<symbol id="i-${slug(label)}" viewBox="0 0 24 24"><path d="${icon.path}"/></symbol>`;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${symbols.join('')}</svg>`;
};

const buildSkills = () => SKILL_GROUPS.map(group => {
    const cards = group.items.map(([label, , brand], i) => {
        // Stagger the reveal across the row, then stop — a long tail of delays reads as lag.
        const delay = Math.min(i, 7) * 35;
        const style = `--brand:${brand}${delay ? `;--reveal-delay:${delay}ms` : ''}`;
        return `                    <div data-reveal style="${style}" class="skill-card card flex flex-col items-center justify-center p-5 text-center">
                        <svg class="skill-icon mb-3" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${slug(label)}"/></svg>
                        <span class="skill-name font-bold text-gray-400 tracking-wide text-xs">${label}</span>
                    </div>`;
    }).join('\n');

    return `                <h3 data-reveal class="skills-group-title">${group.title}</h3>
                <div class="skill-grid mb-14">
${cards}
                </div>`;
}).join('\n\n');

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Must stay byte-identical to projectCardHTML() in script.js, or the client-side
// revalidation will repaint the grid on every load.
const projectCardHTML = (p) => {
    const tags = (p.technologies || [])
        .map(t => `<span class="tech-pill">${escapeHtml(t)}</span>`).join('');
    return `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" class="project-card card group" style="--brand:#3b82f6">
  <div class="flex justify-between items-start mb-6">
    <div class="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50 group-hover:border-blue-500/30 transition-colors">
      <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
    </div>
    <svg class="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
  </div>
  <h3 class="text-2xl font-extrabold mb-4 text-gray-100 group-hover:text-blue-400 transition-colors tracking-tight leading-tight">${escapeHtml(p.title)}</h3>
  <p class="project-desc text-gray-400 mb-8 leading-relaxed text-sm grow">${escapeHtml(p.description)}</p>
  <div class="mt-auto pt-6 border-t border-gray-700/40 group-hover:border-blue-500/20 transition-colors">
    <div class="flex flex-wrap gap-2">${tags}</div>
  </div>
</a>`;
};

const fetchProjects = async () => {
    const url = `${SUPABASE_URL}/rest/v1/profile_websites?select=title,url,description,technologies&order=created_at.desc`;
    const res = await fetch(url, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Supabase responded ${res.status} ${res.statusText}`);
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Supabase returned no projects');
    return rows;
};

const main = async () => {
    let html = fs.readFileSync(INDEX, 'utf8');

    const iconCount = SKILL_GROUPS.reduce((n, g) => n + g.items.length, 0);
    html = replaceBlock(html, 'ICONS', buildSprite());
    html = replaceBlock(html, 'SKILLS', buildSkills());
    console.log(`prerender: inlined ${iconCount} SVG icons across ${SKILL_GROUPS.length} skill groups`);

    try {
        const projects = await fetchProjects();
        html = replaceBlock(html, 'PROJECTS', projects.map(projectCardHTML).join('\n'));
        console.log(`prerender: baked ${projects.length} project cards`);
    } catch (err) {
        console.warn(`prerender: WARNING — keeping existing project markup (${err.message})`);
    }

    fs.writeFileSync(INDEX, html);
    console.log('prerender: wrote index.html');
};

main().catch(err => {
    console.error('prerender failed:', err);
    process.exit(1);
});
