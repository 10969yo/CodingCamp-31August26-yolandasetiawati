(function () {

  'use strict';


  /* =========================================================
     [1] CONSTANTS & CONFIG
     ========================================================= */


  /* =========================================================
     [2] STORAGE MODULE
     ========================================================= */

  const storage = (function () {

    // Tracks keys whose stored values failed JSON.parse
    const _corruptKeys = new Set();


    /**
     * Tests whether localStorage is accessible.
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
     * Reads and JSON-parses the value stored under key.
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

        _corruptKeys.add(key);

        return null;
      }
    }


    /**
     * Returns true if the last read for key encountered
     * a JSON parse error.
     * @param {string} key
     * @returns {boolean}
     */
    function isCorrupt(key) {

      return _corruptKeys.has(key);
    }


    /**
     * JSON-stringifies data and writes it to localStorage.
     * @param {string} key
     * @param {any} data
     * @returns {boolean}
     */
    function write(key, data) {

      try {

        localStorage.setItem(
          key,
          JSON.stringify(data)
        );

        return true;

      } catch (_e) {

        return false;
      }
    }


    return {
      isAvailable,
      read,
      isCorrupt,
      write
    };

  })();


  /* =========================================================
     [3] STATE
     ========================================================= */

  const state = {

    tasks: [],

    links: [],

    timer: {

      // Default Pomodoro duration = 25 minutes
      duration: 1500,

      remaining: 1500,

      running: false,

      intervalId: null
    }
  };


  /* =========================================================
   [4] LIGHT / DARK MODE
   ========================================================= */
const theme = (function () {
  let _elToggle = null;

  const STORAGE_KEY = 'tdl_theme';

  function applyTheme(themeName) {
    if (themeName === 'dark') {
      document.body.classList.add('dark-mode');

      if (_elToggle) {
        _elToggle.textContent = '☀️ Light Mode';
        _elToggle.setAttribute(
          'aria-label',
          'Switch to light mode'
        );
      }
    } else {
      document.body.classList.remove('dark-mode');

      if (_elToggle) {
        _elToggle.textContent = '🌙 Dark Mode';
        _elToggle.setAttribute(
          'aria-label',
          'Switch to dark mode'
        );
      }
    }
  }

  function init() {
    _elToggle =
      document.getElementById('theme-toggle');

    const savedTheme =
      localStorage.getItem(STORAGE_KEY);

    if (savedTheme === 'dark') {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }

    if (_elToggle) {
      _elToggle.addEventListener(
        'click',
        function () {
          const isDark =
            document.body.classList.contains(
              'dark-mode'
            );

          const newTheme =
            isDark ? 'light' : 'dark';

          applyTheme(newTheme);

          localStorage.setItem(
            STORAGE_KEY,
            newTheme
          );
        }
      );
    }
  }

  return {
    init
  };
})();

  const customName = (function () {
    let _elInput = null;
    let _elSave = null;

    const STORAGE_KEY = 'tdl_custom_name';

    function init() {
      _elInput = document.getElementById('name-input');
      _elSave = document.getElementById('name-save');

      const savedName = localStorage.getItem(STORAGE_KEY);

      if (_elInput && savedName) {
        _elInput.value = savedName;
      }

      if (_elSave) {
        _elSave.addEventListener('click', function () {
          const name = (_elInput ? _elInput.value : '').trim();

          if (name.length === 0) {
            localStorage.removeItem(STORAGE_KEY);
            updateGreeting('');
            return;
          }

          localStorage.setItem(STORAGE_KEY, name);
          updateGreeting(name);
        });
      }
    }

    function getName() {
      return localStorage.getItem(STORAGE_KEY) || '';
    }

    function updateGreeting(name) {
      const greetingElement =
        document.getElementById('clock-greeting');

      if (!greetingElement) {
        return;
      }

      const hour = new Date().getHours();

      let greeting;

      if (hour >= 5 && hour <= 11) {
        greeting = 'Good Morning';
      } else if (hour >= 12 && hour <= 17) {
        greeting = 'Good Afternoon';
      } else if (hour >= 18 && hour <= 20) {
        greeting = 'Good Evening';
      } else {
        greeting = 'Good Night';
      }

      greetingElement.textContent =
        name ? greeting + ', ' + name : greeting;
    }

    return {
      init,
      getName,
      updateGreeting
    };
  })();
  
  const clock = (function () {

    let _elTime = null;
    let _elDate = null;
    let _elGreeting = null;
    let _elError = null;


    /**
     * Returns a contextual greeting based on local hour.
     * @param {number} hour
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

      return 'Good Night';
    }


    /**
     * Initializes the clock widget.
     */
    function init() {

      _elTime =
        document.getElementById('clock-time');

      _elDate =
        document.getElementById('clock-date');

      _elGreeting =
        document.getElementById('clock-greeting');

      _elError =
        document.getElementById('clock-error');

      tick();

      setInterval(tick, 1000);
    }


    /**
     * Updates the clock display.
     */
    function tick() {

      try {

        const now = new Date();

        const hh =
          String(now.getHours()).padStart(2, '0');

        const mm =
          String(now.getMinutes()).padStart(2, '0');

        const ss =
          String(now.getSeconds()).padStart(2, '0');

        const timeStr =
          hh + ':' + mm + ':' + ss;


        const WEEKDAYS = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday'
        ];


        const MONTHS = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ];


        const dateStr =
          WEEKDAYS[now.getDay()] +
          ', ' +
          now.getDate() +
          ' ' +
          MONTHS[now.getMonth()] +
          ' ' +
          now.getFullYear();


        const greeting =
          getGreeting(now.getHours());


        if (_elTime) {
          _elTime.textContent = timeStr;
        }


        if (_elDate) {
          _elDate.textContent = dateStr;
        }


        if (_elGreeting) {
        const name = customName.getName();

        _elGreeting.textContent =
          name ? greeting + ', ' + name : greeting;
      }


        if (_elError) {
          _elError.classList.add('is-hidden');
        }


      } catch (_e) {

        if (_elTime) {
          _elTime.textContent = '';
        }

        if (_elDate) {
          _elDate.textContent = '';
        }

        if (_elGreeting) {
          _elGreeting.textContent = '';
        }

        if (_elError) {

          _elError.textContent =
            'Unable to retrieve the current time.';

          _elError.classList.remove(
            'is-hidden'
          );
        }
      }
    }


    return {
      getGreeting,
      init,
      tick
    };

  })();


  /* =========================================================
     [5] TIMER WIDGET
     ========================================================= */

  const timer = (function () {

    let _elDisplay = null;
    let _elStart = null;
    let _elStop = null;
    let _elReset = null;
    let _elComplete = null;
    let _elDuration = null;


    /**
     * Formats seconds into MM:SS.
     * @param {number} totalSeconds
     * @returns {string}
     */
    function _formatTime(totalSeconds) {

      const mins =
        Math.floor(totalSeconds / 60);

      const secs =
        totalSeconds % 60;


      return (

        String(mins).padStart(2, '0') +

        ':' +

        String(secs).padStart(2, '0')

      );
    }


    /**
     * Renders the timer widget.
     */
    function render() {

      if (!_elDisplay) {
        return;
      }


      _elDisplay.textContent =
        _formatTime(
          state.timer.remaining
        );


      if (state.timer.remaining === 0) {

        _elComplete.classList.remove(
          'is-hidden'
        );

      } else {

        _elComplete.classList.add(
          'is-hidden'
        );
      }


      _elStart.disabled =
        state.timer.running;


      _elStop.disabled =
        !state.timer.running;


      _elReset.disabled =
        state.timer.running;


      // Duration cannot be changed while timer runs
      if (_elDuration) {

        _elDuration.disabled =
          state.timer.running;
      }
    }


    /**
     * Changes the Pomodoro duration.
     * @param {number} seconds
     */
    function changeDuration(seconds) {

      if (state.timer.running) {
        return;
      }


      state.timer.duration = seconds;

      state.timer.remaining = seconds;


      if (_elComplete) {

        _elComplete.classList.add(
          'is-hidden'
        );
      }


      render();
    }


    /**
     * Initializes the timer widget.
     */
    function init() {

      _elDisplay =
        document.getElementById(
          'timer-display'
        );


      _elStart =
        document.getElementById(
          'timer-start'
        );


      _elStop =
        document.getElementById(
          'timer-stop'
        );


      _elReset =
        document.getElementById(
          'timer-reset'
        );


      _elComplete =
        document.getElementById(
          'timer-complete'
        );


      _elDuration =
        document.getElementById(
          'timer-duration'
        );


      render();


      _elStart.addEventListener(
        'click',
        function () {

          timer.start();
        }
      );


      _elStop.addEventListener(
        'click',
        function () {

          timer.stop();
        }
      );


      _elReset.addEventListener(
        'click',
        function () {

          timer.reset();
        }
      );


      if (_elDuration) {

        _elDuration.addEventListener(
          'change',
          function () {

            const seconds =
              Number(_elDuration.value);

            changeDuration(seconds);
          }
        );
      }
    }


    /**
     * Starts the countdown.
     */
    function start() {

      if (state.timer.remaining === 0) {

        timer.reset();
      }


      state.timer.running = true;


      state.timer.intervalId =
        setInterval(
          function () {

            timer.tick();

          },
          1000
        );


      render();
    }


    /**
     * Stops/pauses the countdown.
     */
    function stop() {

      clearInterval(
        state.timer.intervalId
      );


      state.timer.intervalId = null;

      state.timer.running = false;


      render();
    }


    /**
     * Resets the timer to the selected duration.
     */
    function reset() {

      timer.stop();


      state.timer.remaining =
        state.timer.duration;


      if (_elComplete) {

        _elComplete.classList.add(
          'is-hidden'
        );
      }


      render();
    }


    /**
     * Decrements the timer by one second.
     */
    function tick() {

      state.timer.remaining -= 1;


      if (state.timer.remaining <= 0) {

        state.timer.remaining = 0;


        timer.stop();


        if (_elComplete) {

          _elComplete.classList.remove(
            'is-hidden'
          );
        }
      }


      render();
    }


    return {
      init,
      render,
      start,
      stop,
      reset,
      tick,
      changeDuration
    };

  })();


  /* =========================================================
     [6] TASK MANAGER WIDGET
     ========================================================= */

  const tasks = (function () {

    let _elInput = null;
    let _elError = null;
    let _elStorageError = null;
    let _elList = null;


    /**
     * Generates a unique task ID.
     * @returns {string}
     */
    function _generateId() {

      return (

        typeof crypto !== 'undefined' &&

        typeof crypto.randomUUID === 'function'

      )

        ? crypto.randomUUID()

        : Date.now().toString();
    }


    /**
     * Adds a new task.
     * @param {string} description
     */
    function add(description) {

      const trimmed =
        (description || '').trim();


      if (
        trimmed.length === 0 ||
        trimmed.length > 500
      ) {

        if (_elError) {

          _elError.textContent =

            trimmed.length === 0

              ? 'Task description is required.'

              : 'Task description must be 500 characters or fewer.';


          _elError.classList.remove(
            'is-hidden'
          );
        }

        return;
      }


      /* =====================================================
         PREVENT DUPLICATE TASKS
         ===================================================== */

      const duplicate =
        state.tasks.some(
          function (task) {

            return (

              task.description
                .trim()
                .toLowerCase() ===

              trimmed.toLowerCase()

            );
          }
        );


      if (duplicate) {

        if (_elError) {

          _elError.textContent =
            'This task already exists.';

          _elError.classList.remove(
            'is-hidden'
          );
        }

        return;
      }


      const task = {

        id: _generateId(),

        description: trimmed,

        completed: false
      };


      state.tasks.push(task);


      const saved =
        syncTasks();


      if (!saved) {

        state.tasks.pop();


        if (_elStorageError) {

          _elStorageError.textContent =
            'Could not save task. Please try again.';

          _elStorageError.classList.remove(
            'is-hidden'
          );
        }

        return;
      }


      tasks.render();


      if (_elInput) {
        _elInput.value = '';
      }


      if (_elError) {

        _elError.classList.add(
          'is-hidden'
        );
      }


      if (_elStorageError) {

        _elStorageError.classList.add(
          'is-hidden'
        );
      }
    }


    /**
     * Edits an existing task.
     * @param {string} id
     * @param {string} newDescription
     */
    function edit(id, newDescription) {

      const trimmed =
        (newDescription || '').trim();


      if (
        trimmed.length === 0 ||
        trimmed.length > 500
      ) {

        if (_elError) {

          _elError.textContent =

            trimmed.length === 0

              ? 'Task description is required.'

              : 'Task description must be 500 characters or fewer.';


          _elError.classList.remove(
            'is-hidden'
          );
        }

        return;
      }


      const task =
        state.tasks.find(
          function (t) {

            return t.id === id;
          }
        );


      if (!task) {
        return;
      }


      const originalDesc =
        task.description;


      task.description = trimmed;


      const saved =
        syncTasks();


      if (!saved) {

        task.description =
          originalDesc;


        if (_elStorageError) {

          _elStorageError.textContent =
            'Could not save change. Please try again.';

          _elStorageError.classList.remove(
            'is-hidden'
          );
        }


        tasks.render();

        return;
      }


      tasks.render();
    }


    /**
     * Toggles the completed state of a task.
     * @param {string} id
     */
    function toggle(id) {

      const task =
        state.tasks.find(
          function (t) {

            return t.id === id;
          }
        );


      if (!task) {
        return;
      }


      task.completed =
        !task.completed;


      const saved =
        syncTasks();


      if (!saved) {

        task.completed =
          !task.completed;


        if (_elStorageError) {

          _elStorageError.textContent =
            'Could not save change. Please try again.';

          _elStorageError.classList.remove(
            'is-hidden'
          );
        }

        return;
      }


      tasks.render();
    }


    /**
     * Deletes a task.
     * @param {string} id
     */
    function deleteFn(id) {

      const index =
        state.tasks.findIndex(
          function (task) {

            return task.id === id;
          }
        );


      if (index === -1) {
        return;
      }


      const deletedTask =
        state.tasks[index];


      state.tasks.splice(
        index,
        1
      );


      const saved =
        syncTasks();


      if (!saved) {

        state.tasks.splice(
          index,
          0,
          deletedTask
        );


        if (_elStorageError) {

          _elStorageError.textContent =
            'Could not delete task. Please try again.';

          _elStorageError.classList.remove(
            'is-hidden'
          );
        }

        return;
      }


      tasks.render();
    }


    /**
     * Sorts tasks alphabetically by task description, A-Z.
     */
    function sortAZ() {

      state.tasks.sort(
        function (a, b) {

          return a.description.localeCompare(
            b.description,
            undefined,
            {
              sensitivity: 'base'
            }
          );
        }
      );


      syncTasks();

      tasks.render();
    }


    /**
     * Renders the task list.
     */
    function render() {

      if (!_elList) {
        return;
      }


      _elList.innerHTML = '';


      state.tasks.forEach(
        function (task) {

          const li =
            document.createElement('li');

          li.className =
            'task-item';


          const checkbox =
            document.createElement('input');

          checkbox.type =
            'checkbox';

          checkbox.checked =
            task.completed;


          checkbox.setAttribute(
            'aria-label',
            'Mark task as done'
          );


          checkbox.addEventListener(
            'change',
            function () {

              tasks.toggle(
                task.id
              );
            }
          );


          const description =
            document.createElement('span');

          description.textContent =
            task.description;


          if (task.completed) {

            description.classList.add(
              'task-completed'
            );
          }


          const editButton =
            document.createElement('button');

          editButton.type =
            'button';

          editButton.textContent =
            'Edit';


          editButton.addEventListener(
            'click',
            function () {

              const newDescription =
                window.prompt(
                  'Edit task:',
                  task.description
                );


              if (newDescription !== null) {

                tasks.edit(
                  task.id,
                  newDescription
                );
              }
            }
          );


          const deleteButton =
            document.createElement('button');

          deleteButton.type =
            'button';

          deleteButton.textContent =
            'Delete';


          deleteButton.addEventListener(
            'click',
            function () {

              tasks.delete(
                task.id
              );
            }
          );


          li.appendChild(
            checkbox
          );

          li.appendChild(
            description
          );

          li.appendChild(
            editButton
          );

          li.appendChild(
            deleteButton
          );


          _elList.appendChild(
            li
          );
        }
      );
    }


    /**
     * Initializes the Task Manager widget.
     */
    function init() {

      _elInput =
        document.getElementById(
          'task-input'
        );


      _elError =
        document.getElementById(
          'task-error'
        );


      _elStorageError =
        document.getElementById(
          'task-storage-error'
        );


      _elList =
        document.getElementById(
          'task-list'
        );


      const sortButton =
        document.getElementById(
          'task-sort'
        );


      if (sortButton) {

        sortButton.addEventListener(
          'click',
          function () {

            tasks.sortAZ();
          }
        );
      }


      const form =
        document.getElementById(
          'task-form'
        );


      if (form) {

        form.addEventListener(
          'submit',
          function (event) {

            event.preventDefault();


            add(
              _elInput
                ? _elInput.value
                : ''
            );
          }
        );
      }


      tasks.render();
    }


    return {

      add,

      edit,

      toggle,

      delete: deleteFn,

      sortAZ,

      render,

      init
    };

  })();


  /* =========================================================
     [7] QUICK LINKS WIDGET
     ========================================================= */

  const links = (function () {

    let _elLabel = null;
    let _elUrl = null;
    let _elError = null;
    let _elStorageError = null;
    let _elList = null;


    /**
     * Generates a unique link ID.
     * @returns {string}
     */
    function _generateId() {

      return (

        typeof crypto !== 'undefined' &&

        typeof crypto.randomUUID === 'function'

      )

        ? crypto.randomUUID()

        : Date.now().toString();
    }


    /**
     * Adds a new quick link.
     * @param {string} label
     * @param {string} url
     */
    function add(label, url) {

      const trimmedLabel =
        (label || '').trim();

      const trimmedUrl =
        (url || '').trim();


      if (trimmedLabel.length === 0) {

        if (_elError) {

          _elError.textContent =
            'Link label is required.';

          _elError.classList.remove(
            'is-hidden'
          );
        }

        return;
      }


      let validUrl;


      try {

        validUrl =
          new URL(trimmedUrl);


        if (
          validUrl.protocol !== 'http:' &&
          validUrl.protocol !== 'https:'
        ) {

          throw new Error(
            'Invalid protocol'
          );
        }


      } catch (_e) {

        if (_elError) {

          _elError.textContent =
            'Please enter a valid URL.';

          _elError.classList.remove(
            'is-hidden'
          );
        }

        return;
      }


      const link = {

        id: _generateId(),

        label: trimmedLabel,

        url: validUrl.href
      };


      state.links.push(link);


      const saved =
        syncLinks();


      if (!saved) {

        state.links.pop();


        if (_elStorageError) {

          _elStorageError.textContent =
            'Could not save link. Please try again.';

          _elStorageError.classList.remove(
            'is-hidden'
          );
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

        _elError.classList.add(
          'is-hidden'
        );
      }


      if (_elStorageError) {

        _elStorageError.classList.add(
          'is-hidden'
        );
      }
    }


    /**
     * Deletes a quick link.
     * @param {string} id
     */
    function deleteFn(id) {

      const index =
        state.links.findIndex(
          function (link) {

            return link.id === id;
          }
        );


      if (index === -1) {
        return;
      }


      const deletedLink =
        state.links[index];


      state.links.splice(
        index,
        1
      );


      const saved =
        syncLinks();


      if (!saved) {

        state.links.splice(
          index,
          0,
          deletedLink
        );


        if (_elStorageError) {

          _elStorageError.textContent =
            'Could not delete link. Please try again.';

          _elStorageError.classList.remove(
            'is-hidden'
          );
        }

        return;
      }


      links.render();
    }


    /**
     * Renders the quick links list.
     */
    function render() {

      if (!_elList) {
        return;
      }


      _elList.innerHTML = '';


      state.links.forEach(
        function (link) {

          const li =
            document.createElement('li');

          li.className =
            'link-item';


          const anchor =
            document.createElement('a');

          anchor.href =
            link.url;

          anchor.textContent =
            link.label;

          anchor.target =
            '_blank';

          anchor.rel =
            'noopener noreferrer';


          const deleteButton =
            document.createElement('button');

          deleteButton.type =
            'button';

          deleteButton.textContent =
            'Delete';


          deleteButton.addEventListener(
            'click',
            function () {

              links.delete(
                link.id
              );
            }
          );


          li.appendChild(
            anchor
          );

          li.appendChild(
            deleteButton
          );


          _elList.appendChild(
            li
          );
        }
      );
    }


    /**
     * Initializes the Quick Links widget.
     */
    function init() {

      _elLabel =
        document.getElementById(
          'link-label-input'
        );


      _elUrl =
        document.getElementById(
          'link-url-input'
        );


      _elError =
        document.getElementById(
          'link-error'
        );


      _elStorageError =
        document.getElementById(
          'link-storage-error'
        );


      _elList =
        document.getElementById(
          'link-list'
        );


      const form =
        document.getElementById(
          'link-form'
        );


      if (form) {

        form.addEventListener(
          'submit',
          function (event) {

            event.preventDefault();


            add(

              _elLabel
                ? _elLabel.value
                : '',

              _elUrl
                ? _elUrl.value
                : ''
            );
          }
        );
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
     [8] STORAGE SYNC HELPERS
     ========================================================= */


  /**
   * Saves the current task list.
   * @returns {boolean}
   */
  function syncTasks() {

    return storage.write(
      'tdl_tasks',
      state.tasks
    );
  }


  /**
   * Saves the current links list.
   * @returns {boolean}
   */
  function syncLinks() {

    return storage.write(
      'tdl_links',
      state.links
    );
  }


  /* =========================================================
     [9] BOOTSTRAP
     ========================================================= */

  document.addEventListener(
    'DOMContentLoaded',
    function () {

      const savedTasks =
        storage.read('tdl_tasks');


      if (Array.isArray(savedTasks)) {

        state.tasks =
          savedTasks;
      }


      const savedLinks =
        storage.read('tdl_links');


      if (Array.isArray(savedLinks)) {

        state.links =
          savedLinks;
      }

      theme.init();
      customName.init();
      clock.init();
      timer.init();
      tasks.init();
      links.init();
    }
  );

})();