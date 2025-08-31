let isHidden = true;
let isAcceptanceHidden = false;
let isTagsHidden = false;
let isSolutionsHidden = false;
let isFocusModeEnabled = false;

function initialize() {
  chrome.storage.sync.get(
    {
      hideDifficulty: true, 
      hideAcceptance: false,
      hideTags: false,
      hideSolutions: false,
      focusMode: false,
      theme: 'dark'
    }, 
    function(result) {
      isHidden = result.hideDifficulty;
      isAcceptanceHidden = result.hideAcceptance;
      isTagsHidden = result.hideTags;
      isSolutionsHidden = result.hideSolutions;
      isFocusModeEnabled = result.focusMode;
      
      if (isHidden) {
        toggleDifficulty(true);
      }
      if (isAcceptanceHidden) {
        toggleAcceptance(result.hideAcceptance);
      }
      if (isTagsHidden) {
        toggleTags(result.hideTags);
      }
      if (isSolutionsHidden) {
        toggleSolutions(result.hideSolutions);
      }
      if (isFocusModeEnabled) {
        toggleFocusMode(result.focusMode);
      }
      
      // Apply theme
      applyTheme(result.theme);
    }
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize(); 
}

const observer = new MutationObserver((mutations) => {
  chrome.storage.sync.get(
    {
      hideDifficulty: true,
      hideAcceptance: false,
      hideTags: false,
      hideSolutions: false,
      focusMode: false
    }, 
    function(result) {
      if (result.hideDifficulty) {
        toggleDifficulty(true);
      }
      if (result.hideAcceptance) {
        toggleAcceptanceOnProblemPage(result.hideAcceptance);
        toggleAcceptance(result.hideAcceptance);
      }
      if (result.hideTags) {
        toggleTags(result.hideTags);
      }
      if (result.hideSolutions) {
        toggleSolutions(result.hideSolutions);
      }
      if (result.focusMode) {
        toggleFocusMode(result.focusMode);
      }
    }
  );
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case 'toggleDifficulty':
      isHidden = request.isHidden;
      toggleDifficulty(isHidden);
      chrome.storage.sync.set({ hideDifficulty: isHidden });
      break;
      
    case 'toggleAcceptance':
      isAcceptanceHidden = request.isHidden;
      toggleAcceptanceOnProblemPage(request.isHidden);
      toggleAcceptance(request.isHidden);
      break;
      
    case 'toggleTags':
      isTagsHidden = request.isHidden;
      toggleTags(request.isHidden);
      break;
      
    case 'toggleSolutions':
      isSolutionsHidden = request.isHidden;
      toggleSolutions(request.isHidden);
      break;
      
    case 'toggleFocusMode':
      isFocusModeEnabled = request.isHidden;
      toggleFocusMode(request.isHidden);
      break;
      
    case 'hideAll':
      hideAllFeatures();
      break;
      
    case 'showAll':
      showAllFeatures();
      break;
      
    case 'getRandomProblem':
      getRandomProblem();
      break;
      
    case 'updateTheme':
      applyTheme(request.theme);
      break;
      
    case 'applySettings':
      applySettings(request.settings);
      break;
  }
});

function toggleDifficulty(hide) {
  const difficulties = ["简单", "中等", "困难", "Easy", "Medium", "Med.", "Hard"];
  const elements = Array.from(document.querySelectorAll("span, div, p, a"));
  
  elements.forEach((el) => {
    if (difficulties.some((difficulty) => el.innerText === difficulty)) {
      el.style.display = hide ? "none" : "";
    }
  });
}

function toggleAcceptance(hide) {
  const elements = Array.from(document.querySelectorAll("div[role='cell']"));
  elements.forEach((el) => {
    const text = el.textContent;
    if (text && /^\d+\.?\d*%$/.test(text.trim())) {
      el.style.display = hide ? "none" : "";
    }
  });
}

function toggleAcceptanceOnProblemPage(hide) {
  if (!window.location.pathname.startsWith('/problems/')) {
    return;
  }
  
  const elements = Array.from(document.querySelectorAll("div"));
  const acceptanceRateDiv = elements.find(element => 
    element.innerText.toLowerCase().includes("acceptance rate")
  );

  if (acceptanceRateDiv) {
    const containerDiv = acceptanceRateDiv.parentElement?.parentElement;
    if (containerDiv) {
      containerDiv.style.display = hide ? "none" : "";
    }
  }
}

function toggleTags(hide) {
  // Hide problem tags on problem list page
  const tagElements = document.querySelectorAll('[data-tag], .tag, .topic-tag, [class*="tag"]');
  tagElements.forEach(el => {
    if (el.textContent && el.textContent.trim()) {
      el.style.display = hide ? "none" : "";
    }
  });
  
  // Hide tags on individual problem page
  if (window.location.pathname.startsWith('/problems/')) {
    const problemTags = document.querySelectorAll('.tag__2P4s, .topic-tag, [class*="tag"]');
    problemTags.forEach(el => {
      el.style.display = hide ? "none" : "";
    });
  }
}

function toggleSolutions(hide) {
  if (!window.location.pathname.startsWith('/problems/')) {
    return;
  }
  
  // Hide solutions tab
  const solutionsTab = document.querySelector('[data-tab="solutions"], [href*="solutions"], .solutions-tab');
  if (solutionsTab) {
    solutionsTab.style.display = hide ? "none" : "";
  }
  
  // Hide solutions content if already open
  const solutionsContent = document.querySelector('.solutions-content, [class*="solutions"]');
  if (solutionsContent) {
    solutionsContent.style.display = hide ? "none" : "";
  }
}

function toggleFocusMode(hide) {
  if (!window.location.pathname.startsWith('/problems/')) {
    return;
  }
  
  // Hide distracting elements in focus mode
  const distractingElements = document.querySelectorAll(
    '.navbar, .header, .sidebar, .right-panel, .discussion, .related-topics, .company-tags'
  );
  
  distractingElements.forEach(el => {
    if (el) {
      el.style.display = hide ? "none" : "";
    }
  });
  
  // Add focus mode styling
  if (hide) {
    document.body.classList.add('focus-mode');
    addFocusModeStyles();
  } else {
    document.body.classList.remove('focus-mode');
    removeFocusModeStyles();
  }
}

function addFocusModeStyles() {
  if (!document.getElementById('focus-mode-styles')) {
    const style = document.createElement('style');
    style.id = 'focus-mode-styles';
    style.textContent = `
      .focus-mode {
        background: #1a1a1a !important;
        color: #ffffff !important;
      }
      .focus-mode .problem-statement {
        font-size: 18px !important;
        line-height: 1.8 !important;
        max-width: 800px !important;
        margin: 0 auto !important;
        padding: 40px !important;
      }
      .focus-mode .code-editor {
        border: 2px solid #4ade80 !important;
        border-radius: 12px !important;
        box-shadow: 0 0 20px rgba(74, 222, 128, 0.3) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function removeFocusModeStyles() {
  const style = document.getElementById('focus-mode-styles');
  if (style) {
    style.remove();
  }
}

function hideAllFeatures() {
  toggleDifficulty(true);
  toggleAcceptance(true);
  toggleTags(true);
  toggleSolutions(true);
  toggleFocusMode(true);
}

function showAllFeatures() {
  toggleDifficulty(false);
  toggleAcceptance(false);
  toggleTags(false);
  toggleSolutions(false);
  toggleFocusMode(false);
}

function getRandomProblem() {
  // Get all problem links
  const problemLinks = Array.from(document.querySelectorAll('a[href*="/problems/"]'));
  const validProblems = problemLinks.filter(link => 
    link.href.includes('/problems/') && 
    !link.href.includes('/solutions') &&
    !link.href.includes('/discuss')
  );
  
  if (validProblems.length > 0) {
    const randomIndex = Math.floor(Math.random() * validProblems.length);
    const randomProblem = validProblems[randomIndex];
    
    // Navigate to random problem
    window.location.href = randomProblem.href;
  } else {
    // If no problems found, go to problems list
    window.location.href = 'https://leetcode.com/problemset/all/';
  }
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }
}

// Track problem solving progress
function trackProblemSolved() {
  chrome.storage.sync.get({
    problemsSolved: 0,
    streakDays: 0,
    lastSolvedDate: null
  }, function(result) {
    const today = new Date().toDateString();
    let newProblemsSolved = result.problemsSolved;
    let newStreakDays = result.streakDays;
    
    // Check if this is a new problem solved today
    if (result.lastSolvedDate !== today) {
      newProblemsSolved += 1;
      
      // Update streak
      if (result.lastSolvedDate) {
        const lastDate = new Date(result.lastSolvedDate);
        const currentDate = new Date();
        const diffTime = currentDate - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreakDays += 1;
        } else if (diffDays > 1) {
          newStreakDays = 1;
        }
      } else {
        newStreakDays = 1;
      }
      
      // Save updated stats
      chrome.storage.sync.set({
        problemsSolved: newProblemsSolved,
        streakDays: newStreakDays,
        lastSolvedDate: today
      });
      
      // Notify popup
      chrome.runtime.sendMessage({
        action: "problemSolved",
        problemsSolved: newProblemsSolved,
        streakDays: newStreakDays
      });
    }
  });
}

// Monitor for problem submission success
function monitorProblemSubmission() {
  // Check for success indicators
  const successIndicators = [
    '.success-message',
    '[data-testid="success"]',
    '.accepted',
    '.success'
  ];
  
  successIndicators.forEach(selector => {
    const element = document.querySelector(selector);
    if (element && element.textContent.toLowerCase().includes('accepted')) {
      trackProblemSolved();
    }
  });
  
  // Monitor URL changes for problem completion
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      if (currentUrl.includes('/submissions/')) {
        trackProblemSolved();
      }
    }
  }, 1000);
}

// Initialize problem submission monitoring
if (window.location.pathname.startsWith('/problems/')) {
  monitorProblemSubmission();
}

// Add smooth animations for better UX
function addSmoothAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    .toggle-container, .quick-action-btn {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .toggle-container:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    
    .quick-action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    
    .fade-in {
      animation: fadeIn 0.5s ease-in;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// Initialize smooth animations
addSmoothAnimations();

// Apply saved settings
function applySettings(settings) {
  if (settings.hideDifficulty !== undefined) {
    isHidden = settings.hideDifficulty;
    toggleDifficulty(settings.hideDifficulty);
  }
  
  if (settings.hideAcceptance !== undefined) {
    isAcceptanceHidden = settings.hideAcceptance;
    toggleAcceptance(settings.hideAcceptance);
    toggleAcceptanceOnProblemPage(settings.hideAcceptance);
  }
  
  if (settings.hideTags !== undefined) {
    isTagsHidden = settings.hideTags;
    toggleTags(settings.hideTags);
  }
  
  if (settings.hideSolutions !== undefined) {
    isSolutionsHidden = settings.hideSolutions;
    toggleSolutions(settings.hideSolutions);
  }
  
  if (settings.focusMode !== undefined) {
    isFocusModeEnabled = settings.focusMode;
    toggleFocusMode(settings.focusMode);
  }
}