# Browseen Developer Guide

This guide provides detailed information for developers who want to extend or integrate Browseen into their own applications.

## Architecture Overview

Browseen is built on a modular architecture that consists of the following components:

1. **Command Parser**: Interprets natural language commands into structured actions
2. **Element Finder**: Uses multiple strategies to locate elements based on semantic descriptions
3. **Action Executor**: Performs browser operations based on identified elements
4. **Context Manager**: Maintains state and context awareness across operations
5. **Extension UI**: Provides user interface for entering and selecting commands

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Command Parser ├────►│ Element Finder  ├────►│ Action Executor │
│                 │     │                 │     │                 │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │                                               │
         │            ┌─────────────────┐                │
         │            │                 │                │
         └───────────►│ Context Manager │◄───────────────┘
                      │                 │
                      └─────────────────┘
```

## Extending Command Support

To add support for new commands:

1. Add a new regex pattern to the `COMMAND_PATTERNS` object in `content.js`:

```javascript
const COMMAND_PATTERNS = {
  // Existing patterns
  EXISTING_COMMAND: /^EXISTING_COMMAND\s+.../i,
  
  // Your new command
  NEW_COMMAND: /^NEW_COMMAND\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))(?:\s+(.*))?$/i,
};
```

2. Add a handler function for your command:

```javascript
// Handler for NEW_COMMAND
async function handleNewCommand(command) {
  // Parse parameters from command.params
  const targetElement = await findElement(command.params.target, command.params.modifiers);
  
  if (!targetElement) {
    throw new Error(`Could not find element for: ${command.params.target}`);
  }
  
  // Implement your command logic here
  await performCustomAction(targetElement);
  
  return `Successfully executed NEW_COMMAND on ${command.params.target}`;
}
```

3. Add your handler to the command execution switch in the `executeCommand` function:

```javascript
switch (command.action.toUpperCase()) {
  // Existing cases
  case 'EXISTING_COMMAND':
    return await handleExistingCommand(command);
  
  // Your new command
  case 'NEW_COMMAND':
    return await handleNewCommand(command);
    
  default:
    throw new Error(`Unknown command: ${command.action}`);
}
```

## Adding Site-Specific Support

While Browseen is designed to work generically across sites, you can add specialized support for specific websites:

1. Create a site detector function:

```javascript
function detectSite() {
  const url = window.location.href;
  
  if (url.includes('example.com')) return 'EXAMPLE';
  if (url.includes('customsite.org')) return 'CUSTOM_SITE';
  
  return 'GENERIC';
}
```

2. Add site-specific element finders:

```javascript
function findElementForSite(targetText, site) {
  switch (site) {
    case 'EXAMPLE':
      // Custom logic for example.com
      return document.querySelector(`.example-specific-class:contains("${targetText}")`);
      
    case 'CUSTOM_SITE':
      // Custom logic for customsite.org
      return document.querySelector(`[data-custom-attr="${targetText}"]`);
      
    default:
      // Fall back to generic methods
      return findElementGeneric(targetText);
  }
}
```

3. Integrate the site-specific functions into the main element finder:

```javascript
async function findElement(targetText, modifiers) {
  const site = detectSite();
  
  // Try site-specific approach first
  const siteSpecificElement = findElementForSite(targetText, site);
  if (siteSpecificElement) return siteSpecificElement;
  
  // Fall back to generic approaches
  // ... existing generic element finding code ...
}
```

## Creating Custom UI Extensions

You can create custom UIs or extend the existing popup:

1. Create a new HTML file for your custom UI:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Browseen Custom UI</title>
  <link rel="stylesheet" href="your-custom-styles.css">
</head>
<body>
  <div class="custom-ui-container">
    <h1>Browseen Custom Controller</h1>
    <div class="command-buttons">
      <button data-command="CLICK 'Sign in'">Sign In</button>
      <button data-command="LIKE nearest post">Like Post</button>
      <!-- Add more command buttons -->
    </div>
    <!-- Add your custom UI elements -->
  </div>
  <script src="custom-ui.js"></script>
</body>
</html>
```

2. Create JavaScript to handle your custom UI:

```javascript
// custom-ui.js
document.addEventListener('DOMContentLoaded', function() {
  const commandButtons = document.querySelectorAll('[data-command]');
  
  commandButtons.forEach(button => {
    button.addEventListener('click', function() {
      const command = this.getAttribute('data-command');
      
      // Send command to active tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {action: 'executeCommand', command: command}
        );
      });
    });
  });
  
  // Add your custom UI logic
});
```

3. Register your custom UI in the manifest:

```json
{
  "browser_action": {
    "default_popup": "popup.html",
    "default_icon": "icons/icon48.png"
  },
  "options_page": "your-custom-ui.html"
}
```

## Voice Integration

To integrate Browseen with voice commands:

1. Add Web Speech API support:

```javascript
// voice-integration.js
function startVoiceRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Speech recognition not supported in this browser');
    return;
  }
  
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    processVoiceCommand(transcript);
  };
  
  recognition.start();
}

function processVoiceCommand(voiceInput) {
  // Map natural language to Browseen commands
  let command = '';
  
  if (voiceInput.includes('click on') || voiceInput.includes('press')) {
    const target = voiceInput.replace(/click on|press/i, '').trim();
    command = `CLICK '${target}'`;
  } else if (voiceInput.includes('type') && voiceInput.includes('in')) {
    const parts = voiceInput.match(/type "(.*)" in (.*)/i);
    if (parts && parts.length >= 3) {
      command = `TYPE '${parts[1]}' IN '${parts[2]}'`;
    }
  }
  // Add more voice command patterns
  
  if (command) {
    // Execute the parsed command
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {action: 'executeCommand', command: command}
      );
    });
  }
}
```

2. Add voice activation button to the UI:

```html
<button id="voice-button" class="voice-activation">
  <svg><!-- Microphone icon --></svg>
  Voice Command
</button>

<script>
  document.getElementById('voice-button').addEventListener('click', startVoiceRecognition);
</script>
```

## Testing Extensions

To effectively test your Browseen extensions:

1. Create a test framework:

```javascript
// test-framework.js
const testScenarios = [
  {
    name: 'Click Test',
    command: 'CLICK "Test Button"',
    setup: () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);
      return button;
    },
    validate: (element) => {
      return element.classList.contains('clicked');
    },
    cleanup: (element) => {
      document.body.removeChild(element);
    }
  },
  // Add more test scenarios
];

async function runTests() {
  let passedTests = 0;
  
  for (const scenario of testScenarios) {
    console.log(`Running test: ${scenario.name}`);
    
    // Setup test environment
    const element = scenario.setup();
    
    try {
      // Execute command
      chrome.runtime.sendMessage({
        action: 'executeCommand',
        command: scenario.command
      });
      
      // Wait for command to execute
      await new Promise(r => setTimeout(r, 1000));
      
      // Validate result
      const passed = scenario.validate(element);
      if (passed) {
        console.log(`✓ Test passed: ${scenario.name}`);
        passedTests++;
      } else {
        console.error(`✗ Test failed: ${scenario.name}`);
      }
    } catch (error) {
      console.error(`✗ Test error: ${scenario.name}`, error);
    } finally {
      // Clean up
      scenario.cleanup(element);
    }
  }
  
  console.log(`Tests completed: ${passedTests}/${testScenarios.length} passed`);
}
```

## Performance Optimization

To optimize Browseen for better performance:

1. Implement element caching:

```javascript
// Element cache with expiration
const elementCache = {
  items: {},
  maxAge: 5000, // 5 seconds
  
  set: function(key, element) {
    this.items[key] = {
      element: element,
      timestamp: Date.now()
    };
  },
  
  get: function(key) {
    const item = this.items[key];
    if (!item) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - item.timestamp > this.maxAge) {
      delete this.items[key];
      return null;
    }
    
    // Check if element is still in DOM
    if (!document.contains(item.element)) {
      delete this.items[key];
      return null;
    }
    
    return item.element;
  },
  
  clear: function() {
    this.items = {};
  }
};
```

2. Implement throttled execution:

```javascript
// Throttle function for commands that might be repeated quickly
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Apply throttling to scroll command
const throttledScroll = throttle(handleScroll, 300);
```

## Security Considerations

When extending Browseen, consider these security best practices:

1. **Content Security**: Validate all content before injecting into pages
2. **Permission Limitations**: Only request permissions that are absolutely necessary
3. **Data Handling**: Avoid storing sensitive information from commands
4. **Input Sanitization**: Sanitize all command inputs before processing
5. **Cross-Origin Issues**: Be aware of cross-origin limitations when accessing content

## Contributing to Browseen

To contribute to the Browseen project:

1. Fork the repository on GitHub
2. Create a feature branch for your changes
3. Follow the code style and architecture patterns
4. Add appropriate tests for your new features
5. Submit a pull request with detailed description of your changes

## API Reference

The core Browseen API includes these key functions:

| Function | Description | Parameters |
|----------|-------------|------------|
| `parseCommand(commandStr)` | Parses a command string into structured format | `commandStr`: String command |
| `executeCommand(command)` | Executes a parsed command | `command`: Command object |
| `findElement(targetText, modifiers)` | Finds an element based on description | `targetText`: Target description, `modifiers`: Additional parameters |
| `highlightElement(element, duration)` | Highlights an element | `element`: DOM element, `duration`: Highlight time in ms |
| `clickElement(element)` | Simulates click on element | `element`: DOM element |
| `typeText(element, text)` | Types text into element | `element`: DOM element, `text`: String to type |
| `scrollPage(direction, amount)` | Scrolls the page | `direction`: Scroll direction, `amount`: Scroll distance |

## Advanced Examples

### Chain Commands

```javascript
// Chaining multiple commands with dependencies
async function chainCommands(commands) {
  let lastResult = null;
  
  for (const cmdStr of commands) {
    // If command contains {result}, replace with previous result
    const processedCmd = cmdStr.replace(/{result}/g, lastResult);
    
    // Execute command
    const result = await executeCommand(processedCmd);
    lastResult = result;
  }
  
  return lastResult;
}

// Example usage
chainCommands([
  'FIND "product name"',
  'CLICK "Add to cart" NEAR {result}',
  'CLICK "Checkout"'
]);
```

### Custom Element Finders

```javascript
// Add custom element finding strategies
function addCustomFinder(name, finderFunction) {
  elementFinders[name] = finderFunction;
}

// Example custom finder for a specific site
addCustomFinder('customSite', function(targetText) {
  // Custom logic for finding elements in a specific site
  return document.querySelector(`.custom-component[data-label="${targetText}"]`);
});
```

### Integration with Analytics

```javascript
// Track command usage with analytics
function trackCommandExecution(command, success, duration) {
  // Send analytics data
  chrome.runtime.sendMessage({
    action: 'trackAnalytics',
    data: {
      commandType: command.action,
      target: command.params.target,
      success: success,
      executionTime: duration,
      url: window.location.href,
      timestamp: Date.now()
    }
  });
}

// Wrap executeCommand to include analytics
const originalExecuteCommand = executeCommand;
executeCommand = async function(command) {
  const startTime = performance.now();
  let success = true;
  
  try {
    const result = await originalExecuteCommand(command);
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    trackCommandExecution(command, success, duration);
  }
};
```

## Troubleshooting Extension Development

| Problem | Possible Cause | Solution |
|---------|---------------|----------|
| Commands not being parsed | Regex pattern issue | Check your regex patterns against test cases |
| Elements not found | Selector strategy mismatch | Add more element finding strategies or site-specific finders |
| Permissions issues | Missing permissions in manifest | Add required permissions to manifest.json |
| Command execution timing out | Async operation handling | Improve promise chaining and add proper timeout handling |
| Cross-origin issues | Security restrictions | Use messaging between content script and background script |
| UI not updating | DOM update timing | Use MutationObserver to detect DOM changes |
