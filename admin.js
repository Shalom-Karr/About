// admin.js
import { supabase } from './supabase-client.js';

// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-button');

// Projects Elements
const projectsList = document.getElementById('projects-list');
const addProjectButton = document.getElementById('add-project-button');
const projectModal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const projectForm = document.getElementById('project-form');
const projectIdInput = document.getElementById('project-id');
const titleInput = document.getElementById('title');
const urlInput = document.getElementById('url');
const descriptionInput = document.getElementById('description');
const selectedTagsContainer = document.getElementById('selected-tags');
const techDropdown = document.getElementById('tech-dropdown');
const newTechInput = document.getElementById('new-tech-input');

// Visitor Logs Elements
const visitorLogsBody = document.getElementById('visitor-logs-body');
const refreshLogsButton = document.getElementById('refresh-logs-button');


// --- State ---
let allTechnologies = [];
let selectedTechnologies = [];


// --- Authentication ---

const verifyAdmin = async (user) => {
    if (!user) return false;

    const { data, error } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', user.email)
        .single();

    if (error || !data) {
        console.error('Authorization failed:', error);
        await supabase.auth.signOut();
        loginError.textContent = 'Access Denied: You are not an authorized admin.';
        return false;
    }

    return true;
};

const handleLogin = async (event) => {
    event.preventDefault();
    loginError.textContent = '';
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginError.textContent = error.message;
        return;
    }

    if (await verifyAdmin(user)) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        await loadInitialData();
    }
};

const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
};

// Check user session on page load
const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && await verifyAdmin(session.user)) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        await loadInitialData();
    }
};


// --- Data Loading ---
const loadInitialData = async () => {
    await Promise.all([
        loadTechnologies(),
        loadProjects(),
        loadVisitorLogs()
    ]);
};

const loadTechnologies = async () => {
    const { data, error } = await supabase.from('technologies').select('name');
    if (error) {
        console.error('Error fetching technologies:', error);
        return;
    }
    allTechnologies = data.map(t => t.name);
    renderTechDropdown();
};

const loadProjects = async () => {
    const { data, error } = await supabase.from('profile_websites').select('*').order('created_at', { ascending: true });
    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }
    renderProjects(data);
};

const loadVisitorLogs = async () => {
    visitorLogsBody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500">Loading...</td></tr>';
    
    // Attempt to fetch logs
    // ERROR HANDLING NOTE: If you get "column created_at does not exist", 
    // you need to add that column to your Supabase table.
    const { data, error } = await supabase
        .from('page_visits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error loading logs:", error);
        if (error.code === "42703") {
            // Specific error for missing column
            visitorLogsBody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-red-400">Database Error: Missing "created_at" column in "page_visits" table. Please update Supabase.</td></tr>';
        } else {
            visitorLogsBody.innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        }
        return;
    }

    renderVisitorLogs(data);
};


// --- Rendering ---

const renderVisitorLogs = (logs) => {
    visitorLogsBody.innerHTML = '';
    if (logs.length === 0) {
        visitorLogsBody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500">No logs found.</td></tr>';
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-700 transition-colors';
        
        const date = log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A';
        // Safe access to meta in case it's null
        const browser = log.meta?.browser || 'Unknown';
        const os = log.meta?.os || 'Unknown';
        const duration = log.duration_seconds ? `${log.duration_seconds}s` : 'Active/Unfinished';

        row.innerHTML = `
            <td class="px-4 py-3 text-gray-300">${date}</td>
            <td class="px-4 py-3 text-blue-300 font-mono text-xs">${log.ip_address}</td>
            <td class="px-4 py-3 text-gray-400 text-xs">${browser} on ${os}</td>
            <td class="px-4 py-3 text-right text-gray-300">${duration}</td>
        `;
        visitorLogsBody.appendChild(row);
    });
};

const renderProjects = (projects) => {
    projectsList.innerHTML = '';
    if (projects.length === 0) {
        projectsList.innerHTML = '<p class="text-gray-500 text-center py-4">No projects found. Add one to get started!</p>';
        return;
    }

    projects.forEach(project => {
        const projectEl = document.createElement('div');
        projectEl.className = 'bg-gray-700 p-4 rounded-lg flex justify-between items-center border border-gray-600 hover:border-gray-500 transition-colors';
        projectEl.innerHTML = `
            <div>
                <h3 class="text-xl font-bold text-gray-200">${project.title}</h3>
                <a href="${project.url}" target="_blank" class="text-sm text-blue-400 hover:underline">${project.url}</a>
                <div class="mt-1 flex gap-1 flex-wrap">
                    ${project.technologies.map(t => `<span class="text-xs bg-gray-600 px-2 py-0.5 rounded text-gray-300">${t}</span>`).join('')}
                </div>
            </div>
            <div class="flex space-x-2">
                <button class="edit-btn bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1.5 px-3 rounded text-sm transition-colors" data-id="${project.id}">Edit</button>
                <button class="delete-btn bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded text-sm transition-colors" data-id="${project.id}">Delete</button>
            </div>
        `;
        projectsList.appendChild(projectEl);
    });
};

const renderTechDropdown = () => {
    techDropdown.innerHTML = '';
    const unselected = allTechnologies.filter(tech => !selectedTechnologies.includes(tech));
    unselected.forEach(tech => {
        const option = document.createElement('div');
        option.className = 'multi-select-option text-sm text-gray-200';
        option.textContent = tech;
        option.addEventListener('click', () => addTag(tech));
        techDropdown.appendChild(option);
    });
};

const renderSelectedTags = () => {
    selectedTagsContainer.innerHTML = '';
    selectedTechnologies.forEach(tech => {
        const tag = document.createElement('div');
        tag.className = 'tag text-xs';
        tag.innerHTML = `
            <span>${tech}</span>
            <span class="tag-remove text-gray-400 hover:text-white" data-tech="${tech}">&#10005;</span>
        `;
        selectedTagsContainer.appendChild(tag);
    });
};


// --- Modal & Form Logic ---
const openModal = (project = null) => {
    projectForm.reset();
    projectIdInput.value = '';
    selectedTechnologies = [];

    if (project) {
        modalTitle.textContent = 'Edit Project';
        projectIdInput.value = project.id;
        titleInput.value = project.title;
        urlInput.value = project.url;
        descriptionInput.value = project.description;
        selectedTechnologies = project.technologies ? [...project.technologies] : [];
    } else {
        modalTitle.textContent = 'Add Project';
    }

    renderSelectedTags();
    renderTechDropdown();
    projectModal.classList.remove('hidden');
};

const closeModal = () => {
    projectModal.classList.add('hidden');
};

const handleFormSubmit = async (event) => {
    event.preventDefault();

    const projectData = {
        title: titleInput.value,
        url: urlInput.value,
        description: descriptionInput.value,
        technologies: selectedTechnologies
    };

    const id = projectIdInput.value;
    let error;

    if (id) {
        // Update existing project
        const { error: updateError } = await supabase.from('profile_websites').update(projectData).eq('id', id);
        error = updateError;
    } else {
        // Create new project
        const { error: insertError } = await supabase.from('profile_websites').insert([projectData]);
        error = insertError;
    }

    if (error) {
        alert('Error saving project: ' + error.message);
    } else {
        closeModal();
        await loadProjects();
    }
};

const handleDeleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const { error } = await supabase.from('profile_websites').delete().eq('id', id);

    if (error) {
        alert('Error deleting project: ' + error.message);
    } else {
        await loadProjects();
    }
};

const handleEditProject = async (id) => {
    const { data, error } = await supabase.from('profile_websites').select('*').eq('id', id).single();
    if (error) {
        alert('Error fetching project details: ' + error.message);
        return;
    }
    openModal(data);
};


// --- Technologies Multi-Select Logic ---
const addTag = (tech) => {
    if (!selectedTechnologies.includes(tech)) {
        selectedTechnologies.push(tech);
        renderSelectedTags();
        renderTechDropdown();
        techDropdown.classList.add('hidden');
    }
};

const removeTag = (tech) => {
    selectedTechnologies = selectedTechnologies.filter(t => t !== tech);
    renderSelectedTags();
    renderTechDropdown();
};

const handleAddNewTech = async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const newTech = newTechInput.value.trim();
        if (newTech && !allTechnologies.includes(newTech)) {
            const { error } = await supabase.from('technologies').insert([{ name: newTech }]);
            if (error) {
                alert('Error adding new technology: ' + error.message);
                return;
            }
            allTechnologies.push(newTech);
            addTag(newTech);
            newTechInput.value = '';
        } else if (newTech) {
            // If tech already exists, just add it
            addTag(newTech);
            newTechInput.value = '';
        }
    }
};


// --- Event Listeners ---
loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);
addProjectButton.addEventListener('click', () => openModal());
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
projectForm.addEventListener('submit', handleFormSubmit);
refreshLogsButton.addEventListener('click', loadVisitorLogs);

projectsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        handleDeleteProject(e.target.dataset.id);
    }
    if (e.target.classList.contains('edit-btn')) {
        handleEditProject(e.target.dataset.id);
    }
});

// For the multi-select dropdown
selectedTagsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-remove')) {
        removeTag(e.target.dataset.tech);
    } else {
        techDropdown.classList.toggle('hidden');
    }
});

newTechInput.addEventListener('keydown', handleAddNewTech);

// Close dropdown if clicking outside
document.addEventListener('click', (e) => {
    if (!selectedTagsContainer.contains(e.target) && !techDropdown.contains(e.target)) {
        techDropdown.classList.add('hidden');
    }
});


// --- Initial Load ---
checkSession();