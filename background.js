// Background script for Browseen extension

// Initialize context menus
chrome.runtime.onInstalled.addListener(() => {
  // Create right-click context menu
  chrome.contextMenus.create({
    id: "browseen-context-menu",
    title: "Execute Browseen Command",
    contexts: ["page", "selection"]
  });
  
  // Create common commands sub-menu
  chrome.contextMenus.create({
    id: "browseen-command-scroll-down",
    parentId: "browseen-context-menu",
    title: "SCROLL DOWN",
    contexts: ["page", "selection"]
  });
  
  chrome.contextMenus.create({
    id: "browseen-command-click-selected",
    parentId: "browseen-context-menu",
    title: "CLICK selected text",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "browseen-command-like-post",
    parentId: "browseen-context-menu",
    title: "LIKE nearest post",
    contexts: ["page", "selection"]
  });
  
  chrome.contextMenus.create({
    id: "browseen-command-comment",
    parentId: "browseen-context-menu", 
    title: "COMMENT on nearest post",
    contexts: ["page", "selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  let command = "";
  
  switch (info.menuItemId) {
    case "browseen-command-scroll-down":
      command = "SCROLL DOWN";
      break;
    case "browseen-command-click-selected":
      command = `CLICK '${info.selectionText}'`;
      break;
    case "browseen-command-like-post":
      command = "LIKE nearest post";
      break;
    case "browseen-command-comment":
      // Prompt for comment text
      chrome.tabs.sendMessage(
        tab.id,
        {action: 'promptComment'},
        (response) => {
          if (response && response.comment) {
            const commentCommand = `COMMENT '${response.comment}' ON nearest post`;
            chrome.tabs.sendMessage(tab.id, {action: 'executeCommand', command: commentCommand});
          }
        }
      );
      return; // Don't send a command yet, wait for the prompt response
  }
  
  if (command) {
    chrome.tabs.sendMessage(tab.id, {action: 'executeCommand', command: command});
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'logCommand') {
    console.log(`Browseen Command Executed: ${request.command}`);
    // Could store command history in storage if needed
  }
  
  return true; // Keep the message channel open for async responses
});
