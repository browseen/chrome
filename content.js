// Browseen Content Script
// Handles command execution on web pages

(function() {
  // Constants
  const ANIMATION_DURATION = 500; // ms
  const TYPING_DELAY = 15; // ms
  const SCROLL_AMOUNT = 300; // px
  const MAX_SEARCH_DEPTH = 10;
  
  // Command parser regex patterns
  const COMMAND_PATTERNS = {
    CLICK: /^CLICK\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))(?:\s+(.*))?$/i,
    TYPE: /^TYPE\s+(?:'([^']+)'|"([^"]+)")\s+IN\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))(?:\s+(.*))?$/i,
    SCROLL: /^SCROLL\s+(UP|DOWN|LEFT|RIGHT)(?:\s+(\d+))?$/i,
    GO_TO: /^GO\s+TO\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))(?:\s+(.*))?$/i,
    FIND: /^FIND\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))(?:\s+(.*))?$/i,
    LIKE: /^LIKE\s+(?:post\s+)?(?:CONTAINING\s+)?(?:'([^']+)'|"([^"]+)"|([^\s]+)|nearest\s+post)(?:\s+(.*))?$/i,
    COMMENT: /^COMMENT\s+(?:'([^']+)'|"([^"]+)")\s+ON\s+(?:post\s+)?(?:CONTAINING\s+)?(?:'([^']+)'|"([^"]+)"|([^\s]+)|first\s+post|nearest\s+post)(?:\s+(.*))?$/i,
    TOGGLE: /^TOGGLE\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))(?:\s+(.*))?$/i
  };
  
  // Track elements we've found for future reference
  let elementCache = {};
  
  // Listen for messages from popup or background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeCommand') {
      try {
        executeCommand(request.command)
          .then(result => {
            sendResponse({ success: true, result });
            // Log successful command
            chrome.runtime.sendMessage({
              action: 'logCommand',
              command: request.command
            });
          })
          .catch(error => {
            console.error('Command execution error:', error);
            sendResponse({ success: false, message: error.message });
          });
      } catch (error) {
        console.error('Command parsing error:', error);
        sendResponse({ success: false, message: error.message });
      }
      
      return true; // Keep the message channel open for async response
    }
    
    if (request.action === 'promptComment') {
      const comment = prompt('Enter your comment:');
      sendResponse({ comment });
      return true;
    }
  });
  
  // Main command execution function
  async function executeCommand(commandStr) {
    const command = parseCommand(commandStr);
    
    if (!command) {
      throw new Error('Unrecognized command format');
    }
    
    // Execute the appropriate action based on command type
    switch (command.action.toUpperCase()) {
      case 'CLICK':
        return await handleClick(command);
      
      case 'TYPE':
        return await handleType(command);
      
      case 'SCROLL':
        return await handleScroll(command);
      
      case 'GO TO':
        return await handleGoTo(command);
      
      case 'FIND':
        return await handleFind(command);
      
      case 'LIKE':
        return await handleLike(command);
      
      case 'COMMENT':
        return await handleComment(command);
      
      case 'TOGGLE':
        return await handleToggle(command);
      
      default:
        throw new Error(`Unknown command: ${command.action}`);
    }
  }
  
  // Parse command string into structured object
  function parseCommand(commandStr) {
    for (const [action, pattern] of Object.entries(COMMAND_PATTERNS)) {
      const match = commandStr.match(pattern);
      
      if (match) {
        // Extract parameters based on the command type
        let params = {};
        
        switch (action) {
          case 'CLICK':
            params.target = match[1] || match[2] || match[3]; // Handle quoted or unquoted target
            params.modifiers = match[4];
            break;
            
          case 'TYPE':
            params.text = match[1] || match[2];
            params.target = match[3] || match[4] || match[5];
            params.modifiers = match[6];
            break;
            
          case 'SCROLL':
            params.direction = match[1].toLowerCase();
            params.amount = match[2] ? parseInt(match[2]) : SCROLL_AMOUNT;
            break;
            
          case 'GO_TO':
            params.target = match[1] || match[2] || match[3];
            params.modifiers = match[4];
            break;
            
          case 'FIND':
            params.target = match[1] || match[2] || match[3];
            params.modifiers = match[4];
            break;
            
          case 'LIKE':
            params.target = match[1] || match[2] || match[3];
            if (commandStr.toLowerCase().includes('nearest post')) {
              params.target = 'nearest post';
            }
            params.modifiers = match[4];
            break;
            
          case 'COMMENT':
            params.text = match[1] || match[2];
            params.target = match[3] || match[4] || match[5];
            if (commandStr.toLowerCase().includes('first post')) {
              params.target = 'first post';
            } else if (commandStr.toLowerCase().includes('nearest post')) {
              params.target = 'nearest post';
            }
            params.modifiers = match[6];
            break;
            
          case 'TOGGLE':
            params.target = match[1] || match[2] || match[3];
            params.modifiers = match[4];
            break;
        }
        
        return {
          action,
          params
        };
      }
    }
    
    return null;
  }
  
  // Handler for CLICK command
  async function handleClick(command) {
    const element = await findElement(command.params.target, command.params.modifiers);
    if (!element) {
      throw new Error(`Could not find element to click: ${command.params.target}`);
    }
    
    // Highlight the element briefly
    highlightElement(element);
    
    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait a moment for the scroll to complete
    await sleep(ANIMATION_DURATION);
    
    // Click the element
    await clickElement(element);
    
    return `Clicked ${command.params.target}`;
  }
  
  // Handler for TYPE command
  async function handleType(command) {
    const element = await findElement(command.params.target, command.params.modifiers);
    if (!element) {
      throw new Error(`Could not find element to type in: ${command.params.target}`);
    }
    
    // Highlight the element briefly
    highlightElement(element);
    
    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait a moment for the scroll to complete
    await sleep(ANIMATION_DURATION);
    
    // Focus the element
    element.focus();
    
    // Clear existing text if it's an input or textarea
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = '';
    } else if (element.getAttribute('contenteditable') === 'true') {
      element.textContent = '';
    }
    
    // Type the text character by character
    await typeText(element, command.params.text);
    
    return `Typed "${command.params.text}" in ${command.params.target}`;
  }
  
  // Handler for SCROLL command
  async function handleScroll(command) {
    const direction = command.params.direction;
    const amount = command.params.amount || SCROLL_AMOUNT;
    
    // Calculate scroll coordinates
    let x = 0, y = 0;
    
    switch (direction) {
      case 'up':
        y = -amount;
        break;
      case 'down':
        y = amount;
        break;
      case 'left':
        x = -amount;
        break;
      case 'right':
        x = amount;
        break;
    }
    
    // Perform smooth scroll
    window.scrollBy({
      top: y,
      left: x,
      behavior: 'smooth'
    });
    
    // Wait for scroll to complete
    await sleep(ANIMATION_DURATION);
    
    return `Scrolled ${direction}`;
  }
  
  // Handler for GO TO command
  async function handleGoTo(command) {
    // Check if it's a URL
    if (command.params.target.match(/^https?:\/\//)) {
      window.location.href = command.params.target;
      return `Navigating to ${command.params.target}`;
    }
    
    // Otherwise, try to find and click a navigation element
    try {
      const element = await findElement(command.params.target, command.params.modifiers);
      if (element) {
        // Highlight the element briefly
        highlightElement(element);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait a moment for the scroll to complete
        await sleep(ANIMATION_DURATION);
        
        // Click the element
        await clickElement(element);
        
        return `Went to ${command.params.target}`;
      }
    } catch (error) {
      console.error('Failed to navigate by clicking:', error);
    }
    
    throw new Error(`Could not navigate to: ${command.params.target}`);
  }
  
  // Handler for FIND command
  async function handleFind(command) {
    const element = await findElement(command.params.target, command.params.modifiers);
    if (!element) {
      throw new Error(`Could not find element: ${command.params.target}`);
    }
    
    // Highlight the element
    highlightElement(element, 2000);
    
    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Cache the element for future use
    elementCache.lastFound = element;
    
    return `Found ${command.params.target}`;
  }
  
  // Handler for LIKE command
  async function handleLike(command) {
    let targetElement;
    
    if (command.params.target === 'nearest post') {
      // Find the nearest social post
      targetElement = findNearestSocialPost();
    } else {
      // Find post containing text
      targetElement = await findSocialPostWithText(command.params.target);
    }
    
    if (!targetElement) {
      throw new Error('Could not find a post to like');
    }
    
    // Highlight the found post
    highlightElement(targetElement);
    
    // Scroll to the post
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(ANIMATION_DURATION);
    
    // Find the like button within the post
    const likeButton = findLikeButton(targetElement);
    
    if (!likeButton) {
      throw new Error('Could not find like button');
    }
    
    // Highlight and click the like button
    highlightElement(likeButton);
    await clickElement(likeButton);
    
    return 'Liked post';
  }
  
  // Handler for COMMENT command
  async function handleComment(command) {
    let targetElement;
    
    if (command.params.target === 'first post') {
      // Find the first social post
      targetElement = findFirstSocialPost();
    } else if (command.params.target === 'nearest post') {
      // Find the nearest social post
      targetElement = findNearestSocialPost();
    } else {
      // Find post containing text
      targetElement = await findSocialPostWithText(command.params.target);
    }
    
    if (!targetElement) {
      throw new Error('Could not find a post to comment on');
    }
    
    // Highlight the found post
    highlightElement(targetElement);
    
    // Scroll to the post
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(ANIMATION_DURATION);
    
    // Find the comment button/area
    const commentButton = findCommentButton(targetElement);
    
    if (!commentButton) {
      throw new Error('Could not find comment button');
    }
    
    // Highlight and click the comment button
    highlightElement(commentButton);
    await clickElement(commentButton);
    
    // Wait for comment box to appear
    await sleep(500);
    
    // Find comment input field
    const commentField = findCommentField(targetElement);
    
    if (!commentField) {
      throw new Error('Could not find comment field');
    }
    
    // Focus the comment field
    commentField.focus();
    
    // Type the comment
    await typeText(commentField, command.params.text);
    
    // Find and click the submit button
    const submitButton = findSubmitButton(targetElement);
    
    if (submitButton) {
      await clickElement(submitButton);
    } else {
      // Try to submit via Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      commentField.dispatchEvent(enterEvent);
    }
    
    return `Commented on post: "${command.params.text}"`;
  }
  
  // Handler for TOGGLE command
  async function handleToggle(command) {
    const element = await findElement(command.params.target, command.params.modifiers);
    if (!element) {
      throw new Error(`Could not find element to toggle: ${command.params.target}`);
    }
    
    // Highlight the element briefly
    highlightElement(element);
    
    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait a moment for the scroll to complete
    await sleep(ANIMATION_DURATION);
    
    // Toggle the element based on its type
    if (element.tagName === 'INPUT' && 
        (element.type === 'checkbox' || element.type === 'radio')) {
      // For checkboxes and radio buttons
      element.checked = !element.checked;
      
      // Dispatch change event
      const changeEvent = new Event('change', { bubbles: true });
      element.dispatchEvent(changeEvent);
    } else {
      // For other elements, just click them
      await clickElement(element);
    }
    
    return `Toggled ${command.params.target}`;
  }
  
  // Utility function to find an element based on descriptive text
  async function findElement(targetText, modifiers) {
    // Check if we have this element in cache
    if (elementCache[targetText]) {
      return elementCache[targetText];
    }
    
    // Strategies to find elements, in order of precedence
    const strategies = [
      // 1. By exact text content match
      () => {
        return findByText(targetText, exact = true);
      },
      
      // 2. By partial text content match
      () => {
        return findByText(targetText, exact = false);
      },
      
      // 3. By aria-label attribute
      () => {
        return document.querySelector(`[aria-label="${targetText}"], [aria-label*="${targetText}"]`);
      },
      
      // 4. By placeholder attribute
      () => {
        return document.querySelector(`[placeholder="${targetText}"], [placeholder*="${targetText}"]`);
      },
      
      // 5. By name attribute
      () => {
        return document.querySelector(`[name="${targetText}"], [name*="${targetText}"]`);
      },
      
      // 6. By id attribute
      () => {
        return document.getElementById(targetText) || 
               document.querySelector(`[id*="${targetText}"]`);
      },
      
      // 7. By title attribute
      () => {
        return document.querySelector(`[title="${targetText}"], [title*="${targetText}"]`);
      },
      
      // 8. By role with text
      () => {
        // Common interactive roles
        const roles = ['button', 'link', 'checkbox', 'radio', 'tab', 'menuitem'];
        
        for (const role of roles) {
          const elements = document.querySelectorAll(`[role="${role}"]`);
          for (const element of elements) {
            if (element.textContent.includes(targetText)) {
              return element;
            }
          }
        }
        
        return null;
      },
      
      // 9. Input fields with associated labels
      () => {
        const labels = Array.from(document.querySelectorAll('label'));
        
        for (const label of labels) {
          if (label.textContent.includes(targetText)) {
            // If the label has a 'for' attribute, find the input
            if (label.htmlFor) {
              return document.getElementById(label.htmlFor);
            }
            
            // Otherwise, look for an input inside the label
            const input = label.querySelector('input, textarea, select');
            if (input) {
              return input;
            }
          }
        }
        
        return null;
      }
    ];
    
    // Try each strategy until we find an element
    for (const strategy of strategies) {
      const element = strategy();
      if (element) {
        // Cache the element for future use
        elementCache[targetText] = element;
        return element;
      }
    }
    
    // If we still haven't found the element, try a more generic approach
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      if (element.textContent.includes(targetText) && 
          element.offsetParent !== null && // Check if element is visible
          !['script', 'style', 'meta', 'head'].includes(element.tagName.toLowerCase())) {
        return element;
      }
    }
    
    return null;
  }
  
  // Find element based on exact or partial text match
  function findByText(text, exact = false) {
    // XPath to find elements containing the specific text
    const xpath = exact 
      ? `//*[text()="${text}"]` 
      : `//*[contains(text(), "${text}")]`;
    
    const elements = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    
    // Return the first visible element
    for (let i = 0; i < elements.snapshotLength; i++) {
      const element = elements.snapshotItem(i);
      if (element.offsetParent !== null) { // Check if element is visible
        return element;
      }
    }
    
    return null;
  }
  
  // Find the nearest social post relative to viewport center
  function findNearestSocialPost() {
    // Try common selectors for social media posts across platforms
    const postSelectors = [
      // LinkedIn
      '.feed-shared-update-v2',
      // Facebook
      '.userContentWrapper', 
      '[role="article"]',
      // Twitter
      '.tweet', 
      '[data-testid="tweet"]',
      // Instagram
      '.instagram-media',
      'article',
      // Reddit
      '.Post',
      // Generic
      '.post',
      '.card',
      '.article'
    ];
    
    let nearestPost = null;
    let shortestDistance = Infinity;
    const viewportCenter = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    
    // Try all selectors
    for (const selector of postSelectors) {
      const posts = document.querySelectorAll(selector);
      
      for (const post of posts) {
        if (post.offsetParent === null) continue; // Skip hidden elements
        
        const rect = post.getBoundingClientRect();
        const postCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        
        const distance = Math.sqrt(
          Math.pow(postCenter.x - viewportCenter.x, 2) +
          Math.pow(postCenter.y - viewportCenter.y, 2)
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestPost = post;
        }
      }
      
      if (nearestPost) break;
    }
    
    return nearestPost;
  }
  
  // Find the first social post on the page
  function findFirstSocialPost() {
    // Try common selectors for social media posts across platforms
    const postSelectors = [
      // LinkedIn
      '.feed-shared-update-v2',
      // Facebook
      '.userContentWrapper', 
      '[role="article"]',
      // Twitter
      '.tweet', 
      '[data-testid="tweet"]',
      // Instagram
      '.instagram-media',
      'article',
      // Reddit
      '.Post',
      // Generic
      '.post',
      '.card',
      '.article'
    ];
    
    // Try all selectors
    for (const selector of postSelectors) {
      const post = document.querySelector(selector);
      if (post && post.offsetParent !== null) { // Check if post is visible
        return post;
      }
    }
    
    return null;
  }
  
  // Find a social post containing specific text
  async function findSocialPostWithText(text) {
    // Try common selectors for social media posts across platforms
    const postSelectors = [
      // LinkedIn
      '.feed-shared-update-v2',
      // Facebook
      '.userContentWrapper', 
      '[role="article"]',
      // Twitter
      '.tweet', 
      '[data-testid="tweet"]',
      // Instagram
      '.instagram-media',
      'article',
      // Reddit
      '.Post',
      // Generic
      '.post',
      '.card',
      '.article'
    ];
    
    // Try all selectors
    for (const selector of postSelectors) {
      const posts = document.querySelectorAll(selector);
      
      for (const post of posts) {
        if (post.offsetParent === null) continue; // Skip hidden elements
        
        if (post.textContent.includes(text)) {
          return post;
        }
      }
    }
    
    return null;
  }
  
  // Find the like button within a social post
  function findLikeButton(postElement) {
    // Common like button selectors across platforms
    const likeSelectors = [
      // Generic
      'button[aria-label*="like" i]',
      'button[aria-label*="Like" i]',
      '[role="button"][aria-label*="like" i]',
      // Text-based
      'button:not([aria-label]):contains("Like")',
      // Icons
      '.like-button',
      '.like-action',
      // LinkedIn specific
      '.react-button__trigger',
      // Facebook specific
      '[data-testid="like"]',
      // Twitter specific
      '[data-testid="like"]'
    ];
    
    // Try all selectors within the post element
    for (const selector of likeSelectors) {
      try {
        // Use querySelector if it's a valid CSS selector
        const likeButton = postElement.querySelector(selector);
        if (likeButton) return likeButton;
      } catch (e) {
        // For non-standard selectors like :contains, try a different approach
        if (selector.includes(':contains')) {
          const text = selector.match(/:contains\("(.+)"\)/)[1];
          const buttons = postElement.querySelectorAll('button');
          
          for (const button of buttons) {
            if (button.textContent.includes(text)) {
              return button;
            }
          }
        }
      }
    }
    
    // If no like button found with specific selectors, try a more generic approach
    const buttons = postElement.querySelectorAll('button');
    for (const button of buttons) {
      const buttonText = button.textContent.toLowerCase();
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (buttonText.includes('like') || ariaLabel.includes('like') ||
          button.innerHTML.includes('thumb') || button.innerHTML.includes('heart')) {
        return button;
      }
    }
    
    // Look for SVG icons that might be like buttons
    const svgElements = postElement.querySelectorAll('svg');
    for (const svg of svgElements) {
      const parentElement = svg.closest('button') || svg.parentElement;
      if (parentElement && 
          (parentElement.innerHTML.includes('like') || 
           parentElement.innerHTML.includes('thumb') || 
           parentElement.innerHTML.includes('heart'))) {
        return parentElement;
      }
    }
    
    return null;
  }
  
  // Find the comment button within a social post
  function findCommentButton(postElement) {
    // Common comment button selectors across platforms
    const commentSelectors = [
      // Generic
      'button[aria-label*="comment" i]',
      'button[aria-label*="Comment" i]',
      '[role="button"][aria-label*="comment" i]',
      // Text-based
      'button:contains("Comment")',
      // Icons
      '.comment-button',
      '.comment-action',
      // LinkedIn specific
      '.comment-button',
      // Facebook specific
      '[data-testid="comment"]',
      // Twitter specific
      '[data-testid="reply"]'
    ];
    
    // Try all selectors within the post element
    for (const selector of commentSelectors) {
      try {
        // Use querySelector if it's a valid CSS selector
        const commentButton = postElement.querySelector(selector);
        if (commentButton) return commentButton;
      } catch (e) {
        // For non-standard selectors like :contains, try a different approach
        if (selector.includes(':contains')) {
          const text = selector.match(/:contains\("(.+)"\)/)[1];
          const buttons = postElement.querySelectorAll('button');
          
          for (const button of buttons) {
            if (button.textContent.includes(text)) {
              return button;
            }
          }
        }
      }
    }
    
    // If no comment button found with specific selectors, try a more generic approach
    const buttons = postElement.querySelectorAll('button');
    for (const button of buttons) {
      const buttonText = button.textContent.toLowerCase();
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (buttonText.includes('comment') || buttonText.includes('reply') || 
          ariaLabel.includes('comment') || ariaLabel.includes('reply')) {
        return button;
      }
    }
    
    return null;
  }
  
  // Find the comment field within a social post
  function findCommentField(postElement) {
    // Common comment field selectors across platforms
    const commentFieldSelectors = [
      // Generic
      'textarea[placeholder*="comment" i]',
      'textarea[placeholder*="write" i]',
      'div[contenteditable="true"]',
      'input[placeholder*="comment" i]',
      // LinkedIn specific
      '.ql-editor',
      // Facebook specific
      '[data-testid="comment-composer"]',
      // Twitter specific
      '[data-testid="tweetTextarea"]'
    ];
    
    // Try all selectors within the post element and then document
    for (const selector of commentFieldSelectors) {
      // First try within post element
      let commentField = postElement.querySelector(selector);
      
      // If not found, try in the entire document (some comment fields appear outside the post element)
      if (!commentField) {
        commentField = document.querySelector(selector);
      }
      
      if (commentField) return commentField;
    }
    
    // If no comment field found with specific selectors, try a more generic approach
    const potentialFields = [
      ...postElement.querySelectorAll('textarea'),
      ...postElement.querySelectorAll('div[contenteditable="true"]'),
      ...postElement.querySelectorAll('input[type="text"]')
    ];
    
    for (const field of potentialFields) {
      const placeholder = field.getAttribute('placeholder')?.toLowerCase() || '';
      const ariaLabel = field.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (placeholder.includes('comment') || placeholder.includes('reply') || 
          placeholder.includes('write') || ariaLabel.includes('comment') ||
          ariaLabel.includes('reply')) {
        return field;
      }
    }
    
    return null;
  }
  
  // Find the submit button for comments
  function findSubmitButton(postElement) {
    // Common submit button selectors
    const submitSelectors = [
      // Generic
      'button[type="submit"]',
      'button[aria-label*="post" i]',
      'button[aria-label*="send" i]',
      // Text-based
      'button:contains("Post")',
      'button:contains("Send")',
      'button:contains("Comment")',
      // LinkedIn specific
      '.comments-comment-box__submit-button'
    ];
    
    // Try all selectors within the post element
    for (const selector of submitSelectors) {
      try {
        // Use querySelector if it's a valid CSS selector
        const submitButton = postElement.querySelector(selector);
        if (submitButton) return submitButton;
      } catch (e) {
        // For non-standard selectors like :contains, try a different approach
        if (selector.includes(':contains')) {
          const text = selector.match(/:contains\("(.+)"\)/)[1];
          const buttons = postElement.querySelectorAll('button');
          
          for (const button of buttons) {
            if (button.textContent.includes(text)) {
              return button;
            }
          }
        }
      }
    }
    
    // If no submit button found within post element, check document
    for (const selector of submitSelectors) {
      try {
        // Use querySelector if it's a valid CSS selector
        const submitButton = document.querySelector(selector);
        if (submitButton) return submitButton;
      } catch (e) {
        // For non-standard selectors like :contains, try a different approach
        if (selector.includes(':contains')) {
          const text = selector.match(/:contains\("(.+)"\)/)[1];
          const buttons = document.querySelectorAll('button');
          
          for (const button of buttons) {
            if (button.textContent.includes(text)) {
              return button;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  // Highlight an element temporarily
  function highlightElement(element, duration = ANIMATION_DURATION) {
    if (!element) return;
    
    // Create highlight overlay
    const overlay = document.createElement('div');
    const rect = element.getBoundingClientRect();
    
    // Set overlay styles
    Object.assign(overlay.style, {
      position: 'fixed',
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      backgroundColor: 'rgba(77, 144, 254, 0.5)',
      border: '2px solid #4d90fe',
      borderRadius: '3px',
      zIndex: '10000',
      pointerEvents: 'none'
    });
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Remove after duration
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, duration);
  }
  
  // Click an element
  async function clickElement(element) {
    if (!element) return;
    
    // Try different click methods
    try {
      // Method 1: Native click
      element.click();
    } catch (e) {
      try {
        // Method 2: MouseEvent
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        element.dispatchEvent(clickEvent);
      } catch (e2) {
        // Method 3: Simulated click sequence
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
          const event = new MouseEvent(eventType, {
            view: window,
            bubbles: true,
            cancelable: true
          });
          element.dispatchEvent(event);
        });
      }
    }
    
    // Return a promise that resolves after a short delay
    return new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Type text into an element
  async function typeText(element, text) {
    if (!element) return;
    
    // Different input methods based on element type
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      // For standard input elements
      for (let i = 0; i < text.length; i++) {
        element.value += text[i];
        
        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
        
        // Add slight delay between characters
        await sleep(TYPING_DELAY);
      }
    } else if (element.getAttribute('contenteditable') === 'true') {
      // For contenteditable elements
      for (let i = 0; i < text.length; i++) {
        // Insert text at cursor position
        document.execCommand('insertText', false, text[i]);
        
        // Add slight delay between characters
        await sleep(TYPING_DELAY);
      }
    } else {
      // Fallback method if element doesn't support standard input
      element.textContent = text;
    }
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);
  }
  
  // Sleep utility function
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})();
