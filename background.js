// Background script for LeetCode Enhanced Hider

// Context menu for quick actions
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "leetcode-hider",
    title: "LeetCode Hider",
    contexts: ["page"],
    documentUrlPatterns: ["*://leetcode.com/*", "*://leetcode.cn/*", "*://leetcode-cn.com/*"]
  });

  chrome.contextMenus.create({
    id: "hide-difficulty",
    parentId: "leetcode-hider",
    title: "Hide Difficulty",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "hide-acceptance",
    parentId: "leetcode-hider",
    title: "Hide Acceptance Rate",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "focus-mode",
    parentId: "leetcode-hider",
    title: "Toggle Focus Mode",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "random-problem",
    parentId: "leetcode-hider",
    title: "Go to Random Problem",
    contexts: ["page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab.url.includes('leetcode.com') || tab.url.includes('leetcode.cn')) {
    switch (info.menuItemId) {
      case "hide-difficulty":
        chrome.tabs.sendMessage(tab.id, { action: "toggleDifficulty", isHidden: true });
        break;
      case "hide-acceptance":
        chrome.tabs.sendMessage(tab.id, { action: "toggleAcceptance", isHidden: true });
        break;
      case "focus-mode":
        chrome.tabs.sendMessage(tab.id, { action: "toggleFocusMode", isHidden: true });
        break;
      case "random-problem":
        chrome.tabs.sendMessage(tab.id, { action: "getRandomProblem" });
        break;
    }
  }
});

// Handle extension icon badge updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBadge") {
    chrome.action.setBadgeText({
      text: request.text,
      tabId: sender.tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: request.color || "#4ade80",
      tabId: sender.tab.id
    });
  }
});

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // First time installation
    chrome.storage.sync.set({
      hideDifficulty: true,
      hideAcceptance: false,
      hideTags: false,
      hideSolutions: false,
      focusMode: false,
      theme: 'dark',
      initialized: false,
      problemsSolved: 0,
      streakDays: 0,
      lastSolvedDate: null
    });
    
    // Show welcome notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "LeetCode Enhanced Hider Installed!",
      message: "Welcome! Click the extension icon to get started with enhanced problem solving."
    });
  }
});

// Handle tab updates to apply settings
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url.includes('leetcode.com') || tab.url.includes('leetcode.cn'))) {
    
    // Apply saved settings when page loads
    chrome.storage.sync.get({
      hideDifficulty: true,
      hideAcceptance: false,
      hideTags: false,
      hideSolutions: false,
      focusMode: false
    }, function(settings) {
      // Wait a bit for the page to fully load
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          action: "applySettings",
          settings: settings
        });
      }, 1000);
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  if (tab.url.includes('leetcode.com') || tab.url.includes('leetcode.cn')) {
    switch (command) {
      case "toggle-difficulty":
        chrome.tabs.sendMessage(tab.id, { action: "toggleDifficulty", isHidden: null });
        break;
      case "toggle-focus-mode":
        chrome.tabs.sendMessage(tab.id, { action: "toggleFocusMode", isHidden: null });
        break;
      case "random-problem":
        chrome.tabs.sendMessage(tab.id, { action: "getRandomProblem" });
        break;
    }
  }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Update badge when stats change
    if (changes.problemsSolved || changes.streakDays) {
      chrome.storage.sync.get(['problemsSolved', 'streakDays'], function(result) {
        const total = (result.problemsSolved || 0) + (result.streakDays || 0);
        if (total > 0) {
          chrome.action.setBadgeText({ text: total.toString() });
          chrome.action.setBadgeBackgroundColor({ color: "#4ade80" });
        } else {
          chrome.action.setBadgeText({ text: "" });
        }
      });
    }
  }
});
