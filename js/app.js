(function () {
  'use strict';

  /* =========================================================
   * [1] CONSTANTS & CONFIG
   * ========================================================= */

  /* =========================================================
   * [2] STORAGE MODULE
   * ========================================================= */

  const storage = (function () {
    // Tracks keys whose stored values failed JSON.parse
    const _corruptKeys = new Set();

    /**
     * Tests whether localStorage is accessible by performing a
     * probe write/read/remove. Returns true if available, false otherwise.
     * @returns {boolean}
     */
    function isAvailable() {
      const TEST_KEY = '__tdl_test__';
      try {
        localStorage.setItem(TEST_KEY, '1');
        localStorage.removeItem(TEST_KEY);
        return true;
      } catch (_e) {
        return false;
      }
    }

    /**
     * Reads and JSON-parses the value stored under `key`.
     * Returns the parsed value, or null if the key is absent or the
     * value is not valid JSON. Sets an internal corruption flag for
     * the key when a parse error occurs.
     * @param {string} key
     * @returns {any|null}
     */
    function read(key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) {
          return null;
        }
        return JSON.parse(raw);
      } catch (_e) {
        // JSON.parse failure — mark the key as corrupt
        _corruptKeys.add(key);
        return null;
      }
    }

    /**
     * Returns true if the last read for `key` encountered a JSON
     * parse error, false otherwise. Used by the bootstrap to decide
     * whether to show a corruption warning banner.
     * @param {string} key
     * @returns {boolean}
     */
    function isCorrupt(key) {
      return _corruptKeys.has(key);
    }

    /**
     * JSON-stringifies `data` and writes it to localStorage under `key`.
     * Returns true on success, false if the write throws (e.g. storage full
     * or access denied).
     * @param {string} key
     * @param {any} data
     * @returns {boolean}
     */
    function write(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (_e) {
        return false;
      }
    }

    return { isAvailable, read, isCorrupt, write };
  })();

  /* =========================================================
   * [3] STATE
   * ========================================================= */

  const state = {
    tasks: [],       // Task[] — loaded from tdl_tasks on boot
    links: [],       // Link[] — loaded from tdl_links on boot
    timer: {
      remaining: 1500,   // seconds remaining (default 25:00)
      running:   false,  // whether the countdown interval is active
      intervalId: null   // reference returned by setInterval
    }
  };

  /* =========================================================
   * [4] GREETING / CLOCK WIDGET
   * ========================================================= */

  const clock = (function () {
    // DOM refs — cached by clock.init(), null until then
    let _elTime     = null;
    let _elDate     = null;
    let _elGreeting = null;
    let _elError    = null;

    /**
     * Returns a contextual greeting string for the given local hour.
     * Covers all 24 hours (total) and returns exactly one string (exclusive).
     *
     * hour  5–11  → "Good Morning"
     * hour 12–17  → "Good Afternoon"
     * hour 18–20  → "Good Evening"
     * hour 21–23 or 0–4 → "Good Night"
     *
     * @param {number} hour - Integer in [0, 23]
     * @returns {string}
     */
    function getGreeting(hour) {
      if (hour >= 5 && hour <= 11) {
        return 'Good Morning';
      }
      if (hour >= 12 && hour <= 17) {
        return 'Good Afternoon';
      }
      if (hour >= 18 && hour <= 20) {
        return 'Good Evening';
      }
      // Covers 21–23 and 0–4
      return 'Good Night';
    }

    /**
     * Caches DOM references for the clock widget, fires an immediate tick
     * to populate the display, and schedules a 1-second interval.
     */
    function init() {
      _elTime     = document.getElementById('clock-time');
      _elDate     = document.getElementById('clock-date');
      _elGreeting = document.getElementById('clock-greeting');
      _elError    = document.getElementById('clock-error');

      tick();
      setInterval(tick, 1000);
    }

    /**
     * Reads the current Date, formats it, and updates the DOM.
     * On any failure hides the time/date/greeting and shows an error.
     */
    function tick() {
      try {
        const now = new Date();

        // HH:MM:SS (zero-padded, 24-hour) — Requirement 1.1
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const timeStr = hh + ':' + mm + ':' + ss;

        // "Weekday, D Month YYYY" — day NOT zero-padded — Requirement 1.2
        const WEEKDAYS = [
          'Sunday', 'Monday', 'Tuesday', 'Wednesday',
          'Thursday', 'Friday', 'Saturday'
        ];
        const MONTHS = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const dateStr =
          WEEKDAYS[now.getDay()] + ', ' +
          now.getDate() + ' ' +
          MONTHS[now.getMonth()] + ' ' +
          now.getFullYear();

        // Greeting based on local hour — Requirements 1.3–1.6
        const greeting = getGreeting(now.getHours());

        // Update the DOM
        if (_elTime)     { _elTime.textContent     = timeStr; }
        if (_elDate)     { _elDate.textContent     = dateStr; }
        if (_elGreeting) { _elGreeting.textContent = greeting; }

        // Ensure the error element is hidden on a successful tick
        if (_elError) { _elError.classList.add('is-hidden'); }

      } catch (_e) {
        // Requirement 1.8: hide partial/stale values; show error message
        if (_elTime)     { _elTime.textContent     = ''; }
        if (_elDate)     { _elDate.textContent     = ''; }
        if (_elGreeting) { _elGreeting.textContent = ''; }
        if (_elError) {
          _elError.textContent = 'Unable to retrieve the current time.';
          _elError.classList.remove('is-hidden');
        }
      }
    }

    return { getGreeting, init, tick };
  })();

  /* =========================================================
   * [5] TIMER WIDGET
   * ========================================================= */

  const timer = (function () {
    // DOM refs — cached by timer.init(), null until then
    let _elDisplay  = null;
    let _elStart    = null;
    let _elStop     = null;
    let _elReset    = null;
    let _elComplete = null;

    /**
     * Formats a total number of seconds into a "MM:SS" string.
     * Both minutes and seconds are zero-padded to two digits.
     * @param {number} totalSeconds - Non-negative integer
     * @returns {string} e.g. "25:00", "04:37"
     */
    function _formatTime(totalSeconds) {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    /**
     * Renders the current timer state to the DOM:
     * - Updates #timer-display with the formatted MM:SS remaining time
     * - Shows/hides the #timer-complete indicator based on remaining === 0
     * - Syncs disabled attributes on the three control buttons:
     *     Start  → disabled while timer is running
     *     Stop   → disabled while timer is NOT running (paused/stopped)
     *     Reset  → disabled while timer is running
     */
    function render() {
      if (!_elDisplay) return; // guard: init not yet called

      // Update countdown display
      _elDisplay.textContent = _formatTime(state.timer.remaining);

      // Session-complete indicator: visible only when remaining hits 0
      if (state.timer.remaining === 0) {
        _elComplete.classList.remove('is-hidden');
      } else {
        _elComplete.classList.add('is-hidden');
      }

      // Button disabled states
      // Start: disabled while running (req 2.8)
      _elStart.disabled = state.timer.running;
      // Stop: disabled while NOT running (req 2.9)
      _elStop.disabled = !state.timer.running;
      // Reset: disabled while running (req 2.11)
      _elReset.disabled = state.timer.running;
    }

    /**
     * Caches DOM references, renders the initial state, and binds
     * click handlers for the Start, Stop, and Reset buttons.
     */
    function init() {
      _elDisplay  = document.getElementById('timer-display');
      _elStart    = document.getElementById('timer-start');
      _elStop     = document.getElementById('timer-stop');
      _elReset    = document.getElementById('timer-reset');
      _elComplete = document.getElementById('timer-complete');

      // Render the initial 25:00 state (req 2.1, 2.2)
      render();

      // Bind control handlers
      _elStart.addEventListener('click', function () { timer.start(); });
      _elStop.addEventListener('click',  function () { timer.stop();  });
      _elReset.addEventListener('click', function () { timer.reset(); });
    }

    /**
     * Starts the countdown. If remaining is already 0, resets to 25:00 first
     * (Requirement 2.10). Sets running = true, schedules a 1-second interval,
     * and re-renders the widget.
     */
    function start() {
      if (state.timer.remaining === 0) {
        timer.reset();
      }
      state.timer.running = true;
      state.timer.intervalId = setInterval(function () { timer.tick(); }, 1000);
      render();
    }

    /**
     * Pauses the countdown by clearing the interval. Sets running = false
     * and re-renders so button disabled states update (Requirement 2.5).
     */
    function stop() {
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
      state.timer.running = false;
      render();
    }

    /**
     * Stops any active countdown and restores remaining to 1500 (25:00).
     * Hides the session-complete indicator and re-renders (Requirement 2.6).
     */
    function reset() {
      timer.stop();
      state.timer.remaining = 1500;
      if (_elComplete) {
        _elComplete.classList.add('is-hidden');
      }
      render();
    }

    /**
     * Called every second by the interval. Decrements remaining by 1.
     * Clamps to 0 when the countdown expires, stops the timer, and shows
     * the session-complete indicator (Requirements 2.4, 2.7).
     */
    function tick() {
      state.timer.remaining -= 1;
      if (state.timer.remaining <= 0) {
        state.timer.remaining = 0;
        timer.stop();
        if (_elComplete) {
          _elComplete.classList.remove('is-hidden');
        }
      }
      render();
    }

    return { init, render, start, stop, reset, tick };
  })();

  /* =========================================================
   * [6] TASK MANAGER WIDGET
   * ========================================================= */

  const tasks = (function () {
    // DOM refs — cached by tasks.init(), null until then
    let _elInput        = null;
    let _elError        = null;
    let _elStorageError = null;
    let _elList         = null;

    /**
     * Generates a unique identifier for a new task.
     * Prefers crypto.randomUUID() when available; falls back to a
     * timestamp string so the app works in older environments.
     * @returns {string}
     */
    function _generateId() {
      return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : Date.now().toString();
    }

    /**
     * Adds a new task to the list.
     *
     * Validation rules (Requirement 3.3):
     *   - Trim the input string first.
     *   - Reject if the trimmed string is empty.
     *   - Reject if the trimmed string exceeds 500 characters.
     *
     * On success (Requirement 3.2):
     *   - Create a Task object with a unique id, the trimmed description,
     *     and completed = false.
     *   - Push to state.tasks.
     *   - Call syncTasks(); on failure roll back the push and show
     *     #task-storage-error (Requirement 3.11).
     *   - On success: call tasks.render(), clear the input field,
     *     and hide #task-error.
     *
     * @param {string} description - Raw text from the input field
     */
    function add(description) {
      const trimmed = (description || '').trim();

      // --- Input validation ---
      if (trimmed.length === 0 || trimmed.length > 500) {
        if (_elError) {
          _elError.textContent = trimmed.length === 0
            ? 'Task description is required.'
            : 'Task description must be 500 characters or fewer.';
          _elError.classList.remove('is-hidden');
        }
        return;
      }

      // --- Create task object ---
      const task = {
        id:          _generateId(),
        description: trimmed,
        completed:   false
      };

      // --- Mutate state ---
      state.tasks.push(task);

      // --- Persist ---
      const saved = syncTasks();
      if (!saved) {
        // Roll back the push so in-memory state stays consistent with storage
        state.tasks.pop();
        if (_elStorageError) {
          _elStorageError.textContent = 'Could not save task. Please try again.';
          _elStorageError.classList.remove('is-hidden');
        }
        return;
      }

      // --- Success: update UI ---
      tasks.render();
      if (_elInput)  { _elInput.value = ''; }
      if (_elError)  { _elError.classList.add('is-hidden'); }
    }

    /**
     * Updates the description of an existing task.
     *
     * Validation rules (Requirements 3.5, 3.6):
     *   - Trim newDescription first.
     *   - Reject if trimmed string is empty or exceeds 500 characters:
     *     show #task-error and return without changing state.
     *
     * On success (Requirement 3.5):
     *   - Save the original description for rollback.
     *   - Update task.description (preserve id and completed unchanged).
     *   - Call syncTasks(); on failure restore original description,
     *     show #task-storage-error, and call tasks.render().
     *   - On success: call tasks.render().
     *
     * @param {string} id - ID of the task to update
     * @param {string} newDescription - Replacement description text
     */
    function edit(id, newDescription) {
      const trimmed = (newDescription || '').trim();

      // --- Input validation ---
      if (trimmed.length === 0 || trimmed.length > 500) {
        if (_elError) {
          _elError.textContent = trimmed.length === 0
            ? 'Task description is required.'
            : 'Task description must be 500 characters or fewer.';
          _elError.classList.remove('is-hidden');
        }
        return;
      }

      // --- Find task by id ---
      const task = state.tasks.find(function (t) { return t.id === id; });
      if (!task) return;

      // --- Save original for rollback ---
      const originalDesc = task.description;

      // --- Mutate description only; preserve id and completed ---
      task.description = trimmed;

      // --- Persist ---
      const saved = syncTasks();
      if (!saved) {
        // Roll back to original description
        task.description = originalDesc;
        if (_elStorageError) {
          _elStorageError.textContent = 'Could not save change. Please try again.';
          _elStorageError.classList.remove('is-hidden');
        }
        tasks.render();
        return;
      }

      // --- Success ---
      tasks.render();
    }

    /**
     * Toggles the completed state of a task (Requirement 3.7).
     *
     * - Finds the task by id.
     * - Flips task.completed boolean.
     * - Calls syncTasks(); on failure flips it back and shows
     *   #task-storage-error.
     * - On success: calls tasks.render().
     *
     * @param {string} id - ID of the task to toggle
     */
    function toggle(id) {
      // --- Find task by id ---
      const task = state.tasks.find(function (t) { return t.id === id; });
      if (!task) return;

      // --- Flip completed boolean ---
      task.completed = !task.completed;

      // --- Persist ---
      const saved = syncTasks();
      if (!saved) {
        // Roll back the flip
        task.completed = !task.completed;
        if (_elStorageError) {
          _elStorageError.textContent = 'Could not save change. Please try again.';
          _elStorageError.classList.remove('is-hidden');
        }
        return;
      }

      // --- Success ---
      tasks.render();
    }

    /**
     * Removes a task from the list by id.
     * Stub — will be fully implemented in task 7.3.
     * @param {string} id
     */
    function deleteFn(id) {
  const index = state.tasks.findIndex(function (task) {
    return task.id === id;
  });

  if (index === -1) return;

  const deletedTask = state.tasks[index];

  state.tasks.splice(index, 1);

  const saved = syncTasks();

  if (!saved) {
    state.tasks.splice(index, 0, deletedTask);

    if (_elStorageError) {
      _elStorageError.textContent = 'Could not delete task. Please try again.';
      _elStorageError.classList.remove('is-hidden');
    }

    return;
  }

  tasks.render();
}

function render() {
  if (!_elList) return;

  _elList.innerHTML = '';

  state.tasks.forEach(function (task) {
    const li = document.createElement('li');
    li.className = 'task-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Mark task as done');

    checkbox.addEventListener('change', function () {
      tasks.toggle(task.id);
    });

    const description = document.createElement('span');
    description.textContent = task.description;

    if (task.completed) {
      description.classList.add('task-completed');
    }

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Edit';

    editButton.addEventListener('click', function () {
      const newDescription = window.prompt(
        'Edit task:',
        task.description
      );

      if (newDescription !== null) {
        tasks.edit(task.id, newDescription);
      }
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';

    deleteButton.addEventListener('click', function () {
      tasks.delete(task.id);
    });

    li.appendChild(checkbox);
    li.appendChild(description);
    li.appendChild(editButton);
    li.appendChild(deleteButton);

    _elList.appendChild(li);
  });
}

    /**
     * Caches DOM refs, binds the add-form submit handler, and
     * calls tasks.render() to hydrate from the already-populated state.
     * Stub — will be fully implemented in task 7.4.
     */
    function init() {
  _elInput        = document.getElementById('task-input');
  _elError        = document.getElementById('task-error');
  _elStorageError = document.getElementById('task-storage-error');
  _elList         = document.getElementById('task-list');

  const form = document.getElementById('task-form');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      add(_elInput ? _elInput.value : '');
    });
  }

  tasks.render();
}

    return { add, edit, toggle, delete: deleteFn, render, init };
  })();

    const links = (function () {

    // DOM refs
    let _elLabel = null;
    let _elUrl = null;
    let _elError = null;
    let _elStorageError = null;
    let _elList = null;

    function _generateId() {
      return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : Date.now().toString();
    }

    function add(label, url) {
      const trimmedLabel = (label || '').trim();
      const trimmedUrl = (url || '').trim();

      // Validate label
      if (trimmedLabel.length === 0) {
        if (_elError) {
          _elError.textContent = 'Link label is required.';
          _elError.classList.remove('is-hidden');
        }
        return;
      }

      // Validate URL
      let validUrl;

      try {
        validUrl = new URL(trimmedUrl);

        if (validUrl.protocol !== 'http:' && validUrl.protocol !== 'https:') {
          throw new Error('Invalid protocol');
        }
      } catch (_e) {
        if (_elError) {
          _elError.textContent = 'Please enter a valid URL.';
          _elError.classList.remove('is-hidden');
        }
        return;
      }

      const link = {
        id: _generateId(),
        label: trimmedLabel,
        url: validUrl.href
      };

      state.links.push(link);

      const saved = syncLinks();

      if (!saved) {
        state.links.pop();

        if (_elStorageError) {
          _elStorageError.textContent = 'Could not save link. Please try again.';
          _elStorageError.classList.remove('is-hidden');
        }

        return;
      }

      links.render();

      if (_elLabel) {
        _elLabel.value = '';
      }

      if (_elUrl) {
        _elUrl.value = '';
      }

      if (_elError) {
        _elError.classList.add('is-hidden');
      }

      if (_elStorageError) {
        _elStorageError.classList.add('is-hidden');
      }
    }

    function deleteFn(id) {
      const index = state.links.findIndex(function (link) {
        return link.id === id;
      });

      if (index === -1) return;

      const deletedLink = state.links[index];

      state.links.splice(index, 1);

      const saved = syncLinks();

      if (!saved) {
        state.links.splice(index, 0, deletedLink);

        if (_elStorageError) {
          _elStorageError.textContent = 'Could not delete link. Please try again.';
          _elStorageError.classList.remove('is-hidden');
        }

        return;
      }

      links.render();
    }

    function render() {
      if (!_elList) return;

      _elList.innerHTML = '';

      state.links.forEach(function (link) {
        const li = document.createElement('li');
        li.className = 'link-item';

        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.textContent = link.label;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';

        deleteButton.addEventListener('click', function () {
          links.delete(link.id);
        });

        li.appendChild(anchor);
        li.appendChild(deleteButton);

        _elList.appendChild(li);
      });
    }

    function init() {

  _elLabel = document.getElementById('link-label-input');
  _elUrl = document.getElementById('link-url-input');
  _elError = document.getElementById('link-error');
      _elStorageError = document.getElementById('link-storage-error');
      _elList = document.getElementById('link-list');

      const form = document.getElementById('link-form');

      if (form) {
        form.addEventListener('submit', function (event) {
          event.preventDefault();

          add(
            _elLabel ? _elLabel.value : '',
            _elUrl ? _elUrl.value : ''
          );
        });
      }

      links.render();
    }

    return {
      add,
      delete: deleteFn,
      render,
      init
    };

  })();
  /* =========================================================
   * [8] STORAGE SYNC HELPERS
   * ========================================================= */

  /**
   * Serialises the current in-memory task list and writes it to
   * localStorage under the key 'tdl_tasks'.
   *
   * @returns {boolean} true if the write succeeded, false otherwise
   */
  function syncTasks() {
    return storage.write('tdl_tasks', state.tasks);
  }

  /**
   * Serialises the current in-memory links list and writes it to
   * localStorage under the key 'tdl_links'.
   * Stub — will be called once the Quick Links widget is implemented.
   *
   * @returns {boolean} true if the write succeeded, false otherwise
   */
  function syncLinks() {
    return storage.write('tdl_links', state.links);
  }

  /* =========================================================
 * [9] BOOTSTRAP
 * ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  const savedTasks = storage.read('tdl_tasks');

  if (Array.isArray(savedTasks)) {

    state.tasks = savedTasks;

  }

  const savedLinks = storage.read('tdl_links');

  if (Array.isArray(savedLinks)) {

    state.links = savedLinks;

  }

  clock.init();

  timer.init();

  tasks.init();

  links.init();

});

})();
