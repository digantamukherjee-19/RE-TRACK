/**
 * RE-TRACK — Personal Habit Tracker & To-Do Application
 * Full-stack Client Architecture (Vanilla JS)
 * Reliable Persistent State, Live Calculations, Browser Notifications, Tab Navigation
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // STORAGE KEYS & CONSTANTS
  // -------------------------------------------------------------------------
  const STORAGE_KEYS = {
    USER_PROFILE: 'retrack_user_profile',
    THEME: 'retrack_theme',
    TASKS: 'retrack_tasks',
    HABITS: 'retrack_habits',
    HABIT_LOGS: 'retrack_habit_logs', // Format: { "habitId_YYYY-MM-DD": true }
    NOTIF_DISMISSED: 'retrack_notif_banner_dismissed'
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAY_SHORT_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // -------------------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------------------
  const state = {
    theme: 'light',
    user: {
      name: 'USERNAME'
    },
    // Selected month & year for HOME tab
    homePeriod: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() // 0-indexed
    },
    // Selected month & year for LIST tab
    listPeriod: {
      year: new Date().getFullYear(),
      month: new Date().getMonth()
    },
    // Selected month & year for TRACKER tab
    trackerPeriod: {
      year: new Date().getFullYear(),
      month: new Date().getMonth()
    },
    tasks: [],
    habits: [],
    habitLogs: {}, // Key: `${habitId}_${dateStr}` => boolean
    taskFilter: 'all', // 'all' | 'active' | 'completed'
    activeTab: 'home',
    modalPendingAction: null // For delete confirmations: { type: 'task'|'habit', id: string }
  };

  // -------------------------------------------------------------------------
  // LOCAL STORAGE HELPERS
  // -------------------------------------------------------------------------
  function loadFromStorage(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return fallback;
    }
  }

  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  }

  // -------------------------------------------------------------------------
  // INITIAL DATA SEEDING (FOR FIRST VISIT)
  // -------------------------------------------------------------------------
  function initializeDefaultData() {
    // 1. Theme
    state.theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';

    // 2. User profile
    const profile = loadFromStorage(STORAGE_KEYS.USER_PROFILE, null);
    if (profile && profile.name) {
      state.user.name = profile.name;
    }

    // 3. Tasks
    const savedTasks = loadFromStorage(STORAGE_KEYS.TASKS, null);
    if (savedTasks !== null && Array.isArray(savedTasks)) {
      state.tasks = savedTasks;
    } else {
      // Seed initial helpful tasks for the current month
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(Math.min(now.getDate(), 25)).padStart(2, '0');
      
      state.tasks = [
        {
          id: 'task_' + Date.now() + '_1',
          title: 'Review monthly goal progress',
          description: 'Assess weekly habit consistency and celebrate wins in RE-TRACK.',
          dueDate: `${yyyy}-${mm}-${dd}`,
          reminder: `${yyyy}-${mm}-${dd}T09:00`,
          completed: false,
          notified: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_2',
          title: 'Plan next month milestone targets',
          description: 'Define clear quarterly deliverables.',
          dueDate: `${yyyy}-${mm}-${dd}`,
          reminder: '',
          completed: true,
          notified: false,
          createdAt: new Date().toISOString()
        }
      ];
      saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
    }

    // 4. Habits
    const savedHabits = loadFromStorage(STORAGE_KEYS.HABITS, null);
    if (savedHabits !== null && Array.isArray(savedHabits)) {
      state.habits = savedHabits;
    } else {
      // Seed default foundational habits
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const defaultStartDate = `${yyyy}-${mm}-01`;

      state.habits = [
        {
          id: 'habit_1',
          name: 'Morning Hydration (1L)',
          category: 'wellness',
          startDate: defaultStartDate,
          createdAt: new Date().toISOString()
        },
        {
          id: 'habit_2',
          name: '30 Mins Focused Reading',
          category: 'mindfulness',
          startDate: defaultStartDate,
          createdAt: new Date().toISOString()
        },
        {
          id: 'habit_3',
          name: 'Physical Workout / Mobility',
          category: 'fitness',
          startDate: defaultStartDate,
          createdAt: new Date().toISOString()
        }
      ];
      saveToStorage(STORAGE_KEYS.HABITS, state.habits);
    }

    // 5. Habit Logs
    const savedLogs = loadFromStorage(STORAGE_KEYS.HABIT_LOGS, null);
    if (savedLogs !== null && typeof savedLogs === 'object') {
      state.habitLogs = savedLogs;
    } else {
      // Pre-fill a few initial checked checkboxes for recent days so the user immediately sees live metrics
      state.habitLogs = {};
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();

      // Check a few days for habit_1 and habit_2 up to today
      const sampleDays = [1, Math.min(2, currentDay), Math.min(3, currentDay)];
      sampleDays.forEach(day => {
        if (day <= currentDay) {
          const dateStr = formatDateKey(currentYear, currentMonth, day);
          state.habitLogs[`habit_1_${dateStr}`] = true;
          if (day % 2 === 1) {
            state.habitLogs[`habit_2_${dateStr}`] = true;
          }
        }
      });
      saveToStorage(STORAGE_KEYS.HABIT_LOGS, state.habitLogs);
    }
  }

  // -------------------------------------------------------------------------
  // DATE HELPER UTILITIES
  // -------------------------------------------------------------------------
  function getDaysInMonth(year, month) {
    // month is 0-indexed: month + 1 with day 0 gives last day of target month
    return new Date(year, month + 1, 0).getDate();
  }

  function formatDateKey(year, monthIndex, day) {
    const y = String(year);
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getMonthYearLabel(year, monthIndex) {
    return `${MONTH_NAMES[monthIndex]} ${year}`;
  }

  function isSameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // -------------------------------------------------------------------------
  // THEME SYSTEM & BACKGROUND PRELOADING
  // -------------------------------------------------------------------------
  const THEME_BACKGROUNDS = {
    light: 'assets/lightmode.jpg',
    dark: 'assets/darkmode.jpg'
  };

  function preloadImages() {
    // Preload both themes and the logo to eliminate switching flicker
    ['assets/lightmode.jpg', 'assets/darkmode.jpg', 'assets/logo.png'].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  }

  // -------------------------------------------------------------------------
  // TAB NAVIGATION (Strictly click-based, no scroll spying)
  // -------------------------------------------------------------------------
  function switchTab(tabId) {
    if (!['home', 'list', 'tracker'].includes(tabId)) return;

    state.activeTab = tabId;

    // Update Tab Buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    // Update Tab Panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      const isTarget = pane.id === `tab-${tabId}`;
      pane.classList.toggle('active', isTarget);
    });

    // Refresh views if data changed
    if (tabId === 'home') {
      updateHomeDashboard();
    } else if (tabId === 'list') {
      renderTasksList();
    } else if (tabId === 'tracker') {
      renderHabitTracker();
    }
  }

  // -------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // -------------------------------------------------------------------------
  function showToast(message, type = 'info', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, duration);
  }

  // -------------------------------------------------------------------------
  // BROWSER NOTIFICATIONS ENGINE
  // -------------------------------------------------------------------------
  function setupNotificationSupport() {
    const permBtn = document.getElementById('request-perm-btn');
    const permBtnText = document.getElementById('perm-btn-text');
    const banner = document.getElementById('notification-banner');
    const bannerText = document.getElementById('notification-banner-text');
    const closeBanner = document.getElementById('close-notif-banner');

    if (!('Notification' in window)) {
      if (permBtn) {
        permBtn.disabled = true;
        permBtnText.textContent = 'Alerts Unsupported';
      }
      return;
    }

    function updateUiState() {
      if (Notification.permission === 'granted') {
        if (permBtn) {
          permBtn.classList.replace('btn-secondary', 'btn-ghost');
          permBtnText.textContent = 'Alerts Active ✓';
          permBtn.title = 'Browser notifications are enabled';
        }
        if (banner) banner.classList.add('hidden');
      } else if (Notification.permission === 'denied') {
        if (permBtn) {
          permBtn.disabled = true;
          permBtnText.textContent = 'Alerts Blocked';
        }
        if (banner) {
          banner.classList.remove('hidden');
          bannerText.textContent = 'Notification permission is blocked in browser site settings. Enable notifications in site permissions to receive scheduled alerts.';
        }
      } else {
        // default (unasked)
        if (permBtnText) permBtnText.textContent = 'Enable Notifications';
        const dismissed = localStorage.getItem(STORAGE_KEYS.NOTIF_DISMISSED);
        if (banner && !dismissed) {
          banner.classList.remove('hidden');
        }
      }
    }

    if (permBtn) {
      permBtn.addEventListener('click', async () => {
        try {
          const perm = await Notification.requestPermission();
          updateUiState();
          if (perm === 'granted') {
            showToast('Browser notifications enabled successfully!', 'success');
            // Trigger sample welcoming test notification
            new Notification('RE-TRACK Ready', {
              body: 'You will receive reminders for your scheduled targets and tasks.',
              icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%232563eb"/><text x="50%" y="65%" fill="white" font-size="40" font-family="sans-serif" text-anchor="middle">R</text></svg>'
            });
          } else {
            showToast('Notification permission was not granted.', 'warning');
          }
        } catch (e) {
          console.error('Error requesting notification permission:', e);
        }
      });
    }

    if (closeBanner) {
      closeBanner.addEventListener('click', () => {
        if (banner) banner.classList.add('hidden');
        localStorage.setItem(STORAGE_KEYS.NOTIF_DISMISSED, 'true');
      });
    }

    updateUiState();
  }

  // Active interval check for task reminders
  function startReminderChecker() {
    setInterval(() => {
      checkScheduledReminders();
    }, 15000); // Check every 15 seconds
  }

  function checkScheduledReminders() {
    const now = new Date();
    let updated = false;

    state.tasks.forEach(task => {
      if (task.completed || !task.reminder || task.notified) {
        return;
      }

      const reminderTime = new Date(task.reminder);
      if (reminderTime <= now) {
        // Trigger notification
        triggerTaskNotification(task);
        task.notified = true;
        updated = true;
      }
    });

    if (updated) {
      saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
      if (state.activeTab === 'list') {
        renderTasksList();
      }
    }
  }

  function triggerTaskNotification(task) {
    const title = `Reminder: ${task.title}`;
    const options = {
      body: task.description ? task.description : `Due: ${task.dueDate}`,
      tag: task.id,
      requireInteraction: false
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }

    // Always show in-app toast notification as well
    showToast(`🔔 Reminder: ${task.title}`, 'info', 6000);
  }

  // -------------------------------------------------------------------------
  // USERNAME MANAGEMENT
  // -------------------------------------------------------------------------
  function setupUserGreeting() {
    const nameText = document.getElementById('user-name-text');
    const editBtn = document.getElementById('edit-name-btn');
    const nameDisplay = document.getElementById('user-name-container');
    const form = document.getElementById('user-name-form');
    const input = document.getElementById('user-name-input');
    const cancelBtn = document.getElementById('cancel-name-btn');

    if (!nameText || !form || !input) return;

    nameText.textContent = state.user.name;

    function openNameEditor() {
      nameDisplay.classList.add('hidden');
      form.classList.remove('hidden');
      input.value = state.user.name === 'USERNAME' ? '' : state.user.name;
      input.focus();
    }

    function closeNameEditor() {
      form.classList.add('hidden');
      nameDisplay.classList.remove('hidden');
    }

    nameText.addEventListener('click', openNameEditor);
    if (editBtn) editBtn.addEventListener('click', openNameEditor);

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeNameEditor);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      const newName = val || 'USERNAME';
      state.user.name = newName;
      nameText.textContent = newName;
      saveToStorage(STORAGE_KEYS.USER_PROFILE, state.user);
      closeNameEditor();
      showToast('Username updated!', 'success');
    });
  }

  // -------------------------------------------------------------------------
  // MONTH SELECTORS SETUP (HOME & TRACKER)
  // -------------------------------------------------------------------------
  function populateYearSelectors() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;

    const selectors = ['home-year-select', 'list-year-select', 'tracker-year-select'];
    selectors.forEach(id => {
      const select = document.getElementById(id);
      if (!select) return;
      select.innerHTML = '';
      for (let y = startYear; y <= endYear; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        select.appendChild(opt);
      }
    });
  }

  function setupMonthSelectors() {
    populateYearSelectors();

    // Home Selector Elements
    const homeMonthSelect = document.getElementById('home-month-select');
    const homeYearSelect = document.getElementById('home-year-select');
    const homePrevBtn = document.getElementById('home-prev-month');
    const homeNextBtn = document.getElementById('home-next-month');
    const homeTodayBtn = document.getElementById('home-today-btn');

    // List Selector Elements
    const listMonthSelect = document.getElementById('list-month-select');
    const listYearSelect = document.getElementById('list-year-select');
    const listPrevBtn = document.getElementById('list-prev-month');
    const listNextBtn = document.getElementById('list-next-month');
    const listTodayBtn = document.getElementById('list-today-btn');

    // Tracker Selector Elements
    const trackerMonthSelect = document.getElementById('tracker-month-select');
    const trackerYearSelect = document.getElementById('tracker-year-select');
    const trackerPrevBtn = document.getElementById('tracker-prev-month');
    const trackerNextBtn = document.getElementById('tracker-next-month');

    // Sync Home Inputs with state
    function syncHomeInputs() {
      if (homeMonthSelect) homeMonthSelect.value = state.homePeriod.month;
      if (homeYearSelect) homeYearSelect.value = state.homePeriod.year;
      updateHomeDashboard();
    }

    // Sync List Inputs with state
    function syncListInputs() {
      if (listMonthSelect) listMonthSelect.value = state.listPeriod.month;
      if (listYearSelect) listYearSelect.value = state.listPeriod.year;
      renderTasksList();
    }

    // Sync Tracker Inputs with state
    function syncTrackerInputs() {
      if (trackerMonthSelect) trackerMonthSelect.value = state.trackerPeriod.month;
      if (trackerYearSelect) trackerYearSelect.value = state.trackerPeriod.year;
      renderHabitTracker();
    }

    // Home events
    if (homeMonthSelect && homeYearSelect) {
      homeMonthSelect.addEventListener('change', () => {
        state.homePeriod.month = parseInt(homeMonthSelect.value, 10);
        updateHomeDashboard();
      });
      homeYearSelect.addEventListener('change', () => {
        state.homePeriod.year = parseInt(homeYearSelect.value, 10);
        updateHomeDashboard();
      });
    }

    if (homePrevBtn) {
      homePrevBtn.addEventListener('click', () => {
        if (state.homePeriod.month === 0) {
          state.homePeriod.month = 11;
          state.homePeriod.year -= 1;
        } else {
          state.homePeriod.month -= 1;
        }
        syncHomeInputs();
      });
    }

    if (homeNextBtn) {
      homeNextBtn.addEventListener('click', () => {
        if (state.homePeriod.month === 11) {
          state.homePeriod.month = 0;
          state.homePeriod.year += 1;
        } else {
          state.homePeriod.month += 1;
        }
        syncHomeInputs();
      });
    }

    if (homeTodayBtn) {
      homeTodayBtn.addEventListener('click', () => {
        const now = new Date();
        state.homePeriod.year = now.getFullYear();
        state.homePeriod.month = now.getMonth();
        syncHomeInputs();
      });
    }

    // List events
    if (listMonthSelect && listYearSelect) {
      listMonthSelect.addEventListener('change', () => {
        state.listPeriod.month = parseInt(listMonthSelect.value, 10);
        renderTasksList();
      });
      listYearSelect.addEventListener('change', () => {
        state.listPeriod.year = parseInt(listYearSelect.value, 10);
        renderTasksList();
      });
    }

    if (listPrevBtn) {
      listPrevBtn.addEventListener('click', () => {
        if (state.listPeriod.month === 0) {
          state.listPeriod.month = 11;
          state.listPeriod.year -= 1;
        } else {
          state.listPeriod.month -= 1;
        }
        syncListInputs();
      });
    }

    if (listNextBtn) {
      listNextBtn.addEventListener('click', () => {
        if (state.listPeriod.month === 11) {
          state.listPeriod.month = 0;
          state.listPeriod.year += 1;
        } else {
          state.listPeriod.month += 1;
        }
        syncListInputs();
      });
    }

    if (listTodayBtn) {
      listTodayBtn.addEventListener('click', () => {
        const now = new Date();
        state.listPeriod.year = now.getFullYear();
        state.listPeriod.month = now.getMonth();
        syncListInputs();
      });
    }

    // Tracker events
    if (trackerMonthSelect && trackerYearSelect) {
      trackerMonthSelect.addEventListener('change', () => {
        state.trackerPeriod.month = parseInt(trackerMonthSelect.value, 10);
        renderHabitTracker();
      });
      trackerYearSelect.addEventListener('change', () => {
        state.trackerPeriod.year = parseInt(trackerYearSelect.value, 10);
        renderHabitTracker();
      });
    }

    if (trackerPrevBtn) {
      trackerPrevBtn.addEventListener('click', () => {
        if (state.trackerPeriod.month === 0) {
          state.trackerPeriod.month = 11;
          state.trackerPeriod.year -= 1;
        } else {
          state.trackerPeriod.month -= 1;
        }
        syncTrackerInputs();
      });
    }

    if (trackerNextBtn) {
      trackerNextBtn.addEventListener('click', () => {
        if (state.trackerPeriod.month === 11) {
          state.trackerPeriod.month = 0;
          state.trackerPeriod.year += 1;
        } else {
          state.trackerPeriod.month += 1;
        }
        syncTrackerInputs();
      });
    }

    // Initial sync
    syncHomeInputs();
    syncListInputs();
    syncTrackerInputs();
  }

  // -------------------------------------------------------------------------
  // CALCULATIONS ENGINE (HABITS & TASKS FOR ANY GIVEN MONTH)
  // -------------------------------------------------------------------------
  function calculateHabitsMetricsForMonth(year, monthIndex) {
    const daysInMonth = getDaysInMonth(year, monthIndex);
    let totalApplicable = 0;
    let completedCount = 0;

    // For every habit, determine which days in this month are applicable
    // A habit is applicable on a day if that date >= habit.startDate
    state.habits.forEach(habit => {
      const habitStart = habit.startDate ? new Date(habit.startDate + 'T00:00:00') : new Date('2000-01-01');

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, monthIndex, day);
        // Date comparison at day boundary
        if (currentDate >= habitStart) {
          totalApplicable++;
          const dateKey = formatDateKey(year, monthIndex, day);
          const logKey = `${habit.id}_${dateKey}`;
          if (state.habitLogs[logKey]) {
            completedCount++;
          }
        }
      }
    });

    const percentage = totalApplicable > 0 
      ? Math.round((completedCount / totalApplicable) * 100)
      : 0;

    return {
      totalApplicable,
      completedCount,
      remainingCount: Math.max(0, totalApplicable - completedCount),
      percentage
    };
  }

  function calculateTaskMetricsForMonth(year, monthIndex) {
    const targetMonthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    const monthTasks = state.tasks.filter(t => {
      if (!t.dueDate) return false;
      return t.dueDate.startsWith(targetMonthStr);
    });

    const givenCount = monthTasks.length;
    const completedCount = monthTasks.filter(t => t.completed).length;
    const rate = givenCount > 0 ? Math.round((completedCount / givenCount) * 100) : 0;

    return {
      givenCount,
      completedCount,
      rate
    };
  }

  // -------------------------------------------------------------------------
  // HOME DASHBOARD UPDATE
  // -------------------------------------------------------------------------
  function updateHomeDashboard() {
    const { year, month } = state.homePeriod;

    // Badge label
    const badge = document.getElementById('home-month-display');
    if (badge) {
      badge.textContent = getMonthYearLabel(year, month);
    }

    // Task Metrics
    const taskMetrics = calculateTaskMetricsForMonth(year, month);
    const targetsGivenEl = document.getElementById('stat-targets-given');
    const targetsCompletedEl = document.getElementById('stat-targets-completed');
    const taskRateEl = document.getElementById('stat-task-rate');

    if (targetsGivenEl) {
      targetsGivenEl.textContent = `Targets Given: ${taskMetrics.givenCount}`;
    }
    if (targetsCompletedEl) {
      targetsCompletedEl.textContent = `Targets Completed: ${taskMetrics.completedCount}`;
    }
    if (taskRateEl) {
      taskRateEl.textContent = `${taskMetrics.rate}% completed`;
    }

    // Habit Metrics
    const habitMetrics = calculateHabitsMetricsForMonth(year, month);
    const habitsTrackedEl = document.getElementById('stat-habits-tracked');
    const habitsCountEl = document.getElementById('stat-habits-count');

    if (habitsTrackedEl) {
      habitsTrackedEl.textContent = `Habits Tracked: ${habitMetrics.percentage}%`;
    }
    if (habitsCountEl) {
      habitsCountEl.textContent = state.habits.length > 0 
        ? `${habitMetrics.completedCount} of ${habitMetrics.totalApplicable} habit-days done`
        : 'No habits configured yet';
    }
  }

  // -------------------------------------------------------------------------
  // LIST TAB — TASK MANAGEMENT
  // -------------------------------------------------------------------------
  function renderTasksList() {
    const listContainer = document.getElementById('tasks-list');
    const emptyState = document.getElementById('tasks-empty-state');
    const countAll = document.getElementById('count-all');
    const countActive = document.getElementById('count-active');
    const countCompleted = document.getElementById('count-completed');
    const listMonthDisplay = document.getElementById('list-month-display');
    const listTasksSummary = document.getElementById('list-tasks-summary');

    if (!listContainer) return;

    const { year, month } = state.listPeriod;
    const currentPeriodStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const periodLabel = getMonthYearLabel(year, month);

    if (listMonthDisplay) {
      listMonthDisplay.textContent = periodLabel;
    }

    // Filter tasks belonging to the selected month and year based on dueDate
    const periodTasks = state.tasks.filter(t => {
      if (!t.dueDate) return false;
      return t.dueDate.startsWith(currentPeriodStr);
    });

    // Update counts based on tasks assigned to the selected month and year
    const totalAll = periodTasks.length;
    const totalCompleted = periodTasks.filter(t => t.completed).length;
    const totalActive = totalAll - totalCompleted;

    if (countAll) countAll.textContent = totalAll;
    if (countActive) countActive.textContent = totalActive;
    if (countCompleted) countCompleted.textContent = totalCompleted;

    if (listTasksSummary) {
      listTasksSummary.textContent = `${totalAll} ${totalAll === 1 ? 'task' : 'tasks'} in ${periodLabel}`;
    }

    // Filter by completion status
    let filtered = [...periodTasks];
    if (state.taskFilter === 'active') {
      filtered = filtered.filter(t => !t.completed);
    } else if (state.taskFilter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }

    // Sort: incomplete first, then by dueDate ascending
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    listContainer.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');

      filtered.forEach(task => {
        const item = createTaskItemElement(task);
        listContainer.appendChild(item);
      });
    }
  }

  function createTaskItemElement(task) {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    item.setAttribute('data-id', task.id);

    // Format display dates
    let formattedDate = 'No date set';
    if (task.dueDate) {
      const parts = task.dueDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }

    // Reminder badge
    let reminderBadgeHtml = '';
    if (task.reminder) {
      const rDate = new Date(task.reminder);
      const isPast = rDate <= new Date() && !task.completed;
      const formattedReminder = rDate.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      reminderBadgeHtml = `
        <span class="task-badge ${isPast ? 'badge-reminder-due' : 'badge-reminder'}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          ${isPast ? 'Due: ' : 'Reminder: '} ${formattedReminder}
        </span>
      `;
    }

    item.innerHTML = `
      <label class="task-checkbox-label" title="Toggle completed">
        <input type="checkbox" class="task-checkbox-input" ${task.completed ? 'checked' : ''} aria-label="Mark task '${escapeHtml(task.title)}' as ${task.completed ? 'incomplete' : 'complete'}">
        <span class="task-checkbox-box"></span>
      </label>

      <div class="task-item-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="task-badge badge-date">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Target: ${formattedDate}
          </span>
          ${reminderBadgeHtml}
        </div>
      </div>

      <div class="task-actions">
        <button class="action-icon-btn btn-edit-task" title="Edit task" aria-label="Edit task">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="action-icon-btn btn-delete btn-delete-task" title="Delete task" aria-label="Delete task">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Toggle completion listener
    const chk = item.querySelector('.task-checkbox-input');
    chk.addEventListener('change', () => {
      task.completed = chk.checked;
      saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
      renderTasksList();
      updateHomeDashboard();
    });

    // Edit listener
    const editBtn = item.querySelector('.btn-edit-task');
    editBtn.addEventListener('click', () => {
      openTaskModal(task);
    });

    // Delete listener
    const delBtn = item.querySelector('.btn-delete-task');
    delBtn.addEventListener('click', () => {
      openConfirmModal('task', task.id, `Are you sure you want to delete task "${task.title}"?`);
    });

    return item;
  }

  // Task Modal Functions
  function openTaskModal(taskToEdit = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const titleModal = document.getElementById('task-modal-title');
    const idInput = document.getElementById('task-id-input');
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const dateInput = document.getElementById('task-date-input');
    const reminderInput = document.getElementById('task-reminder-input');
    const completedInput = document.getElementById('task-completed-input');
    const titleError = document.getElementById('task-title-error');
    const dateError = document.getElementById('task-date-error');

    titleError.classList.add('hidden');
    dateError.classList.add('hidden');

    if (taskToEdit) {
      titleModal.textContent = 'Edit Target / Task';
      idInput.value = taskToEdit.id;
      titleInput.value = taskToEdit.title;
      descInput.value = taskToEdit.description || '';
      dateInput.value = taskToEdit.dueDate || '';
      reminderInput.value = taskToEdit.reminder || '';
      completedInput.checked = Boolean(taskToEdit.completed);
    } else {
      titleModal.textContent = 'Add New Target / Task';
      form.reset();
      idInput.value = '';
      
      // Default date to the selected listPeriod's appropriate day (e.g. today if in same month, or 1st of selected month)
      const now = new Date();
      const listY = state.listPeriod.year;
      const listM = state.listPeriod.month;
      let targetDay = 1;
      if (now.getFullYear() === listY && now.getMonth() === listM) {
        targetDay = now.getDate();
      }
      dateInput.value = formatDateKey(listY, listM, targetDay);
      completedInput.checked = false;
    }

    modal.classList.remove('hidden');
    titleInput.focus();
  }

  function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.add('hidden');
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('task-id-input').value;
    const title = document.getElementById('task-title-input').value.trim();
    const desc = document.getElementById('task-desc-input').value.trim();
    const dueDate = document.getElementById('task-date-input').value;
    const reminder = document.getElementById('task-reminder-input').value;
    const completed = document.getElementById('task-completed-input').checked;

    const titleError = document.getElementById('task-title-error');
    const dateError = document.getElementById('task-date-error');

    let isValid = true;
    if (!title) {
      titleError.classList.remove('hidden');
      isValid = false;
    } else {
      titleError.classList.add('hidden');
    }

    if (!dueDate) {
      dateError.classList.remove('hidden');
      isValid = false;
    } else {
      dateError.classList.add('hidden');
    }

    if (!isValid) return;

    if (id) {
      // Edit existing
      const taskIndex = state.tasks.findIndex(t => t.id === id);
      if (taskIndex !== -1) {
        const oldReminder = state.tasks[taskIndex].reminder;
        state.tasks[taskIndex].title = title;
        state.tasks[taskIndex].description = desc;
        state.tasks[taskIndex].dueDate = dueDate;
        state.tasks[taskIndex].reminder = reminder;
        state.tasks[taskIndex].completed = completed;
        // If reminder was altered, reset notified flag so it can fire
        if (oldReminder !== reminder) {
          state.tasks[taskIndex].notified = false;
        }
        showToast('Task updated successfully!', 'success');
      }
    } else {
      // Create new
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title,
        description: desc,
        dueDate,
        reminder,
        completed,
        notified: false,
        createdAt: new Date().toISOString()
      };
      state.tasks.unshift(newTask);
      showToast('Task created successfully!', 'success');
    }

    saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
    closeTaskModal();
    renderTasksList();
    updateHomeDashboard();

    // Check if notification permission is needed for the reminder
    if (reminder && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // -------------------------------------------------------------------------
  // TRACKER TAB — HABIT TRACKER TABLE & PIE/DOUGHNUT CHART
  // -------------------------------------------------------------------------
  function renderHabitTracker() {
    const { year, month } = state.trackerPeriod;
    const daysInMonth = getDaysInMonth(year, month);
    const today = new Date();

    // Update Header Badges
    const chartBadge = document.getElementById('chart-month-badge');
    const periodName = document.getElementById('table-period-name');
    const habitsSummary = document.getElementById('table-habits-summary');
    const label = getMonthYearLabel(year, month);

    if (chartBadge) chartBadge.textContent = label;
    if (periodName) periodName.textContent = label;
    if (habitsSummary) habitsSummary.textContent = `${state.habits.length} habits tracked`;

    const thead = document.getElementById('habit-table-head');
    const tbody = document.getElementById('habit-table-body');
    const emptyState = document.getElementById('habits-empty-state');
    const tableContainer = document.getElementById('tracker-table-container');

    if (!thead || !tbody) return;

    if (state.habits.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (tableContainer) tableContainer.classList.add('hidden');
      updateProgressChart({ percentage: 0, completedCount: 0, remainingCount: 0, totalApplicable: 0 });
      return;
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      if (tableContainer) tableContainer.classList.remove('hidden');
    }

    // 1. Build Table Header Row
    let headHtml = '<tr><th class="habit-col-name">Habit Routine</th>';

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dayShort = DAY_SHORT_NAMES[d.getDay()];
      const isCurrentDay = isSameDay(d, today);

      headHtml += `
        <th class="date-header-cell ${isCurrentDay ? 'is-today' : ''}" title="${MONTH_NAMES[month]} ${day}, ${year}">
          <span class="date-num">${day}</span>
          <span class="day-name">${dayShort}</span>
        </th>
      `;
    }

    headHtml += '<th class="habit-row-stat-cell">Progress</th></tr>';
    thead.innerHTML = headHtml;

    // 2. Build Table Body Rows
    tbody.innerHTML = '';

    state.habits.forEach(habit => {
      const tr = document.createElement('tr');
      tr.className = 'habit-row';

      // First Column: Habit Name + Inline Delete action
      let rowHtml = `
        <td class="habit-col-name">
          <div class="habit-name-wrapper">
            <span class="habit-title-text" title="${escapeHtml(habit.name)}">${escapeHtml(habit.name)}</span>
            <button class="habit-row-del-btn" data-habit-id="${habit.id}" aria-label="Delete habit ${escapeHtml(habit.name)}" title="Delete habit">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;

      // Date Columns 1..daysInMonth
      let habitCheckedCount = 0;
      let habitApplicableCount = 0;
      const habitStart = habit.startDate ? new Date(habit.startDate + 'T00:00:00') : new Date('2000-01-01');

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const isCurrentDay = isSameDay(d, today);
        const dateKey = formatDateKey(year, month, day);
        const logKey = `${habit.id}_${dateKey}`;
        const isChecked = Boolean(state.habitLogs[logKey]);
        const isApplicable = d >= habitStart;

        if (isApplicable) {
          habitApplicableCount++;
          if (isChecked) habitCheckedCount++;
        }

        rowHtml += `
          <td class="habit-cell ${isCurrentDay ? 'is-today' : ''} ${!isApplicable ? 'inactive-day' : ''}">
            <label class="habit-check-label" title="${escapeHtml(habit.name)} - ${MONTH_NAMES[month]} ${day}">
              <input type="checkbox" class="habit-check-input" 
                data-habit-id="${habit.id}" 
                data-date-key="${dateKey}" 
                ${isChecked ? 'checked' : ''}
                aria-label="${escapeHtml(habit.name)} on ${MONTH_NAMES[month]} ${day}">
              <span class="habit-check-box"></span>
            </label>
          </td>
        `;
      }

      // Summary Progress Column for this row
      const rowPct = habitApplicableCount > 0 ? Math.round((habitCheckedCount / habitApplicableCount) * 100) : 0;
      rowHtml += `<td class="habit-row-stat-cell">${habitCheckedCount}/${habitApplicableCount} (${rowPct}%)</td>`;

      tr.innerHTML = rowHtml;

      // Attach Delete button listener
      const delBtn = tr.querySelector('.habit-row-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openConfirmModal('habit', habit.id, `Are you sure you want to delete the habit "${habit.name}"? Historical logs will be preserved.`);
        });
      }

      tbody.appendChild(tr);
    });

    // Attach checkbox change event listeners (Event delegation on tbody)
    tbody.querySelectorAll('.habit-check-input').forEach(chk => {
      chk.addEventListener('change', handleHabitCheckboxChange);
    });

    // 3. Recalculate and update Circular Chart
    const metrics = calculateHabitsMetricsForMonth(year, month);
    updateProgressChart(metrics);
  }

  function handleHabitCheckboxChange(e) {
    const chk = e.target;
    const habitId = chk.getAttribute('data-habit-id');
    const dateKey = chk.getAttribute('data-date-key');
    const logKey = `${habitId}_${dateKey}`;

    if (chk.checked) {
      state.habitLogs[logKey] = true;
    } else {
      delete state.habitLogs[logKey];
    }

    saveToStorage(STORAGE_KEYS.HABIT_LOGS, state.habitLogs);

    // Live immediate recalculation of metrics without page refresh
    const metrics = calculateHabitsMetricsForMonth(state.trackerPeriod.year, state.trackerPeriod.month);
    updateProgressChart(metrics);

    // Update row progress stat for that row immediately
    const tr = chk.closest('tr');
    if (tr) {
      const allRowInputs = tr.querySelectorAll('.habit-check-input');
      let checked = 0;
      allRowInputs.forEach(i => { if (i.checked) checked++; });
      const statCell = tr.querySelector('.habit-row-stat-cell');
      if (statCell) {
        const total = allRowInputs.length;
        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
        statCell.textContent = `${checked}/${total} (${pct}%)`;
      }
    }

    // Live update Home dashboard if same month or for general consistency
    updateHomeDashboard();
  }

  // -------------------------------------------------------------------------
  // CIRCULAR PROGRESS CHART (SVG DOUGHNUT)
  // -------------------------------------------------------------------------
  function updateProgressChart(metrics) {
    const { percentage, completedCount, remainingCount, totalApplicable } = metrics;

    const progressCircle = document.getElementById('chart-progress-circle');
    const percentageText = document.getElementById('chart-percentage-text');
    const completedCountEl = document.getElementById('chart-completed-count');
    const remainingCountEl = document.getElementById('chart-remaining-count');
    const totalCountEl = document.getElementById('chart-total-count');
    const quoteEl = document.getElementById('chart-motivational-quote');

    if (percentageText) percentageText.textContent = `${percentage}%`;
    if (completedCountEl) completedCountEl.textContent = completedCount;
    if (remainingCountEl) remainingCountEl.textContent = remainingCount;
    if (totalCountEl) totalCountEl.textContent = totalApplicable;

    // Circle circumference for r=78: 2 * PI * 78 ≈ 490.088
    const circumference = 490.088;
    if (progressCircle) {
      const offset = circumference - (circumference * percentage) / 100;
      progressCircle.style.strokeDashoffset = offset;
      
      // Dynamic color depending on completion tier
      if (percentage >= 80) {
        progressCircle.style.stroke = 'var(--accent-success)';
      } else if (percentage >= 40) {
        progressCircle.style.stroke = 'var(--accent-primary)';
      } else {
        progressCircle.style.stroke = 'var(--accent-purple)';
      }
    }

    // Dynamic encouraging quotes
    if (quoteEl) {
      if (totalApplicable === 0) {
        quoteEl.textContent = '"Add a routine to begin building your consistency."';
      } else if (percentage === 100) {
        quoteEl.textContent = '"Unstoppable momentum! Every planned habit was conquered this month."';
      } else if (percentage >= 75) {
        quoteEl.textContent = '"Outstanding consistency. You are forging powerful daily discipline."';
      } else if (percentage >= 50) {
        quoteEl.textContent = '"Halfway through the summit. Keep showing up every single day."';
      } else if (percentage > 0) {
        quoteEl.textContent = '"Small daily improvements over time lead to stunning results."';
      } else {
        quoteEl.textContent = '"The journey of a thousand miles begins with a single checkmark."';
      }
    }
  }

  // Habit Modal Functions
  function openHabitModal() {
    const modal = document.getElementById('habit-modal');
    const form = document.getElementById('habit-form');
    const input = document.getElementById('habit-name-input');
    const err = document.getElementById('habit-name-error');

    err.classList.add('hidden');
    form.reset();
    modal.classList.remove('hidden');
    input.focus();
  }

  function closeHabitModal() {
    const modal = document.getElementById('habit-modal');
    if (modal) modal.classList.add('hidden');
  }

  function handleHabitFormSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('habit-name-input');
    const catSelect = document.getElementById('habit-category-input');
    const err = document.getElementById('habit-name-error');

    const name = input.value.trim();
    if (!name) {
      err.classList.remove('hidden');
      return;
    }
    err.classList.add('hidden');

    // Create habit with activation date starting from the 1st of currently selected tracker month
    const { year, month } = state.trackerPeriod;
    const startDate = formatDateKey(year, month, 1);

    const newHabit = {
      id: 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name,
      category: catSelect ? catSelect.value : 'routine',
      startDate,
      createdAt: new Date().toISOString()
    };

    state.habits.push(newHabit);
    saveToStorage(STORAGE_KEYS.HABITS, state.habits);

    closeHabitModal();
    renderHabitTracker();
    updateHomeDashboard();
    showToast(`Habit "${name}" added!`, 'success');
  }

  // -------------------------------------------------------------------------
  // CONFIRMATION MODAL (SAFE DELETIONS)
  // -------------------------------------------------------------------------
  function openConfirmModal(type, id, message) {
    state.modalPendingAction = { type, id };
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-modal-message');

    if (msgEl) msgEl.textContent = message;
    if (modal) modal.classList.remove('hidden');
  }

  function closeConfirmModal() {
    state.modalPendingAction = null;
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.add('hidden');
  }

  function handleConfirmProceed() {
    if (!state.modalPendingAction) return;

    const { type, id } = state.modalPendingAction;

    if (type === 'task') {
      state.tasks = state.tasks.filter(t => t.id !== id);
      saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
      renderTasksList();
      updateHomeDashboard();
      showToast('Task deleted.', 'info');
    } else if (type === 'habit') {
      state.habits = state.habits.filter(h => h.id !== id);
      saveToStorage(STORAGE_KEYS.HABITS, state.habits);
      // We purposefully DO NOT wipe historical habit logs to preserve past records integrity
      renderHabitTracker();
      updateHomeDashboard();
      showToast('Habit removed.', 'info');
    }

    closeConfirmModal();
  }

  // -------------------------------------------------------------------------
  // EVENT LISTENERS & SETUP
  // -------------------------------------------------------------------------
  function setupEventListeners() {
    // 1. Navigation Tab Clicks
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = e.currentTarget.getAttribute('data-tab');
        switchTab(tabId);
      });
    });

    // Quick jump cards on Home
    document.querySelectorAll('.quick-card').forEach(card => {
      card.addEventListener('click', () => {
        const jumpTarget = card.getAttribute('data-jump');
        if (jumpTarget) switchTab(jumpTarget);
      });
    });

    // 2. Theme Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // 3. Task Management Listeners
    const openAddTaskBtn = document.getElementById('open-add-task-btn');
    const emptyAddTaskBtn = document.getElementById('empty-add-task-btn');
    const closeTaskModalBtn = document.getElementById('close-task-modal-btn');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');
    const taskForm = document.getElementById('task-form');

    if (openAddTaskBtn) openAddTaskBtn.addEventListener('click', () => openTaskModal(null));
    if (emptyAddTaskBtn) emptyAddTaskBtn.addEventListener('click', () => openTaskModal(null));
    if (closeTaskModalBtn) closeTaskModalBtn.addEventListener('click', closeTaskModal);
    if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeTaskModal);
    if (taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);

    // Task Filter Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.taskFilter = e.currentTarget.getAttribute('data-filter');
        renderTasksList();
      });
    });

    // 4. Habit Tracker Listeners
    const openAddHabitBtn = document.getElementById('open-add-habit-btn');
    const emptyAddHabitBtn = document.getElementById('empty-add-habit-btn');
    const closeHabitModalBtn = document.getElementById('close-habit-modal-btn');
    const cancelHabitBtn = document.getElementById('cancel-habit-btn');
    const habitForm = document.getElementById('habit-form');

    if (openAddHabitBtn) openAddHabitBtn.addEventListener('click', openHabitModal);
    if (emptyAddHabitBtn) emptyAddHabitBtn.addEventListener('click', openHabitModal);
    if (closeHabitModalBtn) closeHabitModalBtn.addEventListener('click', closeHabitModal);
    if (cancelHabitBtn) cancelHabitBtn.addEventListener('click', closeHabitModal);
    if (habitForm) habitForm.addEventListener('submit', handleHabitFormSubmit);

    // 5. Confirmation Modal Listeners
    const closeConfirmModalBtn = document.getElementById('close-confirm-modal-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmProceedBtn = document.getElementById('confirm-proceed-btn');

    if (closeConfirmModalBtn) closeConfirmModalBtn.addEventListener('click', closeConfirmModal);
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeConfirmModal);
    if (confirmProceedBtn) confirmProceedBtn.addEventListener('click', handleConfirmProceed);

    // Backdrop clicks to close modals
    ['task-modal', 'habit-modal', 'confirm-modal'].forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.add('hidden');
          }
        });
      }
    });

    // Escape key listener for open modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTaskModal();
        closeHabitModal();
        closeConfirmModal();
      }
    });
  }

  // Utility to escape HTML strings safely
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------------------
  // INITIALIZATION ON DOM READY
  // -------------------------------------------------------------------------
  function init() {
    preloadImages();
    initializeDefaultData();
    applyTheme(state.theme);
    setupUserGreeting();
    setupMonthSelectors();
    setupNotificationSupport();
    setupEventListeners();
    startReminderChecker();

    // Render initial views
    updateHomeDashboard();
    renderTasksList();
    renderHabitTracker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
