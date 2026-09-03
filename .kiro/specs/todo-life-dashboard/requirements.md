# Requirements Document

## Introduction

The Todo Life Dashboard is a personal productivity web application built with pure HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend, using the Local Storage API for all data persistence. The dashboard combines four core widgets — a contextual greeting with live clock, a Pomodoro-style focus timer, a task manager, and a quick-links launcher — into a single clean, minimal interface. It can be used as a standalone HTML page or packaged as a browser extension.

## Glossary

- **Dashboard**: The single-page web application that hosts all four widgets.
- **Greeting_Widget**: The section that displays the current time, date, and a time-sensitive greeting message.
- **Timer**: The Pomodoro-style countdown timer widget with a 25-minute default duration.
- **Task_Manager**: The widget responsible for creating, editing, completing, and deleting to-do items.
- **Task**: A single to-do item consisting of a text description and a completion state.
- **Quick_Links**: The widget that stores and displays user-defined shortcut buttons to external URLs.
- **Link**: A user-defined entry consisting of a label and a URL stored in Quick_Links.
- **Storage**: The browser's Local Storage API used as the sole persistence layer.
- **Session**: A single active browser tab or window in which the Dashboard is loaded.

---

## Requirements

### Requirement 1: Live Greeting and Clock Display

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the dashboard, so that I am immediately oriented and welcomed without any manual input.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS 24-hour format, where HH is 00–23, MM is 00–59, and SS is 00–59.
2. THE Greeting_Widget SHALL display the current date in the format "[Full Weekday Name], [Day] [Full Month Name] [4-digit Year]" (e.g., Wednesday, 3 September 2026), where day is not zero-padded.
3. WHEN the local hour is between 05:00 and 11:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Morning" and no other greeting simultaneously.
4. WHEN the local hour is between 12:00 and 17:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Afternoon" and no other greeting simultaneously.
5. WHEN the local hour is between 18:00 and 20:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Evening" and no other greeting simultaneously.
6. WHEN the local hour is between 21:00 and 23:59 inclusive, or between 00:00 and 04:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Night" and no other greeting simultaneously.
7. WHEN the Session is active, THE Greeting_Widget SHALL update the displayed time every 1000 milliseconds (±50 ms) without requiring a page reload.
8. IF the local time source is unavailable, THEN THE Greeting_Widget SHALL display an error message indicating that the time cannot be retrieved, and shall not display a partial or stale time value.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can structure my work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. THE Timer SHALL initialize with a countdown duration of 25 minutes (1500 seconds).
2. THE Timer SHALL display the remaining time in MM:SS format at all times.
3. WHEN the user activates the Start control, THE Timer SHALL begin counting down one second per second.
4. WHILE the Timer is counting down, THE Timer SHALL update the displayed remaining time every second.
5. WHEN the user activates the Stop control, THE Timer SHALL pause the countdown and retain the remaining time.
6. WHEN the user activates the Reset control, THE Timer SHALL stop any active countdown and restore the remaining time to 25:00.
7. WHEN the countdown reaches 00:00, THE Timer SHALL stop automatically and display a visible session-complete indicator in the timer area.
8. WHILE the Timer is counting down, THE Timer SHALL disable the Start control to prevent duplicate timers.
9. WHILE the Timer is paused or stopped, THE Timer SHALL disable the Stop control.
10. IF the user activates the Start control while the remaining time is 00:00, THEN THE Timer SHALL reset the remaining time to 25:00 and begin counting down.
11. WHILE the Timer is counting down, THE Timer SHALL disable the Reset control to prevent interruption of an active session.

---

### Requirement 3: To-Do List Management

**User Story:** As a user, I want to add, edit, complete, and delete tasks that persist across browser sessions, so that I can track my daily responsibilities without losing data on page reload.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an input field accepting up to 500 characters and a submission control for adding new Tasks.
2. WHEN the user submits a new Task with a non-empty, non-whitespace-only description of 1–500 characters, THE Task_Manager SHALL append the Task to the task list, assign it a unique identifier and a default incomplete completion state, and save it to Storage within 500 milliseconds.
3. IF the user submits a Task with an empty or whitespace-only description, THEN THE Task_Manager SHALL reject the submission, display an inline validation message indicating the description is required, and leave the task list unchanged.
4. WHEN the user activates the edit control on a Task, THE Task_Manager SHALL display the Task description in an editable field pre-filled with the current text and accept up to 500 characters.
5. WHEN the user confirms an edit with a non-empty, non-whitespace-only description of 1–500 characters, THE Task_Manager SHALL update the Task text in the list and in Storage within 500 milliseconds, preserving the Task's existing completion state and unique identifier.
6. IF the user confirms an edit with an empty or whitespace-only description, THEN THE Task_Manager SHALL reject the update, display an inline validation message indicating the description is required, and retain the original Task text in the list and in Storage.
7. WHEN the user toggles the completion control on a Task, THE Task_Manager SHALL update the Task's completion state and apply a strikethrough style to the Task description to reflect the completed state, then persist the change to Storage within 500 milliseconds.
8. WHEN the user activates the delete control on a Task, THE Task_Manager SHALL remove the Task from the list and from Storage within 500 milliseconds, with no confirmation prompt required.
9. WHEN the Dashboard loads, THE Task_Manager SHALL read all Tasks from Storage and render them in the task list within 1 second, preserving each Task's saved description, completion state, and unique identifier.
10. IF Storage is unavailable when the Dashboard loads, THEN THE Task_Manager SHALL display an error message indicating tasks could not be loaded and render an empty task list.
11. IF Storage is unavailable when the user performs an add, edit, complete, or delete operation, THEN THE Task_Manager SHALL reject the operation and display an error message indicating the change could not be saved, leaving the task list in its previous state.

---

### Requirement 4: Quick Links Management

**User Story:** As a user, I want to add, view, and delete personal shortcut buttons that open my favorite websites, so that I can launch frequently visited pages with a single click without reconfiguring them after a page reload.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide an input field for a link label (max 50 characters), an input field for a URL (max 2048 characters), and a submission control for adding new Links.
2. WHEN the user submits a new Link with both a non-empty label and a valid URL, THE Quick_Links widget SHALL add a shortcut button to the display, save the Link to Storage, and clear both input fields.
3. IF the user submits a Link with an empty label or an empty URL, THEN THE Quick_Links widget SHALL reject the submission, display an inline validation message identifying the missing field(s), and preserve the entered values in the input fields.
4. IF the user submits a Link with a URL that does not begin with "http://" or "https://", THEN THE Quick_Links widget SHALL reject the submission, display an inline validation message indicating the URL must begin with http:// or https://, and preserve the entered values in the input fields.
5. WHEN the user activates a Link button, THE Quick_Links widget SHALL open the associated URL in a new browser tab while the Dashboard tab remains open.
6. WHEN the user activates the delete control on a Link, THE Quick_Links widget SHALL remove the Link button from the display and from Storage.
7. WHEN the Dashboard loads, THE Quick_Links widget SHALL read all Links from Storage and render the corresponding shortcut buttons within 500 milliseconds.
8. THE Quick_Links widget SHALL allow a maximum of 20 Links to be stored; IF the user attempts to add a Link when 20 Links already exist, THEN THE Quick_Links widget SHALL reject the submission and display an inline message indicating the maximum limit has been reached.
9. IF Storage is unavailable when the user adds or deletes a Link, THEN THE Quick_Links widget SHALL reject the operation and display a non-blocking error message indicating the change could not be saved.

---

### Requirement 5: Data Persistence via Local Storage

**User Story:** As a user, I want all my tasks and quick links to be automatically saved in the browser, so that my data is available the next time I open the dashboard without any manual export or import.

#### Acceptance Criteria

1. THE Storage layer SHALL persist Task data under the key `tdl_tasks` in Local Storage.
2. THE Storage layer SHALL persist Link data under the key `tdl_links` in Local Storage.
3. WHEN the Dashboard loads, THE Storage layer SHALL read and deserialize Task and Link data from Local Storage before any Task or Link widget renders.
4. WHEN Task or Link data changes, THE Storage layer SHALL serialize and write the updated data as valid JSON to the corresponding Local Storage key within 500 milliseconds of the change.
5. IF Local Storage is unavailable or a read operation fails on Dashboard load, THEN THE Dashboard SHALL display a non-blocking warning message visible for at least 3 seconds and continue rendering the affected widget with an empty data set.
6. IF a Local Storage write operation fails, THEN THE Storage layer SHALL display a non-blocking error message indicating that data could not be saved and retain the previous successfully saved state in Local Storage.
7. IF the value retrieved from a Local Storage key is not valid JSON, THEN THE Storage layer SHALL discard that value, treat the affected widget's data set as empty, and display a non-blocking warning message indicating corrupted data was found.

---

### Requirement 6: Layout and Visual Design

**User Story:** As a user, I want a clean, minimal, and visually consistent interface, so that I can focus on my work without distracting or confusing UI.

#### Acceptance Criteria

1. THE Dashboard SHALL present all four widgets (Greeting_Widget, Timer, Task_Manager, Quick_Links) in a single-page layout with no navigation or routing required.
2. THE Dashboard SHALL use a single CSS file located at `css/style.css` for all visual styling.
3. THE Dashboard SHALL apply a uniform spacing scale where the minimum margin or padding between widgets is 8px and the maximum is 48px, a limited set of no more than 3 font families, and a color palette of no more than 5 distinct colors, such that each widget is visually distinct from adjacent widgets without requiring scrolling to identify widget boundaries.
4. THE Dashboard SHALL be usable on viewport widths from 320px to at least 1440px without horizontal scrolling or overlapping content.
5. WHEN interactive controls (buttons, inputs) receive keyboard focus, THE Dashboard SHALL display a visible focus indicator with a minimum outline width of 2px and a color contrast ratio of at least 3:1 against the adjacent background color.
6. THE Dashboard SHALL use font sizes of at least 14px for body text and at least 16px for input fields.
7. IF the viewport width is less than 768px, THEN THE Dashboard SHALL stack all widgets in a single column with no widget narrower than 280px.
8. IF the viewport width is 768px or greater, THEN THE Dashboard SHALL arrange widgets in a layout of at least 2 columns with no widget wider than 100% of its grid cell.

---

### Requirement 7: Technical Constraints and Code Quality

**User Story:** As a developer, I want the codebase to follow strict file and technology constraints, so that the project remains simple, dependency-free, and easy to maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no external frameworks, libraries, or build tools.
2. THE Dashboard SHALL use exactly one JavaScript file located at `js/app.js` for all scripting logic.
3. THE Dashboard SHALL use exactly one CSS file located at `css/style.css` for all styling.
4. THE Dashboard SHALL load and render all visible content without errors or warnings in the browser console in the latest stable versions of Chrome, Firefox, Edge, and Safari without polyfills or transpilation.
5. THE Dashboard SHALL be deployable as a standalone HTML file opened directly in a browser without requiring a web server, such that all features function correctly with no failed resource requests.
6. WHEN the Dashboard is opened in a browser, THE Dashboard SHALL consist of exactly one HTML file, one CSS file at `css/style.css`, and one JavaScript file at `js/app.js`, with no additional script or stylesheet files loaded.
7. IF any JavaScript runtime error occurs during Dashboard load or interaction, THEN THE Dashboard SHALL not crash or produce a blank page, and the unaffected sections SHALL remain visible and functional.
