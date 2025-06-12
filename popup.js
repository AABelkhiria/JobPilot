const generateBtn = document.getElementById('generateBtn');
const statusDiv = document.getElementById('status');

// This function will be called to kick off the process
generateBtn.addEventListener('click', () => {
  generateBtn.disabled = true;
  updateStatus('Reading page content...', 'info');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        files: ['content.js']
      },
      () => {
        if (chrome.runtime.lastError) {
          updateStatus(`Error reading page: ${chrome.runtime.lastError.message}`, 'error');
          generateBtn.disabled = false;
        }
      }
    );
  });
});

// This listener handles all incoming messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Message from content.js with the page data
  if (request.action === "getPageContent") {
    updateStatus('Page content received. Preparing request...', 'info');
    // Forward the data to the background script to start the main process
    chrome.runtime.sendMessage({
      action: 'generateCoverLetter',
      pageContent: request.content,
      pageUrl: request.url
    });
  }

  // Status updates from the background script
  if (request.action === "updateStatus") {
    updateStatus(request.message, 'info');
  }

  // Final message from the background script when the process is complete
  if (request.action === "generationComplete") {
    if (request.status === 'success') {
      updateStatus('PDF downloaded successfully!', 'info');
      setTimeout(() => window.close(), 2500); // Close popup after success
    } else {
      updateStatus(`Error: ${request.message}`, 'error');
      generateBtn.disabled = false;
    }
  }
});

function updateStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = type; // 'info' or 'error'
}