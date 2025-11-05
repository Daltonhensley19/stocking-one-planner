# Stocking One Planner - Project Overview

**Version:** 1.1
**Purpose:** Daily workforce management system for Walmart stocking associates
**Primary Usage:** Mobile phones (warehouse environment)
**Tech Stack:** NestJS + TypeScript + PostgreSQL + Tailwind CSS v4

---

## Quick Start Context

### What This App Does
- Managers create daily work plans for stocking associates
- Assigns specific warehouse tasks to individual associates
- Tracks required task coverage (8 critical tasks must be assigned)
- Exports plans as plain text for easy sharing
- Mobile-first design for on-the-go planning

### Target Users
- Walmart stocking team managers/supervisors
- Used during shift planning (often early morning/late night)
- Accessed primarily via mobile phones in warehouse settings

---

## Architecture

### Backend (NestJS)
```
src/
├── app.module.ts           # Main module (TypeORM, Auth, Associates)
├── app.controller.ts       # Routes: / (login), /app (main)
├── main.ts                 # Bootstrap (port 3000, HBS views)
├── associates/             # CRUD for associates
│   ├── associates.controller.ts  # @UseGuards(JwtAuthGuard)
│   ├── associates.service.ts
│   └── associates.module.ts
├── auth/                   # JWT authentication
│   ├── auth.controller.ts       # POST /api/auth/login
│   ├── auth.service.ts          # Bcrypt, JWT, rate limiting
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   └── database-init.service.ts # Auto-creates admin user
└── entities/
    ├── associate.entity.ts      # id, name, createdAt
    └── user.entity.ts           # id, username, password, loginAttempts, lockedUntil
```

### Frontend (Handlebars + Vanilla JS)
```
views/
├── login.hbs    # JWT auth with "Remember Me" (15min vs 7 days)
└── index.hbs    # Main app (1393 lines - feature-rich SPA-like experience)
```

### Database (PostgreSQL via TypeORM)
- **Production:** Neon/Supabase (free tier)
- **Local Dev:** SQLite or local PostgreSQL
- **Auto-sync:** `synchronize: true` in app.module.ts
- **SSL:** Enabled in production

---

## Core Features

### 1. Authentication (src/auth/)
- **JWT-based** with configurable expiration
- **Rate limiting:** 5 failed attempts = 15-minute account lock
- **Default admin:** username: `admin`, password: `gowalmart`
- **Token storage:** localStorage (7 days) or sessionStorage (15 min)
- **Auto-redirect:** Unauthenticated users → login page

### 2. Associate Management (src/associates/)
- **Add associates** by name (manual input)
- **Quick Add** feature with 11 predefined names:
  - Lawrence, Jay, Heather, Chris, Jeff, Michael, Julia, Ronnie, Tawnya, Dalton, Michelle
- **Remove associates** individually
- **Clear table** bulk action
- **Persistent storage** in PostgreSQL

### 3. Task Assignment System (views/index.hbs)
**13 Available Tasks:**
1. Paper, Pets, and Chemicals
2. New mod
3. Rollies
4. Automotive and Sporting goods
5. Housewares
6. Infants
7. Grocery and 95
8. Topsteel
9. Trailers
10. Scan early
11. Top Stock
12. Bikes, Crafts, Batteries, and Furniture
13. HBA and OTC

**8 Required Tasks** (Must be assigned to at least one person):
- Tasks 1-7, 12, 13 (indices: 0, 1, 2, 3, 4, 5, 6, 11, 12)

**Task Features:**
- Modal-based assignment interface (bottom sheet on mobile)
- Checkbox selection for predefined tasks
- Custom task creation per associate
- Real-time table updates
- Task validation on export

### 4. Visual Progress Indicator ⭐ RECENT ADDITION
Located at top of main page, shows:
- **Progress bar** (0-100%) with color coding:
  - Red: <60% coverage
  - Yellow: 60-99% coverage
  - Green: 100% coverage
- **Badge:** "X of 8 Required"
- **Task status grid:** 8 individual badges showing:
  - Abbreviated task names (e.g., "Paper, Pets, Chem", "HBA & OTC")
  - Red (unassigned) or Green (assigned)
  - Hover shows full task name
- **Responsive grid:** 2 cols (mobile) → 4 cols (tablet) → 8 cols (desktop)
- **Auto-updates** on every task assignment change

### 5. Export Functionality
**"View as Text" button:**
- Generates plain text format:
  ```
  Lawrence:
    - Paper, Pets, and Chemicals.
    - New mod.

  Jay:
    - Rollies.
    - [Custom] Stock holiday endcaps
  ```
- **Copy to clipboard** button
- **Validation:** Warns if required tasks unassigned
- **Use case:** Share via text message or messaging apps

### 6. Offline Support & Plan Persistence ⭐ NEW FEATURE

#### Plan Persistence
- **Database storage:** Plans saved to PostgreSQL with date tracking
- **Auto-save:** Debounced saving (1 second after last change)
- **Plan loading:** Automatically loads today's plan on page load
- **API endpoints:** Full CRUD operations for plans

#### Service Worker
- **Offline caching:** Static assets cached for offline use
- **Network resilience:** Cache-first for assets, network-first for API
- **Auto-updates:** Prompts user when new version available
- **Scope:** `/public/service-worker.js`

#### IndexedDB Integration
- **Offline queue:** Stores failed operations when offline
- **Auto-sync:** Syncs pending changes when connection restored
- **Persistent storage:** Browser-based storage for reliability

#### Online/Offline Indicator
- **Visual status:** Green (online) / Red (offline) dot in header
- **Real-time updates:** Monitors connection status changes
- **User notifications:** Toast messages for status changes
- **Pulse animation:** Visual feedback during sync operations

### 7. UI/UX Enhancements ⭐ RECENT ADDITIONS

#### Touch Target Optimization
- All buttons: **min-height 48px** (iOS/Android standard)
- Checkboxes: **28-32px** (was 24px)
- Interactive rows: **56px min-height**
- Increased padding throughout

#### Bottom Sheet Modals
- **Mobile:** Slides up from bottom (native app feel)
- **Desktop:** Centered with fade-in
- **Visual cues:** Drag handle indicator on mobile
- **Smooth animations:** 300ms slide-up, 250ms slide-down
- **Rounded corners:** 3xl radius on mobile top corners

#### Haptic Feedback
Uses Vibration API for tactile responses:
- **Light (10ms):** Checkbox toggles
- **Medium (20ms):** Button clicks, modal opens
- **Success (pattern):** Completed actions, clipboard copy
- **Error (pattern):** Failed operations
- **Warning (pattern):** Cautionary alerts
- **Auto-triggers:** On toast notifications based on type

---

## Data Flow

### Task Assignment Storage ✅ NOW PERSISTED
**Current State:** Task assignments are **persisted to database**
- Stored in PostgreSQL: `plans` table with JSONB assignments column
- Structure: `{ associateName: [{ type: 'predefined', value: taskIndex }, ...] }`
- **Auto-saves after changes** (1 second debounce)
- **Loads on page load** (today's plan if exists)
- **Offline queue:** Changes saved to IndexedDB when offline, synced when online

**Database Stores:**
- Associate names (associates table)
- User accounts (users table)
- Daily plans (plans table) - **NEW**
  - planDate: Date of the plan
  - assignments: JSONB object with task assignments
  - isCompleted: Boolean flag
  - createdAt, updatedAt: Timestamps

**Benefits:**
- ✅ Plans survive page refresh
- ✅ Work can be saved and continued later
- ✅ Multiple sessions supported
- ✅ Offline support with sync queue

### API Endpoints
```
# Authentication
POST   /api/auth/login              # Returns JWT token

# Associates
GET    /api/associates              # @UseGuards(JwtAuthGuard)
POST   /api/associates              # Body: { name: string }
DELETE /api/associates/:id          # Returns 204 on success

# Plans (NEW)
GET    /api/plans                   # Get all plans @UseGuards(JwtAuthGuard)
GET    /api/plans/by-date           # Query: ?date=YYYY-MM-DD
GET    /api/plans/:id               # Get plan by ID
POST   /api/plans                   # Body: { planDate, assignments }
PUT    /api/plans/:id               # Body: { assignments, isCompleted? }
DELETE /api/plans/:id               # Returns 204 on success
```

### Authentication Flow
```
1. User enters credentials → POST /api/auth/login
2. Server validates (bcrypt) → Returns JWT + expiration
3. Client stores token (localStorage or sessionStorage)
4. All API calls include: Authorization: Bearer <token>
5. Unauthorized (401) → Clear storage, redirect to /
```

---

## Design System

### Color Palette
- **Primary Dark:** Slate 800 (`#1e293b`) - Headers, important sections
- **Primary Light:** Slate 50/100 - Backgrounds
- **Accent:** Blue 600 (`#2563eb`) - Primary actions, links
- **Success:** Green 500/600/700
- **Error:** Red 500/600/700
- **Warning:** Yellow/Amber 500/600
- **Borders:** Slate 200/300

### Typography
- **Headers:** Uppercase, tracking-wide, bold
- **Body:** Slate 700/800
- **Size scale:** xs (0.75rem) → sm → base → lg → xl → 2xl
- **Font:** System default (no custom fonts)

### Component Patterns
```
Corporate Header
├── Logo badge (blue 600, rounded-lg)
├── App title (uppercase, bold, white)
└── Sign Out button (slate 700, hover:slate 600)

Cards/Sections
├── White background
├── Border: slate 200
├── Rounded-lg corners
├── Shadow for depth
└── Padding: 4-6 on mobile, 6-8 on desktop

Buttons
├── Primary: bg-blue-600 hover:bg-blue-700
├── Destructive: bg-red-600 hover:bg-red-700
├── Secondary: bg-slate-600 hover:bg-slate-700
├── Success: bg-green-600 hover:bg-green-700
└── All: font-semibold, min-h-[48px], rounded, shadow-sm

Modals (Bottom Sheet Style)
├── Mobile: Full width, slide from bottom, rounded-t-3xl
├── Desktop: Max-w-2xl, centered, fade-in, rounded-lg
├── Header: Slate 800, blue 600 border-b-4
├── Drag handle: Gray bar on mobile
└── Footer: Slate 50 background
```

### Responsive Breakpoints
```
Mobile:   < 640px (base styles)
Tablet:   sm: 640px
Desktop:  lg: 1024px

Grid adjustments:
- Task status: 2 cols → 4 cols → 8 cols
- Buttons: Full width → auto width
- Padding: 4 → 6 → 8
```

---

## Key Files Reference

### Most Important File
**`views/index.hbs`** (1393 lines)
- Contains ALL frontend logic
- Sections (in order):
  - Lines 1-30: Corporate header with logout
  - Lines 31-72: Progress indicator (NEW)
  - Lines 73-115: Add associate section
  - Lines 116-138: Assignments overview (table)
  - Lines 143-201: Task assignment modal (bottom sheet)
  - Lines 203-238: Quick add modal (bottom sheet)
  - Lines 240-243: Toast container
  - Lines 245-345: CSS (bottom sheet animations, toasts)
  - Lines 346+: JavaScript logic (all features)

### JavaScript Variables (views/index.hbs)
```javascript
// Line 563-577: availableTasks array (13 tasks)
// Line 579-594: taskAbbreviations (for badges)
// Line 598: requiredTaskIndices = [0,1,2,3,4,5,6,11,12]
// Line 600-612: predefinedNames (Quick Add list)
// Line 615: associates = [] (from database)
// Line 616: assignedTasks = {} (in-memory only!)
```

### Key Functions (views/index.hbs)
```javascript
// Auth
authenticatedFetch()      // All API calls with JWT

// UI
showToast()              // Notifications with haptic feedback
triggerHaptic()          // Vibration API wrapper

// Modals
openTaskModal()          // Task assignment modal
closeTaskModal()         // Animated close
openQuickAddModal()      // Quick add modal
closeQuickAddModal()     // Animated close

// Task Management
initializeModalTaskList() // Populate task checkboxes
handleModalTaskCheckboxChange() // Update assignments
addCustomTask()          // Add custom task to associate
removeCustomTask()       // Remove custom task

// Display Updates
updateAssignmentsOverview() // Refresh main table
updateProgressIndicator()   // Update progress bar + badges

// Data Operations
loadAssociates()         // GET /api/associates on page load
clearTable()             // Bulk delete all associates
generateTextFormat()     // Export as plain text
checkUnassignedRequiredTasks() // Validation before export
```

---

## Recent Session Changes

### Session Date: 2025-01-05

#### Full Offline Support Implementation
- **Plan persistence:** Created Plan entity with CRUD API endpoints
- **Auto-save:** Task assignments auto-save to database (1s debounce)
- **Service Worker:** Offline caching for static assets and API responses
- **IndexedDB:** Offline queue for failed operations with auto-sync
- **Online/Offline indicator:** Real-time connection status in header
- **Network resilience:** App works offline, syncs when reconnected

#### Database Changes
- New `plans` table with fields: id, planDate, assignments (JSONB), isCompleted, createdAt, updatedAt
- Plans API: GET /api/plans, GET /api/plans/by-date, POST /api/plans, PUT /api/plans/:id, DELETE /api/plans/:id

#### Frontend Enhancements
- Plan loading on page load (loads today's plan if exists)
- Debounced auto-save after task changes
- Offline operation queuing with IndexedDB
- Automatic sync when connection restored
- Visual feedback for connection status

### Session Date: 2025-01-04

#### 1. Visual Progress Indicator (Improvement #7)
- Added comprehensive task coverage dashboard
- Color-coded progress bar (red/yellow/green)
- Badge showing "X of 8 Required"
- Task status grid with abbreviated names
- Auto-updates on assignment changes

#### 2. Touch Target Optimization (Improvement #10)
- Increased all buttons to 48px min-height
- Enlarged checkboxes from 24px to 28-32px
- Added padding to all interactive elements
- Improved mobile thumb accessibility

#### 3. Bottom Sheet Modals (Improvement #11)
- Mobile: Slides up from bottom (native feel)
- Desktop: Centered fade-in (traditional)
- Drag handle indicator on mobile
- Smooth CSS animations
- Applied to both task and quick add modals

#### 4. Haptic Feedback (Improvement #24)
- Vibration API integration
- Multiple patterns: light, medium, success, error, warning
- Triggered on key interactions:
  - Checkbox toggles
  - Modal opens
  - Button clicks
  - Toast notifications
  - Clipboard copy

#### 5. Task List Update
- Added "HBA and OTC" as Task #13
- Marked as required (8 required tasks total)
- Created abbreviated names for all tasks
- Updated progress indicator from 7 to 8 tasks

---

## Build & Deploy

### Local Development
```bash
npm install
npm run start:dev  # Builds CSS + starts NestJS in watch mode
```

### Build Commands
```bash
npm run build:css        # Tailwind CSS compilation
npm run build            # CSS + NestJS build
npm run start:prod       # Production server
npm run create-admin     # Create admin user via CLI
```

### Environment Variables
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=<random-32-byte-string>
NODE_ENV=production
PORT=3000
```

### Deployment (Render + Neon)
- **Web Service:** Render.com (free tier, auto-deploy from GitHub)
- **Database:** Neon PostgreSQL (3GB free)
- **Limitations:**
  - 15-minute sleep on inactivity
  - 30-second cold start
  - 750 hours/month runtime
- **Admin user:** Auto-created by DatabaseInitService on first run
- **SSL:** Required for database connection in production

---

## Known Limitations & Future Enhancements

### Current Limitations
1. ~~**No task persistence**~~ ✅ **RESOLVED** - Plans now persist to database
2. **Single admin user** - No multi-user support
3. ~~**No date tracking**~~ ✅ **RESOLVED** - Plans tracked by date
4. **No history** - Cannot view past plans (API exists, UI not implemented)
5. ~~**No task assignment API**~~ ✅ **RESOLVED** - Full CRUD API for plans

### Potential Enhancements (Not Implemented)
- ~~Task assignment persistence to database~~ ✅ **IMPLEMENTED**
- ~~Offline mode with service worker~~ ✅ **IMPLEMENTED**
- Multi-day planning with calendar UI (backend ready)
- Plan history view (backend ready)
- User roles (manager, supervisor, associate)
- Plan history reporting and analytics
- Task templates/presets
- Dark mode (warehouses are dark!)
- Swipe actions for cards
- Plan duplication feature

---

## Security Notes

### Implemented
- JWT authentication with configurable expiration
- Bcrypt password hashing (10 rounds)
- Account lockout after 5 failed attempts
- SSL in production
- JWT guard on all API endpoints
- Environment-based configuration

### Hardcoded Values (Change in Production)
- Admin password: `gowalmart` (in database-init.service.ts)
- JWT expiration: 15 minutes (standard), 7 days (remember me)
- Lock duration: 15 minutes

### Not Implemented
- CSRF protection
- Rate limiting on API endpoints (only on login)
- Password reset functionality
- Email verification
- Session management/revocation
- Audit logging

---

## Testing Quick Reference

### Manual Test Checklist
1. **Login:** admin / gowalmart
2. **Add associate:** Enter name, click Add
3. **Quick Add:** Click Quick Add, select names, confirm
4. **Assign tasks:** Click associate row, check tasks, click Done
5. **Progress indicator:** Verify badges update (red → green)
6. **Custom task:** In modal, add custom task text
7. **Export:** Click "View as Text", verify format, copy
8. **Remove:** Click Remove button on associate
9. **Clear table:** Confirm dialog, verify all removed
10. **Logout:** Sign out, verify redirect to login

### Browser Support
- Chrome/Edge: ✅ Full support
- Safari iOS: ✅ Full support (haptics work)
- Firefox: ✅ Full support
- Samsung Internet: ✅ Full support

---

## Git Information

### Current State
- Branch: `master`
- Status: Clean working directory
- Recent commits:
  - 2351e438: Added names to the Quick List
  - d943d9c9: Version 1.1
  - d1c89b08: Version 1.0 release

### Deployment
- Push to GitHub → Auto-deploys to Render
- CSS builds automatically during deployment
- Database migrations auto-run (synchronize: true)

---

## Common Issues & Solutions

### Issue: Page refresh loses tasks
**Cause:** Task assignments not persisted to database
**Solution:** Complete plan and export before closing browser

### Issue: Login fails repeatedly
**Cause:** Account locked after 5 attempts
**Solution:** Wait 15 minutes or check server logs for user lockout status

### Issue: Modal doesn't close
**Cause:** Animation timing conflict
**Solution:** Refresh page (animation timeout is 250ms)

### Issue: Progress indicator not updating
**Cause:** updateProgressIndicator() not called after task change
**Solution:** Verify updateAssignmentsOverview() calls updateProgressIndicator()

### Issue: Haptic feedback not working
**Cause:** Browser doesn't support Vibration API or user denied permission
**Solution:** Graceful degradation - feature optional

---

## Development Notes

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier configured
- No semicolons (project convention)
- Single quotes for strings
- 2-space indentation

### Debugging
- Server logs: `console.log()` in NestJS files
- Client logs: Browser DevTools Console
- Network: Check JWT in Authorization headers
- Database: Direct SQL via Neon/Supabase dashboard

### Performance
- Tailwind CSS: Minified in production (~10KB)
- No heavy dependencies on frontend (vanilla JS)
- Optimistic UI updates (update before API confirms)
- Skeleton loaders: Not implemented (could add)

---

## Contact & Documentation

### Project Documentation
- README.md: Default NestJS boilerplate
- DEPLOYMENT.md: Step-by-step deployment guide
- PROJECT_OVERVIEW.md: This file (comprehensive reference)

### Related Documentation
- NestJS: https://docs.nestjs.com
- Tailwind CSS v4: https://tailwindcss.com/docs
- TypeORM: https://typeorm.io
- Handlebars: https://handlebarsjs.com

---

**Last Updated:** 2025-01-05
**Session Focus:** Full offline support implementation + plan persistence to database
