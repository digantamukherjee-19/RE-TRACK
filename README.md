# RE-TRACK

> **Re-Track Your Life.....**

RE-TRACK is a modern, minimal, intuitive, and fully responsive personal productivity web application that unites a **monthly habit tracker**, an **actionable task manager**, and a **live personal progress dashboard** into a single cohesive interface.

Built with clean semantic HTML5, CSS3, and vanilla JavaScript (ES6+), RE-TRACK delivers instant client-side performance, persistent local data storage, browser-level reminder alerts, and seamless light/dark theme switching backed by custom visual artwork.

Repository: [https://github.com/digantamukherjee-19/RE-TRACK](https://github.com/digantamukherjee-19/RE-TRACK)

---

## Table of Contents

- [Overview & Purpose](#overview--purpose)
- [Key Features](#key-features)
  - [1. Navigation & Theme System](#1-navigation--theme-system)
  - [2. HOME Tab — Personal Productivity Dashboard](#2-home-tab--personal-productivity-dashboard)
  - [3. LIST Tab — Task Management & Reminders](#3-list-tab--task-management--reminders)
  - [4. TRACKER Tab — Monthly Habit Matrix & Progress Ring](#4-tracker-tab--monthly-habit-matrix--progress-ring)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Assets & Theme Background Integration](#assets--theme-background-integration)
- [Data Storage & Notification Model](#data-storage--notification-model)
- [Installation & Getting Started](#installation--getting-started)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Overview & Purpose

Many productivity tools force users to choose between complex, bloated project managers or disconnected habit logs. **RE-TRACK** bridges this gap:
- **Focus**: Maintain clear visibility into monthly commitments without visual clutter.
- **Consistency**: Track daily discipline across custom routines with an interactive, borderless monthly matrix.
- **Feedback**: Instant real-time calculation of targets given, targets completed, and habit execution percentages.
- **Privacy & Speed**: 100% client-side execution; your data stays in your browser's local storage without requiring accounts, logins, or external database setups.

---

## Key Features

### 1. Navigation & Theme System
- **Fixed Top Navigation**: A glassmorphic header pinned to the top of the viewport across all tabs (`HOME`, `LIST`, `TRACKER`).
- **Explicit Click-Based Tab Switching**: No scroll-based navigation or scroll-spying; tabs switch strictly on user selection and preserve scroll states and data.
- **Global Light / Dark Themes**: Toggleable via a sun/moon control in the top-right corner. Updates CSS theme tokens, translucent frosted glass cards, and text contrast instantly without page reloads.
- **Persistent Theme Preference**: Saved in browser `localStorage` and remembered on future visits.
- **Precached Background Imagery**: Both light and dark theme background images are preloaded to prevent visual flash or flickering during switching.

### 2. HOME Tab — Personal Productivity Dashboard
- **Brand Identity Header**: Displays the official RE-TRACK logo beside the brand name with fixed aspect ratios (`object-fit: contain`).
- **Editable Username**: Displays a personalized greeting (`Hello, USERNAME`). Clickable to edit in place and saved permanently to local storage.
- **Prominent Main Heading**: *Re-Track Your Life.....* styled with an italic display typeface.
- **Stylish Month & Year Selector**: Easily cycle backward or forward through any month and year (or jump straight to the current month).
- **Live Dynamic Metrics**:
  - **Targets Given**: Total tasks scheduled for the selected month in the LIST tab.
  - **Targets Completed**: Count of completed tasks for that specific target month.
  - **Habits Tracked**: Mathematically derived completion percentage:
    $$\text{Habits Tracked} = \left( \frac{\text{Completed Applicable Habit-Days}}{\text{Total Applicable Habit-Days}} \right) \times 100$$
    Accurately handles leap years, varying month lengths (28 to 31 days), habit start dates, and zero-habit states.
- **Quick Jump Cards**: One-click navigation cards routing directly to Task Management or Habit Matrix.

### 3. LIST Tab — Task Management & Reminders
- **Dedicated Month & Year Selector**: Mirrors the stylish TRACKER/HOME month controls. Allows inspecting and organizing tasks month-by-month and year-by-year with previous/next controls.
- **Target Date Filtering**: Automatically displays only the tasks assigned to the chosen month and year, properly distinguishing between identical months in different years (e.g., October 2026 vs. October 2025).
- **Status Filter Chips**: Instant filtering by `All`, `Active`, and `Completed` with dynamic live count badges.
- **Add & Edit Task Modal**:
  - Fields for title, optional multi-line notes/description, target due date, optional reminder datetime, and completion checkbox.
  - Form validation with inline feedback.
  - Smart default date automatically aligned with the active LIST month view.
- **Task Reminders & Browser Notifications**:
  - Configurable reminder datetime per task.
  - Native Web Notification API integration with permission status checks and permission request controls.
  - In-app toast notification fallback ensuring reminders are never missed when permissions are denied or notifications are disabled.
  - Background polling engine checking due reminders without duplicate notifications.
- **Safe Task Deletion**: Includes an explicit confirmation dialog before removing a task.

### 4. TRACKER Tab — Monthly Habit Matrix & Progress Ring
- **Two-Part Desktop Layout**:
  - **Left**: Dynamic circular SVG doughnut progress chart displaying the overall monthly completion rate, exact completed vs. remaining habit-days, and contextual motivational quotes.
  - **Right**: Monthly calendar spreadsheet matrix.
- **Borderless Modern Design**: Strictly adheres to the **no-visible-grid** rule. Omits heavy spreadsheet table borders in favor of clean spacing, subtle hover states, and clear interactive checkboxes.
- **Dynamic Calendar Columns**: Automatically computes 28, 29, 30, or 31 columns according to the selected month and leap year rules, with day-of-week headers and current-day highlighting.
- **Sticky Habit Names Column**: Allows smooth horizontal scrolling across all 31 date columns on mobile and smaller viewports while keeping habit names visible.
- **Real-Time Synchronized Calculations**: Toggling any habit checkbox or adding/deleting a habit updates the SVG progress ring and dashboard statistics immediately without a page refresh.
- **Historical Records & Cross-Month Integrity**: Habit logs are keyed by `${habitId}_YYYY-MM-DD`. Switching months or revisiting past records preserves historical checkmarks accurately.

---

## Technology Stack

- **Markup**: HTML5 (Semantic elements, accessible ARIA roles and labels)
- **Styling**: CSS3 (CSS Custom Properties / Variables, Flexbox, CSS Grid, Glassmorphic backdrop filters, custom responsive checkboxes)
- **Typography**: Google Fonts (*Plus Jakarta Sans* for UI, *Playfair Display* for brand heading)
- **Scripting**: Modern Vanilla JavaScript (ES6+, strict mode, zero heavy dependencies)
- **Visuals & Charts**: Custom inline SVG doughnut chart with mathematical dash-offset animation
- **Browser APIs**: Web Storage API (`localStorage`), Web Notification API, HTML Audio API

---

## Project Structure

```text
RE-TRACK/
├── assets/
│   ├── darkmode.jpg        # Dark theme background image
│   ├── lightmode.jpg       # Light theme background image
│   └── logo.png            # Official RE-TRACK brand logo (square PNG)
├── .gitattributes          # Line ending and repository attributes
├── .gitignore              # Git ignore rules for node_modules, temp, and OS files
├── app.js                  # Complete application logic, state, event handlers & calendar math
├── index.html              # Single-page application markup and modal dialogs
├── package.json            # Project manifest and standard npm scripts
├── README.md               # Comprehensive documentation
└── style.css               # Design system, theme tokens, layout, and responsive styles
```

---

## Assets & Theme Background Integration

RE-TRACK stores visual assets in the `assets/` directory:
- **`assets/logo.png`**: Rendered in the top navigation bar and in the HOME tab brand identity header (`.home-brand-logo`). Styled with `object-fit: contain` to preserve its original aspect ratio.
- **`assets/lightmode.jpg`**: Used as the global background in light mode (`--app-bg-image`) under a high-contrast subtle translucent overlay.
- **`assets/darkmode.jpg`**: Used as the global background in dark mode (`--app-bg-image`) under a deep translucent slate overlay.

### Replacing Images
To customize the images, replace the corresponding file in `assets/` with your own image using the exact same filename (`logo.png`, `lightmode.jpg`, `darkmode.jpg`). The CSS custom properties and HTML preloader will automatically bind the new files.

---

## Data Storage & Notification Model

### Data Persistence
All application data is managed client-side using `localStorage`:
- `retrack_user_profile`: Custom user display name.
- `retrack_theme`: Selected theme (`light` or `dark`).
- `retrack_tasks`: Array of tasks (IDs, titles, descriptions, due dates, reminder timestamps, completion states).
- `retrack_habits`: Array of habits (IDs, names, categories, start dates).
- `retrack_habit_logs`: Key-value map of completed dates in format `${habitId}_YYYY-MM-DD: true`.

> **Privacy Notice**: All data is stored exclusively in the current browser/device. No telemetry, external database, or third-party tracking is utilized.

### Notifications & Reminders
- Task reminders use the browser's native **Notification API**.
- When a task's scheduled reminder datetime is reached, the application triggers a system desktop notification (if permission was granted).
- An in-app toast notification is displayed concurrently to guarantee visibility.
- **Notification Scope**: Because RE-TRACK runs as a client-side web application without a server daemon or background push worker, scheduled notifications fire while the application is open in an active or background browser tab.

---

## Installation & Getting Started

### Prerequisites
- Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari).
- Node.js (v18+) is optional, but helpful for running a lightweight local static server.

### 1. Clone the Repository
```bash
git clone https://github.com/digantamukherjee-19/RE-TRACK.git
cd RE-TRACK
```

### 2. Run the Application

#### Option A: Direct Browser Launch (No Installation Required)
Simply double-click or open `index.html` in your favorite web browser.

#### Option B: Using a Lightweight Static Server (Recommended)
You can serve the application locally using `npx serve`:
```bash
npx serve .
```
Then open your browser to the local address displayed in the terminal (typically `http://localhost:3000`).

---

## Available Scripts

In the project root, the following `npm` scripts are configured in `package.json`:

- **`npm start`**: Launches a local static web server using `npx serve .`.
- **`npm test`**: Runs the syntax and static check for `app.js` using `node --check app.js`.

---

## Troubleshooting

- **Background Image Not Appearing**: Verify that the files `assets/lightmode.jpg` and `assets/darkmode.jpg` exist and maintain their original filenames.
- **Browser Notifications Not Alerting**: Ensure you have clicked **Enable Notifications** in the LIST tab and granted permission in your browser's site settings. Check that your operating system's "Do Not Disturb" / "Focus Assist" is disabled.
- **Clearing Stored Data**: If you wish to reset the application to its default state, open your browser developer tools (F12) $\rightarrow$ Application/Storage $\rightarrow$ Local Storage, and clear the `retrack_*` keys, then refresh the page.

---

## Future Enhancements

- [ ] Export & import data as JSON for cross-device backup.
- [ ] Progressive Web App (PWA) manifest and Service Worker for offline installation and push notifications.
- [ ] Streak counter badges for consecutive habit completion days.
- [ ] Tagging and priority levels for task management.

---

## License

This project is licensed under the [MIT License](LICENSE).
