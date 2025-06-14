const generateBtn = document.getElementById('generateBtn');
const rateBtn = document.getElementById('rateBtn');
const statusMessageDiv = document.getElementById('status-message');
const progressSteps = document.getElementById('progress-steps');
const ratingDisplay = document.getElementById('rating-display');
const starRatingDiv = document.querySelector('.star-rating');
const ratingExplanationDiv = document.getElementById('rating-explanation');
const STEPS_IN_ORDER = ['read-page', 'settings', 'api-call', 'create-pdf', 'download'];
let currentAction = null;

const ratingSummary = document.getElementById('rating-summary');
const prosContainer = document.getElementById('pros-container');
const consContainer = document.getElementById('cons-container');
const prosList = document.getElementById('pros-list');
const consList = document.getElementById('cons-list');

// --- UI State Management ---
function showView(view) {
  progressSteps.style.display = view === 'progress' ? 'block' : 'none';
  ratingDisplay.style.display = view === 'rating' ? 'block' : 'none';
}

function setButtonsDisabled(disabled) {
  generateBtn.disabled = disabled;
  rateBtn.disabled = disabled;
}

// --- Event Listeners ---
rateBtn.addEventListener('click', () => handleAction('rate'));
generateBtn.addEventListener('click', () => handleAction('generate'));

function handleAction(type) {
  currentAction = type;
  setButtonsDisabled(true);

  if (type === 'generate') {
    showView('progress');
    updateProgress('read-page', 'active', 'Reading page content...');
  } else { // 'rate'
    showView('rating');
    ratingSummary.textContent = '';
    prosContainer.style.display = 'none';
    consContainer.style.display = 'none';
    prosList.innerHTML = '';
    consList.innerHTML = '';

    renderRating({ rating: 0 }); // Reset stars
    starRatingDiv.classList.add('loading');
    statusMessageDiv.textContent = 'Analyzing job match...';
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      { target: { tabId: tabs[0].id }, files: ['content.js'] },
      () => {
        if (chrome.runtime.lastError) {
          if (currentAction === 'generate') {
            updateProgress('read-page', 'error', `Error: ${chrome.runtime.lastError.message}`);
          } else {
            statusMessageDiv.textContent = `Error reading page.`;
            statusMessageDiv.style.color = 'var(--error-color)';
          }
          setButtonsDisabled(false);
        }
      }
    );
  });
}

// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Message from content.js
  if (request.action === "getPageContent") {
    if (currentAction === 'generate') {
      chrome.runtime.sendMessage({ action: 'generateCoverLetter', pageContent: request.content, pageUrl: request.url });
    } else if (currentAction === 'rate') {
      chrome.runtime.sendMessage({ action: 'rateJobPosition', pageContent: request.content, pageUrl: request.url });
    }
    return;
  }

  // Status updates for 'Generate'
  if (request.action === "updateStatus") {
    updateProgress(request.data.step, 'active', request.data.message);
  }

  // Completion for 'Generate'
  if (request.action === "generationComplete") {
    if (request.status === 'success') {
      updateProgress('download', 'completed', 'PDF downloaded successfully!');
      setTimeout(() => window.close(), 2500);
    } else {
      updateProgress(request.data.step, 'error', `Error: ${request.message}`);
      setButtonsDisabled(false);
    }
  }

  // Completion for 'Rate'
  if (request.action === "ratingComplete") {
    setButtonsDisabled(false);
    starRatingDiv.classList.remove('loading');

    if (request.status === 'success') {
      renderRating(request.data);
      statusMessageDiv.textContent = 'Analysis complete.';
      statusMessageDiv.style.color = 'var(--secondary-text-color)';
    } else {
      statusMessageDiv.textContent = `Error: ${request.message}`;
      statusMessageDiv.style.color = 'var(--error-color)';
      renderRating({ rating: 0, explanation: '' });
    }
  }
});

function renderRating(data, isReset = false) {
  const { rating, summary, pros, cons } = data;
  const defaultSummary = 'Is this job a good fit for you?';

  // Render stars
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    starsHtml += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
  }
  starRatingDiv.innerHTML = starsHtml;

  // If this is just a reset call, stop here.
  if (isReset) {
    ratingSummary.textContent = defaultSummary;
    prosContainer.style.display = 'none';
    consContainer.style.display = 'none';
    return;
  }

  // Render summary
  ratingSummary.textContent = summary || defaultSummary;

  // Render Pros
  if (pros && pros.length > 0) {
    prosList.innerHTML = pros.map(item => `<li>${item}</li>`).join('');
    prosContainer.style.display = 'block';
  } else {
    prosContainer.style.display = 'none';
  }

  // Render Cons
  if (cons && cons.length > 0) {
    consList.innerHTML = cons.map(item => `<li>${item}</li>`).join('');
    consContainer.style.display = 'block';
  } else {
    consContainer.style.display = 'none';
  }
}

function updateProgress(currentStepId, status, message) {
  let hasReachedCurrent = false;
  for (const stepId of STEPS_IN_ORDER) {
    const stepElement = document.getElementById(`step-${stepId}`);
    if (hasReachedCurrent) {
      stepElement.className = '';
    } else {
      if (stepId === currentStepId) {
        stepElement.className = status;
        hasReachedCurrent = true;
      } else {
        stepElement.className = 'completed';
      }
    }
  }
  statusMessageDiv.textContent = message || '';
}
