document.addEventListener('DOMContentLoaded', () => {
    // Initialize state
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const themeColors = JSON.parse(localStorage.getItem('themeColors')) || {
        primary: '#2ecc71',
        background: '#f5f5f5',
        sidebar: '#f5f5f5'
    };

    // DOM Elements
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const tasksList = document.getElementById('tasks-list');
    const addTaskBtn = document.getElementById('add-task');
    const taskModal = document.getElementById('task-modal');
    const deleteModal = document.getElementById('delete-confirm-modal');
    const colorInputs = {
        primary: document.getElementById('primary-color'),
        background: document.getElementById('background-color'),
        sidebar: document.getElementById('sidebar-color')
    };

    // Initialize theme colors
    function applyThemeColors() {
        document.documentElement.style.setProperty('--primary-color', themeColors.primary);
        document.documentElement.style.setProperty('--background-color', themeColors.background);
        document.documentElement.style.setProperty('--sidebar-color', themeColors.sidebar);

        // Update color inputs
        colorInputs.primary.value = themeColors.primary;
        colorInputs.background.value = themeColors.background;
        colorInputs.sidebar.value = themeColors.sidebar;
    }

    // Sidebar functionality
    function handleSidebarState(isMobile) {
        if (isMobile) {
            sidebar.classList.add('collapsed');
        }
    }

    handleSidebarState(mediaQuery.matches);

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    mediaQuery.addEventListener('change', (e) => {
        handleSidebarState(e.matches);
    });

    // Page navigation
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const pages = document.querySelectorAll('.page');

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            
            // Remove active class from all sidebar items and add to clicked one
            sidebarItems.forEach(si => si.classList.remove('active'));
            item.classList.add('active');
            
            // Show the selected page and hide others
            pages.forEach(page => {
                if (page.id === pageId + '-page') {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
    
            // Close sidebar on mobile after selection
            if (mediaQuery.matches) {
                sidebar.classList.add('collapsed');
            }
        });
    });

    // Task Management
    function renderTasks() {
        tasksList.innerHTML = '';
        tasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskElement.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} data-index="${index}">
                    <label>${task.text}</label>
                    <div class="task-details">
                        <span>${task.date}</span>
                        <span>${task.startTime} - ${task.endTime}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-button" data-index="${index}">✏️</button>
                    <button class="delete-button" data-index="${index}">🗑️</button>
                </div>
            `;
            tasksList.appendChild(taskElement);
        });
        saveTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Task Modal Handling
    addTaskBtn.addEventListener('click', () => {
        document.getElementById('task-input').value = '';
        document.getElementById('task-date').value = '';
        document.getElementById('start-time').value = '';
        document.getElementById('end-time').value = '';
        taskModal.classList.add('active');
    });

    // Single event listener for save task
    document.getElementById('save-task').addEventListener('click', () => {
        const taskText = document.getElementById('task-input').value.trim();
        const taskDate = document.getElementById('task-date').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;

        if (taskText) {
            const editIndex = taskModal.dataset.editIndex;
            if (editIndex !== undefined) {
                tasks[editIndex] = {
                    text: taskText,
                    date: taskDate,
                    startTime: startTime,
                    endTime: endTime,
                    completed: tasks[editIndex].completed
                };
                delete taskModal.dataset.editIndex;
            } else {
                tasks.push({
                    text: taskText,
                    date: taskDate,
                    startTime: startTime,
                    endTime: endTime,
                    completed: false
                });
            }
            renderTasks();
            taskModal.classList.remove('active');
        }
    });

    document.getElementById('cancel-task').addEventListener('click', () => {
        taskModal.classList.remove('active');
    });

    // Task Actions (Delete and Toggle)
    let taskToDelete = null;

    tasksList.addEventListener('click', (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            const index = parseInt(e.target.dataset.index);
            tasks[index].completed = e.target.checked;
            renderTasks();
        } else if (e.target.matches('.delete-button')) {
            taskToDelete = parseInt(e.target.dataset.index);
            deleteModal.classList.add('active');
        } else if (e.target.matches('.edit-button')) {
            const index = parseInt(e.target.dataset.index);
            const task = tasks[index];
            document.getElementById('task-input').value = task.text;
            document.getElementById('task-date').value = task.date;
            document.getElementById('start-time').value = task.startTime;
            document.getElementById('end-time').value = task.endTime;
            taskModal.classList.add('active');
            taskModal.dataset.editIndex = index;
        }
    });

    // Delete confirmation
    document.getElementById('confirm-delete').addEventListener('click', () => {
        if (taskToDelete !== null) {
            tasks.splice(taskToDelete, 1);
            renderTasks();
            deleteModal.classList.remove('active');
            taskToDelete = null;
        }
    });

    document.getElementById('cancel-delete').addEventListener('click', () => {
        deleteModal.classList.remove('active');
        taskToDelete = null;
    });

    // Color settings
    Object.keys(colorInputs).forEach(key => {
        colorInputs[key].addEventListener('change', (e) => {
            themeColors[key] = e.target.value;
            localStorage.setItem('themeColors', JSON.stringify(themeColors));
            applyThemeColors();
        });
    });

    // Initial render
    renderTasks();
    applyThemeColors();
});

// File Organizer functionality
const fileOrganizerPage = document.getElementById('organizer-page');
const dropZone = document.querySelector('.drop-zone');
const processingIndicator = document.querySelector('.processing');

// File type categories
const fileCategories = {
    images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
    documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
    video: ['mp4', 'avi', 'mkv', 'mov', 'wmv'],
    archives: ['zip', 'rar', '7z', 'tar', 'gz'],
    code: ['js', 'html', 'css', 'py', 'java', 'cpp', 'php']
};

if (dropZone) {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drop-zone-active');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drop-zone-active');
        });
    });

    // Handle dropped files
    dropZone.addEventListener('drop', async (e) => {
        const files = e.dataTransfer.files;
        if (files.length === 0) {
            alert('No files were dropped. Please try again.');
            return;
        }

        // Show processing indicator
        processingIndicator.classList.add('active');
        
        try {
            // Validate files
            const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
            const MAX_SIZE = 100 * 1024 * 1024; // 100MB limit
            
            if (totalSize > MAX_SIZE) {
                throw new Error('Total file size exceeds 100MB limit');
            }

            await organizeFiles(files);
            alert('Files have been organized and downloaded successfully!');
        } catch (error) {
            console.error('Error organizing files:', error);
            alert(`Error: ${error.message || 'An error occurred while organizing files. Please try again.'}`);
        } finally {
            processingIndicator.classList.remove('active');
        }
    });
}

async function organizeFiles(files) {
    const organizedFiles = {};

    try {
        // Categorize files
        for (const file of files) {
            const extension = file.name.split('.').pop().toLowerCase();
            let category = 'others';

            // Validate file name
            if (!file.name || file.name.trim() === '') {
                throw new Error('Invalid file name detected');
            }

            for (const [cat, extensions] of Object.entries(fileCategories)) {
                if (extensions.includes(extension)) {
                    category = cat;
                    break;
                }
            }

            if (!organizedFiles[category]) {
                organizedFiles[category] = [];
            }
            organizedFiles[category].push(file);
        }

        // Create zip file
        const zip = new JSZip();

        // Add files to zip by category
        for (const [category, categoryFiles] of Object.entries(organizedFiles)) {
            const folder = zip.folder(category);
            for (const file of categoryFiles) {
                try {
                    const fileContent = await file.arrayBuffer();
                    folder.file(file.name, fileContent);
                } catch (error) {
                    throw new Error(`Failed to process file: ${file.name}`);
                }
            }
        }

        // Generate and download zip
        const content = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(content);
        downloadLink.download = `organized_files_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
    } catch (error) {
        throw error; // Re-throw to be handled by the caller
    }
}
