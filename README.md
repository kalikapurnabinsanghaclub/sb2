# KNSDC — Kalikapur Nabin Sangha Dance Championship

A robust, local-first event management system built for the Kalikapur Nabin Sangha Community.

## 🌟 Overview
KNSDC is a comprehensive platform designed to manage live dance competitions and community events. It features a real-time synchronization engine that works offline-first, ensuring data consistency across multiple portals even with intermittent internet connectivity.

## 🚀 Key Portals
- **🛡️ Admin Panel:** Complete control over events, participants, and scoring.
- **📺 Live Monitor:** Real-time dashboard for venue tracking and analytics.
- **🎤 Host Panel:** Stage management and performance queue control.
- **⚖️ Judge Panel:** Secure interface for real-time scoring and commentary.
- **🌐 Public Site:** Community-facing website with events, gallery, and notice board.

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Backend:** [Supabase](https://supabase.com/) (Optional for cloud sync)
- **Local Sync:** Custom LocalSync Engine (localStorage + BroadcastChannel)

## 📦 Installation & Setup
1. **Prerequisites:** Install [Node.js](https://nodejs.org/) (LTS version).
2. **Setup:** Clone the repository and run:
   ```bash
   npm install
   ```
3. **Run Locally:**
   ```bash
   npm run dev
   ```
   Or use the included batch scripts:
   - `LAUNCH.bat`: Full pipeline setup and launch.
   - `start_server.bat`: Quick start for the development server.

## 📁 Project Structure
- `index.html`: Entry point for the public community site.
- `portal.html`: Central hub for staff access to various panels.
- `app.js`: Core application logic and state management.
- `lib/localSync.js`: The heart of the real-time synchronization engine.
- `sections/`: Modular JavaScript components for different app sections.
- `style.css`: Unified design system and styling.

## 📄 License
This project is for internal use by Kalikapur Nabin Sangha.

---
*Created with ❤️ by the KNSDC Team.*
