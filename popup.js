const generateBtn = document.getElementById('generateBtn');
const statusMessageDiv = document.getElementById('status-message');

// Define the steps in order. The IDs must match the <li> IDs in popup.html
const STEPS_IN_ORDER = ['read-page', 'settings', 'api-call', 'create-pdf', 'download'];

// Function to reset the UI to its initial state
function resetUI() {
    STEPS_IN_ORDER.forEach(stepId => {
        const stepElement = document.getElementById(`step-${stepId}`);
        stepElement.className = '';
    });
    statusMessageDiv.textContent = '';
    generateBtn.disabled = false;
}

// Function to update the progress stepper
function updateProgress(currentStepId, status, message) {
    let hasReachedCurrent = false;
    for (const stepId of STEPS_IN_ORDER) {
        const stepElement = document.getElementById(`step-${stepId}`);
        if (hasReachedCurrent) {
            stepElement.className = ''; // Reset future steps
        } else {
            if (stepId === currentStepId) {
                stepElement.className = status; // 'active', 'completed', or 'error'
                hasReachedCurrent = true;
            } else {
                stepElement.className = 'completed'; // Mark previous steps as completed
            }
        }
    }
    statusMessageDiv.textContent = message || '';
}

// Kick off the process
generateBtn.addEventListener('click', () => {
    generateBtn.disabled = true;
    resetUI();
    updateProgress('read-page', 'active', 'Reading page content...');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.scripting.executeScript(
            { target: { tabId: activeTab.id }, files: ['content.js'] },
            () => {
                if (chrome.runtime.lastError) {
                    updateProgress('read-page', 'error', `Error: ${chrome.runtime.lastError.message}`);
                    generateBtn.disabled = false;
                }
            }
        );
    });
});

// Main listener for all messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Message from content.js with page data
    if (request.action === "getPageContent") {
        chrome.runtime.sendMessage({
            action: 'generateCoverLetter',
            pageContent: request.content,
            pageUrl: request.url
        });
    }

    // Status updates from the background script
    if (request.action === "updateStatus") {
        updateProgress(request.data.step, 'active', request.data.message);
    }

    // Final message from the background script
    if (request.action === "generationComplete") {
        if (request.status === 'success') {
            updateProgress('download', 'completed', 'PDF downloaded successfully!');
            setTimeout(() => window.close(), 2500);
        } else {
            // Mark the step that failed as an error
            updateProgress(request.data.step, 'error', `Error: ${request.message}`);
            generateBtn.disabled = false;
        }
    }
});