document.addEventListener("DOMContentLoaded", function () {
  let currentTheme = 'dark';
  
  // Initialize theme
  chrome.storage.sync.get({ theme: 'dark' }, function(result) {
    currentTheme = result.theme;
    updateThemeUI();
    applyTheme(currentTheme);
  });

  // Load all settings
  chrome.storage.sync.get(
    {
      hideDifficulty: true,
      hideAcceptance: false,
      hideTags: false,
      hideSolutions: false,
      focusMode: false,
      initialized: false,
      problemsSolved: 0,
      streakDays: 0,
      lastSolvedDate: null
    },
    function (result) {
      document.getElementById("difficultyToggle").checked = result.hideDifficulty;
      document.getElementById("acceptanceToggle").checked = result.hideAcceptance;
      document.getElementById("tagsToggle").checked = result.hideTags;
      document.getElementById("solutionsToggle").checked = result.hideSolutions;
      document.getElementById("focusToggle").checked = result.focusMode;

      // Update statistics
      updateStatistics(result.problemsSolved, result.streakDays);

      if (!result.initialized) {
        document.getElementById("refreshNotice").style.display = "block";
        document.getElementById("refreshButton").addEventListener("click", () => {
          chrome.tabs.reload();
          chrome.storage.sync.set({ initialized: true });
          window.close();
        });
      }
    }
  );

  // Theme toggle functionality
  document.getElementById("themeToggle").addEventListener("click", function() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    chrome.storage.sync.set({ theme: currentTheme });
    updateThemeUI();
    applyTheme(currentTheme);
    
    // Send theme change to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateTheme",
        theme: currentTheme
      });
    });
  });

  // Difficulty toggle
  document.getElementById("difficultyToggle").addEventListener("change", function (e) {
    const isHidden = e.target.checked;
    chrome.storage.sync.set({ hideDifficulty: isHidden });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleDifficulty",
        isHidden: isHidden,
      });
    });
  });

  // Acceptance toggle
  document.getElementById("acceptanceToggle").addEventListener("change", function (e) {
    const isHidden = e.target.checked;
    chrome.storage.sync.set({ hideAcceptance: isHidden });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleAcceptance",
        isHidden: isHidden,
      });
    });
  });

  // Tags toggle
  document.getElementById("tagsToggle").addEventListener("change", function (e) {
    const isHidden = e.target.checked;
    chrome.storage.sync.set({ hideTags: isHidden });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleTags",
        isHidden: isHidden,
      });
    });
  });

  // Solutions toggle
  document.getElementById("solutionsToggle").addEventListener("change", function (e) {
    const isHidden = e.target.checked;
    chrome.storage.sync.set({ hideSolutions: isHidden });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleSolutions",
        isHidden: isHidden,
      });
    });
  });

  // Focus mode toggle
  document.getElementById("focusToggle").addEventListener("change", function (e) {
    const isHidden = e.target.checked;
    chrome.storage.sync.set({ focusMode: isHidden });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleFocusMode",
        isHidden: isHidden,
      });
    });
  });

  // Quick action buttons
  document.getElementById("hideAllBtn").addEventListener("click", function() {
    chrome.storage.sync.set({
      hideDifficulty: true,
      hideAcceptance: true,
      hideTags: true,
      hideSolutions: true,
      focusMode: true
    });
    
    // Update UI
    document.getElementById("difficultyToggle").checked = true;
    document.getElementById("acceptanceToggle").checked = true;
    document.getElementById("tagsToggle").checked = true;
    document.getElementById("solutionsToggle").checked = true;
    document.getElementById("focusToggle").checked = true;

    // Send to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "hideAll",
      });
    });
  });

  document.getElementById("showAllBtn").addEventListener("click", function() {
    chrome.storage.sync.set({
      hideDifficulty: false,
      hideAcceptance: false,
      hideTags: false,
      hideSolutions: false,
      focusMode: false
    });
    
    // Update UI
    document.getElementById("difficultyToggle").checked = false;
    document.getElementById("acceptanceToggle").checked = false;
    document.getElementById("tagsToggle").checked = false;
    document.getElementById("solutionsToggle").checked = false;
    document.getElementById("focusToggle").checked = false;

    // Send to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "showAll",
      });
    });
  });

  document.getElementById("randomProblemBtn").addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "getRandomProblem",
      });
    });
  });

  // Footer action buttons
  document.getElementById("exportSettings").addEventListener("click", function() {
    chrome.storage.sync.get(null, function(items) {
      const dataStr = JSON.stringify(items, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leetcode-hider-settings.json';
      link.click();
      URL.revokeObjectURL(url);
    });
  });

  document.getElementById("importSettings").addEventListener("click", function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const settings = JSON.parse(e.target.result);
          chrome.storage.sync.set(settings, function() {
            // Reload popup to reflect new settings
            window.location.reload();
          });
        } catch (error) {
          alert('Invalid settings file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  document.getElementById("resetSettings").addEventListener("click", function() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      chrome.storage.sync.clear(function() {
        window.location.reload();
      });
    }
  });

  // Update theme UI
  function updateThemeUI() {
    const themeIcon = document.querySelector('.theme-icon');
    const body = document.body;
    
    if (currentTheme === 'light') {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
      themeIcon.innerHTML = '<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>';
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
      themeIcon.innerHTML = '<path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>';
    }
  }

  // Apply theme to body
  function applyTheme(theme) {
    const body = document.body;
    if (theme === 'light') {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
    }
  }

  // Update statistics display
  function updateStatistics(problemsSolved, streakDays) {
    document.getElementById("problemsSolved").textContent = problemsSolved;
    document.getElementById("streakDays").textContent = streakDays;
  }

  // Listen for messages from content script (e.g., problem solved)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "problemSolved") {
      updateStatistics(request.problemsSolved, request.streakDays);
    }
  });
});
