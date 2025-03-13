document.addEventListener('DOMContentLoaded', function() {
  const commandInput = document.getElementById('commandInput');
  const executeBtn = document.getElementById('executeBtn');
  const commandItems = document.querySelectorAll('.command-item');
  const statusElement = document.getElementById('status');
  
  // Execute command when button is clicked
  executeBtn.addEventListener('click', executeCommand);
  
  // Execute command when Enter key is pressed
  commandInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      executeCommand();
    }
  });
  
  // Fill input field when example command is clicked
  commandItems.forEach(item => {
    item.addEventListener('click', function() {
      const command = this.getAttribute('data-command');
      commandInput.value = command;
      // Auto-execute the command
      executeCommand();
    });
  });
  
  function executeCommand() {
    const command = commandInput.value.trim();
    
    if (!command) {
      showStatus('Please enter a command', 'error');
      return;
    }
    
    // Send command to content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {action: 'executeCommand', command: command},
        function(response) {
          if (response && response.success) {
            showStatus(`Command executed: ${command}`, 'success');
          } else {
            showStatus(`Failed to execute: ${response ? response.message : 'Unknown error'}`, 'error');
          }
        }
      );
    });
  }
  
  function showStatus(message, type) {
    statusElement.textContent = message;
    statusElement.className = 'status';
    statusElement.classList.add(type);
    
    // Hide status after 3 seconds
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 3000);
  }
});
