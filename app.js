

let tasks = [];
let currentFilter = 'all'; 
let currentCategory = 'all'; 
let currentSort = 'created-desc'; 


// 任务表单元素
const taskTitleInput = document.getElementById('task-title');
const taskDescriptionInput = document.getElementById('task-description');
const taskCategorySelect = document.getElementById('task-category');
const addTaskBtn = document.getElementById('add-task-btn');

// 任务列表和筛选元素
const taskListElement = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const categoryTabs = document.querySelectorAll('.category-tab');
const sortSelect = document.getElementById('sort-select');

// 操作按钮和统计元素
const clearCompletedBtn = document.getElementById('clear-completed');
const totalTasksElement = document.getElementById('total-tasks');
const completedTasksElement = document.getElementById('completed-tasks');
const activeTasksElement = document.getElementById('active-tasks');

/**
 * 初始化应用
 */
function init() {
    // 从本地存储加载任务数据
    loadTasks();
    
    // 绑定添加任务
    addTaskBtn.addEventListener('click', addTask);
    taskTitleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();  // 按下Enter键添加任务
    });
    
    // 绑定搜索事件，实时过滤任务
    searchInput.addEventListener('input', renderTasks);
    
    // 绑定状态筛选按钮事件
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.getAttribute('data-filter');
            updateActiveButton(btn, filterButtons);
            renderTasks();
        });
    });
    
    // 绑定分类标签切换事件
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            currentCategory = tab.getAttribute('data-category');
            updateActiveButton(tab, categoryTabs);
            renderTasks();
        });
    });
    
    
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderTasks();
    });
    
    // 绑定清除已完成任务
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // 初始任务列表和统计信息
    renderTasks();
    updateStats();
}

/**
 * 添加新任务
 */
function addTask() {
    
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const category = taskCategorySelect.value;
    
    
    if (!title) {
        alert('请输入任务标题');
        taskTitleInput.focus(); 
        return;
    }
    
    // 创建新任务对象
    const newTask = {
        id: Date.now().toString(), 
        title,
        description,
        category,
        completed: false, 
        createdAt: new Date().toISOString()
    };
    
    // 添加任务到数组开头（最新的任务显示在前面）
    tasks.unshift(newTask);
    
  
    saveTasks(); // 保存到本地存储
    renderTasks(); // 重新渲染任务列表
    updateStats(); // 更新统计信息
    
    // 清空表单
    taskTitleInput.value = '';
    taskDescriptionInput.value = '';
    taskTitleInput.focus();
}

/**
 * 删除指定ID的任务
 */
function deleteTask(taskId) {
    
    tasks = tasks.filter(task => task.id !== taskId);
    
    saveTasks();
    renderTasks();
    updateStats();
}

/**
 * 切换任务的完成状态
 */
function toggleTaskCompletion(taskId) {
    // 查找指定ID的任务
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        // 切换完成状态
        task.completed = !task.completed;
        
        
        saveTasks();
        renderTasks();
        updateStats();
    }
}

/**
 * 清除所有已完成的任务
 */
function clearCompletedTasks() {
    // 确认对话框，防止误操作
    if (confirm('确定要清除所有已完成的任务吗？')) {
        // 只保留未完成的任务
        tasks = tasks.filter(task => !task.completed);
        
        saveTasks();
        renderTasks();
        updateStats();
    }
}

/**
 * 根据当前筛选条件获取任务列表
 */
function getFilteredTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    
    return tasks.filter(task => {
        // 状态筛选 ， 过滤已完成/未完成任务
        if (currentFilter === 'active' && task.completed) return false;
        if (currentFilter === 'completed' && !task.completed) return false;
        
        // 分类筛选 ， 过滤指定分类
        if (currentCategory !== 'all' && task.category !== currentCategory) return false;
        
        // 关键词搜索 ， 匹配标题或描述
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                             task.description.toLowerCase().includes(searchTerm);
        
        return matchesSearch;
    });
}

/**
 * 对任务列表进行排序
 */
function sortTasks(taskList) {
    
    return [...taskList].sort((a, b) => {
        switch (currentSort) {
            case 'created-asc':
                // 按创建时间升序
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'created-desc':
            default:
                // 按创建时间降序
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
}

/**
 * 渲染任务列表
 */
function renderTasks() {
 
    const filteredTasks = getFilteredTasks();
    // 对任务进行排序
    const sortedTasks = sortTasks(filteredTasks);
    
    // 清空现有任务列表
    taskListElement.innerHTML = '';
    
   
    if (sortedTasks.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'empty-message';
        
        emptyMessage.textContent = searchInput.value ? '没有找到匹配的任务' : '暂无任务，请添加新任务';
        taskListElement.appendChild(emptyMessage);
        return;
    }
    
    // 渲染每个任务
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskListElement.appendChild(taskElement);
    });
}

/**
 * 创建单个任务的DOM元素
 */
function createTaskElement(task) {
    // 创建任务列表项
    const li = document.createElement('li');
    // 设置样式类 ， 根据完成状态添加不同的类
    li.className = `task-item ${task.completed ? 'task-completed' : ''}`;
   
    li.setAttribute('data-id', task.id);
    
    // 格式化创建时间为本地时间字符串
    const formattedDate = new Date(task.createdAt).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // 设置任务HTML内容 - 使用escapeHtml防止XSS攻击
    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <span class="category-badge ${task.category}">${getCategoryName(task.category)}</span>
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
                <span>${formattedDate}</span>
                <div class="task-actions">
                    <button class="delete-btn">删除</button>
                </div>
            </div>
        </div>
    `;

    
    // 绑定事件处理器
    const checkbox = li.querySelector('.task-checkbox');
    const deleteBtn = li.querySelector('.delete-btn');
    
    checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    return li;
}

/**
 * 更新任务统计信息
 */
function updateStats() {
    totalTasksElement.textContent = tasks.length;
    // 计算已完成任务数
    const completedCount = tasks.filter(task => task.completed).length;
    completedTasksElement.textContent = completedCount;
    // 计算未完成任务数
    activeTasksElement.textContent = tasks.length - completedCount;
}

/**
 * 更新活动按钮样式
 */
function updateActiveButton(activeBtn, buttonGroup) {
    // 移除所有按钮的活动状态
    buttonGroup.forEach(btn => btn.classList.remove('active'));
    // 为当前按钮添加活动状态
    activeBtn.classList.add('active');
}

/**
 * 获取分类的显示名称
 */
function getCategoryName(category) {
    const categoryMap = {
        'work': '工作',
        'study': '学习',
        'life': '生活'
    };
    return categoryMap[category] || category; // 默认为分类标识本身
}

/**
 * HTML转义函数，防止XSS攻击
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的安全文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 保存任务数据到本地存储
 */
function saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

/**
 * 从本地存储加载任务数据
 */
function loadTasks() {
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (e) {
            
            console.error('加载任务失败:', e);
            tasks = []; 
        }
    }
}


// 当DOM加载完成后初始化应用
window.addEventListener('DOMContentLoaded', init);