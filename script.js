// Todo List Application
class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.initializeApp();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
        this.applyTheme();
    }

    initializeApp() {
        // Get DOM elements
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.recurringCheck = document.getElementById('recurringCheck');
        this.searchInput = document.getElementById('searchInput');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.themeToggle = document.getElementById('themeToggle');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
    }

    bindEvents() {
        // Add task events
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Search and filter events
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderTasks();
        });

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: Date.now(),
            text: text,
            priority: this.prioritySelect.value,
            completed: false,
            recurring: this.recurringCheck.checked,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.clearInputs();
        this.showNotification('Task added successfully!', 'success');
    }

    clearInputs() {
        this.taskInput.value = '';
        this.prioritySelect.value = 'low';
        this.recurringCheck.checked = false;
        this.taskInput.focus();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Task completed!' : 'Task marked as pending';
            this.showNotification(message, task.completed ? 'success' : 'info');
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted successfully!', 'info');
        }
    }

    setActiveFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button state
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        this.renderTasks();
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        // Apply priority filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(task => task.priority === this.currentFilter);
        }

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(this.searchQuery)
            );
        }

        return filtered;
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = '';
            this.emptyState.classList.add('show');
            return;
        }

        this.emptyState.classList.remove('show');
        
        this.taskList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        
        // Bind task-specific events
        this.bindTaskEvents();
    }

    createTaskHTML(task) {
        const priorityClass = `priority-${task.priority}`;
        const completedClass = task.completed ? 'completed' : '';
        const checkedAttr = task.completed ? 'checked' : '';
        
        return `
            <div class="task-item ${priorityClass} ${completedClass}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="todoApp.toggleTask(${task.id})"></div>
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="priority-badge ${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                        ${task.recurring ? '<span class="recurring-badge"><i class="fas fa-redo"></i> Recurring</span>' : ''}
                        <span class="task-date">${this.formatDate(task.createdAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="todoApp.editTask(${task.id})" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="todoApp.deleteTask(${task.id})" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    bindTaskEvents() {
        // Task checkboxes
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newText = prompt('Edit task:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        const icon = this.themeToggle.querySelector('i');
        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
            this.themeToggle.title = 'Switch to light mode';
        } else {
            icon.className = 'fas fa-moon';
            this.themeToggle.title = 'Switch to dark mode';
        }
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'}-color);
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getPriorityLabel(priority) {
        const labels = {
            low: '🟢 Low',
            medium: '🟡 Medium',
            high: '🔴 High'
        };
        return labels[priority] || priority;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});

// Add some sample tasks for demonstration
document.addEventListener('DOMContentLoaded', () => {
    // Check if this is the first time loading the app
    if (localStorage.getItem('tasks') === null) {
        const sampleTasks = [
            {
                id: Date.now() - 3,
                text: 'Complete project documentation',
                priority: 'high',
                completed: false,
                recurring: false,
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: Date.now() - 2,
                text: 'Review code changes',
                priority: 'medium',
                completed: true,
                recurring: false,
                createdAt: new Date(Date.now() - 43200000).toISOString()
            },
            {
                id: Date.now() - 1,
                text: 'Weekly team meeting',
                priority: 'low',
                completed: false,
                recurring: true,
                createdAt: new Date(Date.now() - 21600000).toISOString()
            }
        ];
        
        localStorage.setItem('tasks', JSON.stringify(sampleTasks));
        
        // Reload the app to show sample tasks
        if (window.todoApp) {
            window.todoApp.tasks = sampleTasks;
            window.todoApp.renderTasks();
            window.todoApp.updateStats();
        }
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (window.todoApp) {
            window.todoApp.addTask();
        }
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            if (window.todoApp) {
                window.todoApp.searchQuery = '';
                window.todoApp.renderTasks();
            }
        }
    }
});

// Add some CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        font-family: inherit;
        font-weight: 500;
    }
    
    .notification i {
        font-size: 1.1rem;
    }
    
    .notification-success i {
        color: var(--success-color);
    }
    
    .notification-warning i {
        color: var(--warning-color);
    }
    
    .notification-error i {
        color: var(--danger-color);
    }
    
    .notification-info i {
        color: var(--primary-color);
    }
`;
document.head.appendChild(notificationStyles);
