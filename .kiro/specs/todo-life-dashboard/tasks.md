# Implementation Plan: Todo Life Dashboard

## Overview

Implement a zero-dependency, single-page productivity dashboard delivered as three static files (`index.html`, `css/style.css`, `js/app.js`). The implementation follows the IIFE module structure defined in the design, with each widget implemented incrementally and wired together in the final bootstrap step. All state is persisted to `localStorage` under the keys `tdl_tasks` and `tdl_links`.

---

## Tasks

- [x] 1. Project scaffolding — file structure and HTML skeleton
  - [x] 1.1 Create the three project files: `index.html`, `css/style.css`, `js/app.js`
    - `index.html` must link `css/style.css` in `<head>` and `js/app.js` at the end of `<body>`
    - Include the top-level `.dashboard` grid container and four `<section>` elements with classes `.widget .widget--greeting`, `.widget .widget--timer`, `.widget .widget--tasks`, `.widget .widget--links`
    - Add all required `id` attributes used by JavaScript: `#clock-time`, `#clock-date`, `#clock-greeting`, `#clock-error`, `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#timer-complete`, `#task-input`, `#task-submit`, `#task-error`, `#task-list`, `#task-storage-error`, `#link-label-input`, `#link-url-input`, `#link-submit`, `#link-error`, `#link-list`, `#link-storage-error`
    - `js/app.js` should contain an empty IIFE skeleton with nine labelled sections as comments: `[1] CONSTANTS & CONFIG`, `[2] STORAGE MODULE`, `[3] STATE`, `[4] GREETING / CLOCK WIDGET`, `[5] TIMER WIDGET`, `[6] TASK MANAGER WIDGET`, `[7] QUICK LINKS WIDGET`, `[8] STORAGE SYNC HELPERS`, `[9] BOOTSTRAP`
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

- [x] 2. CSS foundation — design tokens, reset, layout, and responsive grid
  - [x] 2.1 Implement CSS custom properties, reset, and base typography in `css/style.css`
    - Define five color tokens: `--color-bg`, `--color-surface`, `--color-primary`, `--color-text`, `--color-muted`
    - Define two font-family tokens: `--font-base` (sans-serif stack), `--font-mono` (monospace stack)
    - Define spacing tokens: `--spacing-xs` (4px) through `--spacing-xl` (48px) on an 8px scale
    - Define `--radius` and `--shadow` tokens
    - Apply `box-sizing: border-box`, margin reset, base `font-size: 16px`, and `line-height` in a universal reset
    - Set `body { overflow-x: hidden; background: var(--color-bg); }` and `.dashboard { max-width: 1440px; margin: 0 auto; }`
    - _Requirements: 6.2, 6.3, 7.3_
  - [x] 2.2 Implement responsive grid layout and widget card styles
    - `.dashboard`: mobile-first single-column layout; `@media (min-width: 768px)` switches to `grid-template-columns: repeat(2, 1fr)`
    - `.widget`: card style with `background: var(--color-surface)`, border-radius, box-shadow, `min-width: 280px`, `max-width: 100%`, padding using spacing tokens (minimum 8px, maximum 48px between widgets)
    - Body text `font-size` ≥ 14px; input `font-size` ≥ 16px
    - `:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }` on all interactive elements
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  - [x] 2.3 Implement widget-specific and component styles
    - Widget-specific modifier classes: `.widget--greeting`, `.widget--timer`, `.widget--tasks`, `.widget--links`
    - Component styles: buttons (default, primary, danger), text inputs, checkboxes, inline error messages, non-blocking warning/error banners
    - State/utility classes: `.is-hidden` (display: none), `.task--completed` (strikethrough on description), `.timer--complete` (visible session-complete indicator style)
    - _Requirements: 6.1, 6.3, 3.7_

- [x] 3. Storage module — `[2] STORAGE MODULE` section of `app.js`
  - [x] 3.1 Implement `storage.isAvailable()`, `storage.read(key)`, and `storage.write(key, data)`
    - `isAvailable()`: attempts a test `setItem`/`removeItem` in a try/catch; returns `boolean`
    - `read(key)`: calls `localStorage.getItem`, JSON-parses result; returns parsed value or `null` on missing key; on `JSON.parse` failure sets an internal `_corruptKeys` flag for that key and returns `null`
    - `write(key, data)`: JSON-stringifies and calls `localStorage.setItem` in a try/catch; returns `true` on success, `false` on failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7_
  - [ ]* 3.2 Write property tests for task serialisation round-trip (Property 1)
    - **Property 1: Task serialisation round-trip**
    - Use fast-check to generate random arrays of valid Task objects (random UUID strings, random 1–500 char descriptions, random booleans)
    - Call `syncTasks()` then `storage.read('tdl_tasks')` and assert structural equality of all fields
    - **Validates: Requirements 5.1, 5.3, 5.4**
  - [ ]* 3.3 Write property tests for link serialisation round-trip (Property 2)
    - **Property 2: Link serialisation round-trip**
    - Use fast-check to generate random arrays of valid Link objects (random UUID strings, random 1–50 char labels, random valid URLs)
    - Call `syncLinks()` then `storage.read('tdl_links')` and assert structural equality of all fields
    - **Validates: Requirements 5.2, 5.3, 5.4**
  - [ ]* 3.4 Write unit tests for the storage module
    - Test `read` with missing key → returns `null`
    - Test `read` with corrupt JSON → returns `null` and sets corruption flag
    - Test `write` failure (mock `setItem` to throw) → returns `false`
    - Test `isAvailable` when storage is mocked to throw → returns `false`
    - _Requirements: 5.5, 5.6, 5.7_

- [x] 4. Greeting / Clock widget — `[4] GREETING / CLOCK WIDGET` section of `app.js`
  - [x] 4.1 Implement `clock.getGreeting(hour)` pure function
    - hour 5–11 → `"Good Morning"`; hour 12–17 → `"Good Afternoon"`; hour 18–20 → `"Good Evening"`; hour 21–23 or 0–4 → `"Good Night"`
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  - [x] 4.2 Implement `clock.init()` and `clock.tick()`
    - `clock.init()`: caches DOM refs for `#clock-time`, `#clock-date`, `#clock-greeting`, `#clock-error`; calls `clock.tick()` immediately; schedules `setInterval(clock.tick, 1000)`
    - `clock.tick()`: wraps `new Date()` in try/catch; on failure hides time/date/greeting and shows `#clock-error` with an error message; on success formats time as `HH:MM:SS` (zero-padded), formats date as `"Weekday, D Month YYYY"` (day not zero-padded), calls `clock.getGreeting(hour)`, updates all three DOM text nodes
    - _Requirements: 1.1, 1.2, 1.7, 1.8_
  - [ ]* 4.3 Write property test for clock greeting totality and exclusivity (Property 9)
    - **Property 9: Clock greeting is total and exclusive**
    - Use fast-check to generate integers in `[0, 23]` and assert `clock.getGreeting(hour)` returns exactly one of the four valid strings and is never `null` or empty
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
  - [ ]* 4.4 Write unit tests for the clock widget
    - Test all four greeting boundary values (4, 5, 11, 12, 17, 18, 20, 21, 23, 0)
    - Test time formatting: single-digit hours, minutes, seconds are zero-padded
    - Test date formatting: day is not zero-padded; correct weekday name
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [~] 5. Checkpoint — Storage and Clock
  - Ensure all implemented tests pass. Verify the page opens in a browser, the clock ticks every second, and the greeting matches the current hour. Ask the user if questions arise.

- [x] 6. Focus Timer widget — `[5] TIMER WIDGET` section of `app.js`
  - [x] 6.1 Implement `timer.init()` and `timer.render()`
    - `timer.init()`: caches DOM refs for `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#timer-complete`; calls `timer.render()`; binds click handlers on all three buttons
    - `timer.render()`: formats `state.timer.remaining` as `MM:SS`; sets `#timer-display` text; toggles `.timer--complete` class on `#timer-complete`; sets `disabled` attribute on Start (when running), Stop (when not running), Reset (when running)
    - _Requirements: 2.1, 2.2, 2.8, 2.9, 2.11_
  - [x] 6.2 Implement `timer.start()`, `timer.stop()`, `timer.reset()`, and `timer.tick()`
    - `timer.start()`: if `remaining === 0` call `timer.reset()` first; set `running = true`; store `setInterval(timer.tick, 1000)` in `state.timer.intervalId`; call `timer.render()`
    - `timer.stop()`: `clearInterval(intervalId)`; set `running = false`; call `timer.render()`
    - `timer.reset()`: call `timer.stop()`; set `remaining = 1500`; hide `#timer-complete`; call `timer.render()`
    - `timer.tick()`: decrement `remaining` by 1; if `remaining <= 0` clamp to 0, call `timer.stop()`, show `#timer-complete`; call `timer.render()`
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.10_
  - [ ]* 6.3 Write property test for timer countdown never going below zero (Property 10)
    - **Property 10: Timer countdown never goes below zero**
    - Use fast-check to generate integers in `[0, 1500]` as starting `remaining`, run N tick calls, assert `state.timer.remaining >= 0` after every tick
    - **Validates: Requirements 2.7**
  - [ ]* 6.4 Write property test for timer reset restoring full duration (Property 11)
    - **Property 11: Timer reset always restores full duration**
    - Use fast-check to generate arbitrary timer states (random `remaining`, `running` boolean); call `timer.reset()`; assert `remaining === 1500` and `running === false`
    - **Validates: Requirements 2.6**
  - [ ]* 6.5 Write unit tests for the timer widget
    - Test initial render shows `25:00`; Start disables Start button and enables Stop; Stop disables Stop and enables Start and Reset; Reset restores `25:00` and hides complete indicator
    - Test `tick()` from `remaining = 1` → clamps to 0, sets running false, shows complete indicator
    - Test Start when `remaining === 0` auto-resets and begins countdown
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

- [ ] 7. Task Manager widget — `[6] TASK MANAGER WIDGET` and `[8] STORAGE SYNC HELPERS` sections of `app.js`
  - [x] 7.1 Implement `tasks.add(description)` and `syncTasks()` helper
    - `tasks.add()`: trim input; reject if empty or length > 500 (show `#task-error`, return); create Task object `{ id: crypto.randomUUID() || Date.now().toString(), description: trimmed, completed: false }`; push to `state.tasks`; call `syncTasks()`; on sync failure roll back push and show `#task-storage-error`; on success call `tasks.render()` and clear input
    - `syncTasks()`: calls `storage.write('tdl_tasks', state.tasks)`; returns the boolean result
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.4_
  - [-] 7.2 Implement `tasks.edit(id, newDescription)` and `tasks.toggle(id)`
    - `tasks.edit()`: trim input; reject if empty or length > 500 (show inline validation, retain original); find task by id; update `description` only; call `syncTasks()`; on failure roll back; call `tasks.render()`
    - `tasks.toggle()`: find task by id; flip `completed` boolean; call `syncTasks()`; call `tasks.render()`
    - _Requirements: 3.4, 3.5, 3.6, 3.7_
  - [~] 7.3 Implement `tasks.delete(id)` and `tasks.render()`
    - `tasks.delete()`: remove task by id from `state.tasks`; call `syncTasks()`; call `tasks.render()`
    - `tasks.render()`: clear `#task-list`; for each task create a `<li>` containing a checkbox (bound to `toggle`), a `<span>` with description (add `.task--completed` class when `completed === true`), an Edit button (switches span to inline `<input>` with confirm/cancel controls), and a Delete button (bound to `delete`)
    - _Requirements: 3.7, 3.8, 3.9_
  - [~] 7.4 Implement `tasks.init()` — wire up form submission and load from state
    - Cache DOM refs; bind submit handler on the add form (prevent default, call `tasks.add`); call `tasks.render()` (state already populated by bootstrap)
    - _Requirements: 3.1, 3.9, 3.10, 3.11_
  - [ ]* 7.5 Write property test for whitespace task descriptions always being rejected (Property 3)
    - **Property 3: Whitespace task descriptions are always rejected**
    - Use fast-check to generate strings composed entirely of whitespace characters; assert `state.tasks` length and contents are unchanged after `tasks.add()`
    - **Validates: Requirements 3.3**
  - [ ]* 7.6 Write property test for valid task addition growing the list by exactly one (Property 4)
    - **Property 4: Valid task addition grows the list by exactly one**
    - Use fast-check to generate valid 1–500 character non-whitespace strings; assert `state.tasks.length` increases by exactly 1 and the new task has trimmed description and `completed: false`
    - **Validates: Requirements 3.2**
  - [ ]* 7.7 Write property test for task toggle being its own inverse (Property 5)
    - **Property 5: Task toggle is idempotent over two applications**
    - Use fast-check to generate a task array and a valid id; call `toggle(id)` twice; assert `completed` field equals original value
    - **Validates: Requirements 3.7**
  - [ ]* 7.8 Write property test for task edit preserving identity and completion (Property 6)
    - **Property 6: Task edit preserves identity and completion state**
    - Use fast-check to generate a task array and a valid replacement description; call `tasks.edit(id, newDesc)`; assert `id` and `completed` are unchanged and only `description` differs
    - **Validates: Requirements 3.5**
  - [ ]* 7.9 Write unit tests for the task manager widget
    - Test `add` with empty string, whitespace-only, 501-char string → rejected, `#task-error` shown
    - Test `add` with valid string → task appended, `#task-input` cleared, `#task-error` hidden
    - Test `edit` with empty string → rejected, original text preserved
    - Test `delete` removes correct task by id
    - Test `render` applies `.task--completed` and strikethrough only to completed tasks
    - Test storage failure path → mutation rolled back, `#task-storage-error` shown
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

- [~] 8. Checkpoint — Task Manager
  - Ensure all implemented tests pass. Verify in a browser that tasks can be added, edited, completed, and deleted, and that they survive a page reload. Ask the user if questions arise.

- [ ] 9. Quick Links widget — `[7] QUICK LINKS WIDGET` and `[8] STORAGE SYNC HELPERS` sections of `app.js`
  - [~] 9.1 Implement `links.validateUrl(url)` and `links.add(label, url)`
    - `links.validateUrl(url)`: returns `true` if `url` starts with `"http://"` or `"https://"`
    - `links.add()`: validate label (non-empty, ≤50 chars); validate url (non-empty, passes `validateUrl`, ≤2048 chars); check `state.links.length < 20`; on any failure show `#link-error` with a specific message and return without mutating state; on success create Link object with UUID, push to `state.links`, call `syncLinks()`, on sync failure roll back, show `#link-storage-error`; on success call `links.render()` and clear both input fields
    - `syncLinks()`: calls `storage.write('tdl_links', state.links)`; returns the boolean result
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.8, 5.2, 5.4_
  - [~] 9.2 Implement `links.delete(id)` and `links.render()`
    - `links.delete()`: remove link by id from `state.links`; call `syncLinks()`; call `links.render()`
    - `links.render()`: clear `#link-list`; for each link create a `<button>` that calls `window.open(url, '_blank')` on click, labelled with `link.label`, plus a separate delete control bound to `links.delete(id)`
    - _Requirements: 4.5, 4.6_
  - [~] 9.3 Implement `links.init()` — wire up form submission and load from state
    - Cache DOM refs; bind submit handler on the add form (prevent default, call `links.add`); call `links.render()`
    - _Requirements: 4.1, 4.7_
  - [ ]* 9.4 Write property test for invalid URL links always being rejected (Property 7)
    - **Property 7: Invalid URL links are always rejected**
    - Use fast-check to generate label/URL pairs where the URL does not start with `http://` or `https://`; assert `state.links` length and contents are unchanged after `links.add()`
    - **Validates: Requirements 4.4**
  - [ ]* 9.5 Write property test for links beyond the 20-item cap being rejected (Property 8)
    - **Property 8: Links beyond the 20-item cap are rejected**
    - Use fast-check to generate any valid label/URL pair; pre-fill `state.links` with exactly 20 entries; call `links.add()`; assert `state.links.length === 20`
    - **Validates: Requirements 4.8**
  - [ ]* 9.6 Write unit tests for the quick links widget
    - Test `add` with empty label → rejected, `#link-error` shown
    - Test `add` with empty URL → rejected, `#link-error` shown
    - Test `add` with URL lacking `http://` or `https://` prefix → rejected with specific message
    - Test `add` at 20-link cap → rejected with cap message, input values preserved
    - Test `add` with valid label + URL → link appended, inputs cleared
    - Test `delete` removes correct link by id
    - Test `render` each link button opens URL in new tab (`target="_blank"` or `window.open`)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [ ] 10. Bootstrap and error handling wiring — `[3] STATE` and `[9] BOOTSTRAP` sections of `app.js`
  - [~] 10.1 Implement the `state` object and bootstrap sequence in the `DOMContentLoaded` handler
    - Define `const state = { tasks: [], links: [], timer: { remaining: 1500, running: false, intervalId: null } }`
    - In `DOMContentLoaded`: check `storage.isAvailable()`; if unavailable, show a non-blocking warning banner visible for ≥3 seconds, then continue with empty `state.tasks` and `state.links`
    - If available: call `storage.read('tdl_tasks')` and `storage.read('tdl_links')`; on corrupt-key flag show the corruption warning banner; populate `state.tasks` and `state.links` (default to `[]` on null/corrupt)
    - Call `clock.init()`, `timer.init()`, `tasks.init()`, `links.init()` each inside its own try/catch so a failure in one does not prevent others from initialising
    - _Requirements: 3.9, 3.10, 4.7, 5.3, 5.5, 5.7, 7.7_
  - [~] 10.2 Implement the global `window.onerror` handler and non-blocking notification utility
    - Register `window.onerror` to catch unhandled runtime errors, log to console, and ensure no blank-page crash
    - Implement a shared `showNotification(message, type, duration)` utility (used by storage warnings, corruption alerts, and write-failure messages) that creates and auto-dismisses a non-blocking banner after `duration` ms (minimum 3000 ms for warnings)
    - _Requirements: 5.5, 5.6, 5.7, 7.7_
  - [ ]* 10.3 Write unit tests for bootstrap error paths
    - Test `storage.isAvailable() === false` at boot → warning banner shown, widgets initialise with empty state
    - Test corrupt JSON in `tdl_tasks` key → corruption banner shown, `state.tasks` defaults to `[]`
    - Test each `widget.init()` throwing → other widgets still initialise
    - _Requirements: 3.10, 4.7, 5.5, 5.7, 7.7_

- [~] 11. Final checkpoint — Full integration
  - Ensure all implemented tests pass. Open `index.html` directly in Chrome and Firefox as a local file. Verify all four widgets render, interact correctly, and survive a page reload with data intact. Verify layout on a narrow viewport (320px). Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- The IIFE structure means all modules are defined before the `DOMContentLoaded` bootstrap runs — no import/export needed
- Property tests require `vitest` and `fast-check` as dev dependencies; they test pure logic extracted from the IIFE, not the full DOM
- Checkpoints at tasks 5, 8, and 11 provide natural validation gates before moving to the next widget group
- Requirements 6 (layout/visual) and 7 (technical constraints) are validated by manual cross-browser smoke tests, not automated tests

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "3.2", "3.3", "3.4", "4.1"] },
    { "id": 4, "tasks": ["4.2", "6.1"] },
    { "id": 5, "tasks": ["4.3", "4.4", "6.2"] },
    { "id": 6, "tasks": ["6.3", "6.4", "6.5", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.5", "7.6"] },
    { "id": 8, "tasks": ["7.3", "7.7", "7.8"] },
    { "id": 9, "tasks": ["7.4", "7.9", "9.1"] },
    { "id": 10, "tasks": ["9.2", "9.4", "9.5"] },
    { "id": 11, "tasks": ["9.3", "9.6"] },
    { "id": 12, "tasks": ["10.1"] },
    { "id": 13, "tasks": ["10.2", "10.3"] }
  ]
}
```
