(function () {
  // API Configuration
  const API_BASE_URL = 'http://localhost:3000/api/admin';
  
  // Elements
  const searchInput = document.getElementById("searchInput");
  const table = document.getElementById("activityTable");
  const tbody = table?.tBodies[0];
  const exportBtn = document.getElementById("exportCsvBtn");
  const statusFilter = document.getElementById("statusFilter");
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  const paginationEl = document.getElementById("pagination");
  const runTestBtn = document.getElementById("runTestBtn");
  
  // Dashboard widgets
  const totalUsersEl = document.querySelector('.total-users p');
  const totalUsersSpan = document.querySelector('.total-users span');
  const activeCoursesEl = document.querySelector('.active-courses p');
  const activeCoursesSpan = document.querySelector('.active-courses span');
  const highscoreEl = document.querySelector('.highscore p');
  const highscoreSpan = document.querySelector('.highscore span');
  const newRegistrationsEl = document.querySelector('.new-registrations p');
  const newRegistrationsSpan = document.querySelector('.new-registrations span');
  
  // Modal
  const editModal = document.getElementById("editModal");
  const modalClose = editModal?.querySelector(".modal-close");
  const modalCancel = document.getElementById("modalCancel");
  const editForm = document.getElementById("editForm");
  const modalUser = document.getElementById("modalUser");
  const modalLesson = document.getElementById("modalLesson");
  const modalScore = document.getElementById("modalScore");
  
  // Sidebar
  const sidebar = document.querySelector(".sidebar");
  const collapseBtn = document.querySelector(".collapse-btn");
  const navLinks = document.querySelectorAll(".nav-menu a");
  const logoutLink = document.querySelector(".logout-link");
  
  // State
  let data = [];
  let filtered = [];
  let currentPage = 1;
  let pageSize = parseInt(pageSizeSelect?.value, 10) || 10;
  let totalPages = 1;
  let editingId = null;
  
  // Responsive
  const MOBILE_WIDTH = 800;
  let isMobileView = window.innerWidth <= MOBILE_WIDTH;
  
  // Connection status
  let isConnected = false;
  let connectionCheckInterval = null;
  const connectionStatusEl = document.getElementById('connectionStatus');

  // Check server connection
  async function checkConnection() {
    try {
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        if (!isConnected) {
          isConnected = true;
          if (connectionStatusEl) {
            connectionStatusEl.classList.add('connected');
            connectionStatusEl.title = 'Connected to server';
          }
          showNotification('Connected to server', 'success');
        }
        return true;
      }
      return false;
    } catch (error) {
      if (isConnected) {
        isConnected = false;
        if (connectionStatusEl) {
          connectionStatusEl.classList.remove('connected');
          connectionStatusEl.title = 'Disconnected from server';
        }
        showNotification('Lost connection to server', 'error');
      } else if (connectionStatusEl) {
        connectionStatusEl.classList.remove('connected');
        connectionStatusEl.title = 'Not connected to server';
      }
      return false;
    }
  }

  // API Helper Functions with retry logic
  async function apiCall(endpoint, options = {}, retries = 3) {
    // Only show connection error on first retry attempt
    if (!isConnected && retries === 3) {
      // Silent check - don't show notification
      try {
        await fetch('http://localhost:3000/api/health', { method: 'GET' });
      } catch {
        // Server not available
      }
    }

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API Error: ${response.statusText} (${response.status})`);
        }
        
        const data = await response.json();
        isConnected = true;
        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - server may be slow or unavailable');
        }
        
        if (i === retries - 1) {
          console.error('API Error:', error);
          if (retries > 1) {
            showNotification(`Error: ${error.message}. Retrying...`, 'error');
          } else {
            showNotification(`Error: ${error.message}`, 'error');
          }
          return null;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return null;
  }
  
  // Load Dashboard Stats
  async function loadDashboardStats() {
    const stats = await apiCall('/dashboard/stats');
    
    if (stats) {
      if (totalUsersEl) {
        totalUsersEl.textContent = stats.totalUsers || 0;
        totalUsersSpan.textContent = `+${stats.newUsersToday || 0} today`;
      }
      
      if (activeCoursesEl) {
        activeCoursesEl.textContent = stats.activeCourses || 0;
        activeCoursesSpan.textContent = 'Active courses';
      }
      
      if (highscoreEl) {
        highscoreEl.textContent = stats.topHighScore || 'Level 1 - No scores yet';
        highscoreSpan.textContent = 'Check Leaderboard';
      }
      
      if (newRegistrationsEl) {
        newRegistrationsEl.textContent = stats.newSignups || 0;
        newRegistrationsSpan.textContent = 'This Week';
      }
    }
  }
  
  // Load Activities
  async function loadActivities() {
    const search = searchInput?.value || '';
    const status = statusFilter?.value || 'all';
    
    const params = new URLSearchParams({
      page: currentPage,
      limit: pageSize,
      search: search,
      status: status
    });
    
    const result = await apiCall(`/activities?${params}`);
    
    if (result) {
      data = result.activities || [];
      totalPages = result.pagination?.totalPages || 1;
      renderTable();
    } else {
      // Fallback to empty state
      data = [];
      renderTable();
    }
  }
  
  // Create Activity
  async function createActivity(activityData) {
    const result = await apiCall('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
    
    if (result) {
      showNotification('Activity created successfully', 'success');
      loadActivities();
      return true;
    }
    return false;
  }
  
  // Update Activity
  async function updateActivity(id, activityData) {
    const result = await apiCall(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activityData)
    });
    
    if (result) {
      showNotification('Activity updated successfully', 'success');
      loadActivities();
      return true;
    }
    return false;
  }
  
  // Delete Activity
  async function deleteActivity(id) {
    const result = await apiCall(`/activities/${id}`, {
      method: 'DELETE'
    });
    
    if (result) {
      showNotification('Activity deleted successfully', 'success');
      loadActivities();
      return true;
    }
    return false;
  }
  
  // Notification System
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#c23a3a' : '#1f1f1f'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Escape HTML
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  
  // Rendering
  function renderTable() {
    if (!table || !tbody) return;
    
    filtered = data.slice();
    
    isMobileView = window.innerWidth <= MOBILE_WIDTH;
    
    const mobileListId = "mobileActivityList";
    let mobileList = document.getElementById(mobileListId);
    
    // MOBILE RENDERING
    if (isMobileView) {
      table.style.display = "none";
      
      if (!mobileList) {
        mobileList = document.createElement("div");
        mobileList.id = mobileListId;
        mobileList.style.display = "grid";
        mobileList.style.gap = "12px";
        table.parentNode.insertBefore(mobileList, table.nextSibling);
      }
      
      mobileList.innerHTML = "";
      
      if (filtered.length === 0) {
        mobileList.innerHTML = '<div style="text-align:center;padding:20px;color:#777">No activities found</div>';
      } else {
        filtered.forEach((r) => {
          const card = document.createElement("div");
          card.className = "mobile-card";
          card.dataset.id = r.id;
          
          card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong>${escapeHtml(r.user)}</strong>
              <small style="color:#bbb">${escapeHtml(r.time)}</small>
            </div>
            <div style="margin:6px 0">
              <em style="color:#ddd">${escapeHtml(r.lesson)}</em>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:var(--accent)">${escapeHtml(r.score)}</span>
              <span class="action-buttons-mobile">
                <button class="btn-small btn-edit" data-id="${r.id}">Edit</button>
                <button class="btn-small btn-remove" data-id="${r.id}">Delete</button>
              </span>
            </div>
          `;
          
          mobileList.appendChild(card);
        });
      }
    } else {
      table.style.display = "";
      if (mobileList) mobileList.remove();
      
      tbody.innerHTML = "";
      
      if (filtered.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = '<td colspan="5" style="text-align:center;padding:20px;color:#777">No activities found</td>';
        tbody.appendChild(tr);
      } else {
        filtered.forEach((r) => {
          const tr = document.createElement("tr");
          tr.dataset.id = r.id;
          
          tr.innerHTML = `
            <td>${escapeHtml(r.user)}</td>
            <td>${escapeHtml(r.lesson)}</td>
            <td>${escapeHtml(r.score)}</td>
            <td>${escapeHtml(r.time)}</td>
          `;
          
          const tdAct = document.createElement("td");
          tdAct.className = "action-buttons";
          
          const editBtn = document.createElement("button");
          editBtn.className = "btn-small btn-edit";
          editBtn.textContent = "Edit";
          editBtn.dataset.id = r.id;
          
          const delBtn = document.createElement("button");
          delBtn.className = "btn-small btn-remove";
          delBtn.textContent = "Delete";
          delBtn.dataset.id = r.id;
          
          tdAct.appendChild(editBtn);
          tdAct.appendChild(delBtn);
          
          tr.appendChild(tdAct);
          tbody.appendChild(tr);
        });
      }
    }
    
    renderPagination();
  }
  
  // Pagination
  function renderPagination() {
    if (!paginationEl) return;
    
    paginationEl.innerHTML = "";
    if (totalPages <= 1) return;
    
    const prev = document.createElement("button");
    prev.textContent = "‹ Prev";
    prev.className = "btn-small";
    prev.disabled = currentPage === 1;
    prev.onclick = () => {
      currentPage = Math.max(1, currentPage - 1);
      loadActivities();
    };
    
    const info = document.createElement("span");
    info.className = "muted";
    info.textContent = `Page ${currentPage} of ${totalPages}`;
    
    const next = document.createElement("button");
    next.textContent = "Next ›";
    next.className = "btn-small";
    next.disabled = currentPage === totalPages;
    next.onclick = () => {
      currentPage = Math.min(totalPages, currentPage + 1);
      loadActivities();
    };
    
    paginationEl.appendChild(prev);
    paginationEl.appendChild(info);
    paginationEl.appendChild(next);
  }
  
  // Table actions
  if (tbody) {
    tbody.addEventListener("click", handleTableAction);
  }
  
  // Mobile actions
  document.addEventListener("click", (e) => {
    const edit = e.target.closest(".mobile-card .btn-edit");
    const del = e.target.closest(".mobile-card .btn-remove");
    
    if (edit || del) {
      const card = e.target.closest(".mobile-card");
      const id = card?.dataset.id;
      
      if (edit && id) {
        openEditModal(id);
      }
      if (del && id && confirm("Delete this activity?")) {
        deleteActivity(id);
      }
    }
  });
  
  function handleTableAction(e) {
    const edit = e.target.closest(".btn-edit");
    const del = e.target.closest(".btn-remove");
    
    if (edit) {
      const id = edit.dataset.id;
      if (id) openEditModal(id);
    }
    
    if (del) {
      const id = del.dataset.id;
      if (id && confirm("Delete this activity?")) {
        deleteActivity(id);
      }
    }
  }
  
  // Search/filter/page size
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadActivities();
      }, 300);
    });
  }
  
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      currentPage = 1;
      loadActivities();
    });
  }
  
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      pageSize = parseInt(pageSizeSelect.value, 10) || 10;
      currentPage = 1;
      loadActivities();
    });
  }
  
  // Sidebar navigation
  if (collapseBtn) {
    collapseBtn.addEventListener("click", () => {
      sidebar?.classList.toggle("open");
    });
  }
  
  // Sidebar navigation links
  navLinks.forEach((link, index) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Remove active class from all
      navLinks.forEach(l => l.parentElement.classList.remove("active"));
      
      // Add active to clicked
      link.parentElement.classList.add("active");
      
      // Handle navigation
      const text = link.textContent.trim();
      if (text.includes("Dashboard")) {
        showDashboard();
      } else if (text.includes("Users")) {
        showUsers();
      } else if (text.includes("Courses")) {
        showCourses();
      } else if (text.includes("Instruments")) {
        showInstruments();
      } else if (text.includes("Analytics")) {
        showAnalytics();
      } else if (text.includes("Settings")) {
        showSettings();
      }
    });
  });
  
  // Logout functionality
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Are you sure you want to logout?")) {
        // Clear any stored data
        localStorage.clear();
        // Redirect to login (adjust path as needed)
        window.location.href = '../login.html';
      }
    });
  }
  
  // Navigation functions
  function showDashboard() {
    document.querySelector('.page-title').textContent = 'Dashboard Overview';
    document.querySelector('.latest-activity').style.display = 'block';
    loadDashboardStats();
    loadActivities();
  }
  
  function showUsers() {
    document.querySelector('.page-title').textContent = 'Users & Gamers';
    document.querySelector('.latest-activity').style.display = 'none';
    showNotification('Users management - Coming soon', 'info');
  }
  
  function showCourses() {
    document.querySelector('.page-title').textContent = 'Courses & Quests';
    document.querySelector('.latest-activity').style.display = 'none';
    showNotification('Courses management - Coming soon', 'info');
  }
  
  function showInstruments() {
    document.querySelector('.page-title').textContent = 'Instruments DB';
    document.querySelector('.latest-activity').style.display = 'none';
    showNotification('Instruments database - Coming soon', 'info');
  }
  
  function showAnalytics() {
    document.querySelector('.page-title').textContent = 'Analytics & Stats';
    document.querySelector('.latest-activity').style.display = 'none';
    showNotification('Analytics dashboard - Coming soon', 'info');
  }
  
  function showSettings() {
    document.querySelector('.page-title').textContent = 'Settings';
    document.querySelector('.latest-activity').style.display = 'none';
    showNotification('Settings - Coming soon', 'info');
  }
  
  // Sidebar close on outside click
  document.addEventListener("click", (e) => {
    if (!isMobileView) return;
    if (!sidebar?.classList.contains("open")) return;
    
    const insideSidebar = e.composedPath().includes(sidebar);
    const toggle = e.target.closest(".collapse-btn");
    
    if (!insideSidebar && !toggle) sidebar.classList.remove("open");
  });
  
  // Resize re-render
  window.addEventListener(
    "resize",
    debounce(() => {
      const wasMobile = isMobileView;
      isMobileView = window.innerWidth <= MOBILE_WIDTH;
      
      if (wasMobile !== isMobileView) renderTable();
    }, 150)
  );
  
  // Debounce
  function debounce(fn, wait = 120) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  
  // CSV export
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        const result = await apiCall('/activities?limit=1000');
        const activities = result?.activities || data;
        
        const rows = [["User", "Lesson", "Score/XP", "Time"]].concat(
          activities.map((r) => [r.user, r.lesson, r.score, r.time])
        );
        
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('CSV exported successfully', 'success');
      } catch (error) {
        showNotification('Error exporting CSV', 'error');
      }
    });
  }
  
  // Modal functions
  function openEditModal(id) {
    const activity = data.find(a => a.id == id);
    if (!activity) return;
    
    editingId = id;
    
    if (modalUser) modalUser.textContent = activity.user;
    if (modalLesson) modalLesson.value = activity.lesson;
    if (modalScore) modalScore.value = activity.score;
    
    showModal();
  }
  
  let lastFocused = null;
  
  function showModal() {
    if (!editModal) return;
    lastFocused = document.activeElement;
    editModal.classList.add("open");
    if (modalLesson) modalLesson.focus();
  }
  
  function closeModal() {
    if (!editModal) return;
    editModal.classList.remove("open");
    editingId = null;
    if (lastFocused) lastFocused.focus();
  }
  
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalCancel) modalCancel.addEventListener("click", closeModal);
  
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (editingId === null) return;
      
      const lesson = modalLesson?.value;
      const score = modalScore?.value;
      
      // Extract XP from score string
      const xpMatch = score.match(/(\d+)/);
      const xp = xpMatch ? parseInt(xpMatch[1]) : 0;
      const completed = score.toLowerCase().includes('completed');
      
      const success = await updateActivity(editingId, {
        lesson,
        score,
        xp,
        completed
      });
      
      if (success) {
        closeModal();
      }
    });
  }
  
  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) closeModal();
    });
  }
  
  // Self test
  if (runTestBtn) {
    runTestBtn.addEventListener("click", async () => {
      showNotification('Running self-test...', 'info');
      
      // Test create
      const createSuccess = await createActivity({
        userId: 1,
        username: "TestUser",
        lesson: "Auto Test",
        score: "+1 XP",
        xp: 1,
        completed: false
      });
      
      if (createSuccess) {
        showNotification('Self-test completed successfully', 'success');
      } else {
        showNotification('Self-test failed', 'error');
      }
    });
  }
  
  // Add CSS animations for notifications
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Initialize
  async function initialize() {
    // Check connection on load
    const connected = await checkConnection();
    
    if (connected) {
      // Load data if connected
      await loadDashboardStats();
      await loadActivities();
      
      // Start periodic connection checks
      connectionCheckInterval = setInterval(async () => {
        await checkConnection();
      }, 30000); // Check every 30 seconds
      
      // Refresh dashboard stats every 30 seconds
      setInterval(loadDashboardStats, 30000);
    } else {
      // Show connection error
      showNotification('Backend server not found. Please start the server on port 3000.', 'error');
      
      // Try to reconnect every 5 seconds
      const reconnectInterval = setInterval(async () => {
        const reconnected = await checkConnection();
        if (reconnected) {
          clearInterval(reconnectInterval);
          initialize(); // Reinitialize on reconnect
        }
      }, 5000);
    }
  }

  // Start initialization
  initialize();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
    }
  });
})();
