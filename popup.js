const generateBtn = document.getElementById('generateBtn');
const rateBtn = document.getElementById('rateBtn');
const inPageApplyBtn = document.getElementById('inPageApplyBtn');
const statusMessageDiv = document.getElementById('status-message');
const progressSteps = document.getElementById('progress-steps');
const ratingDisplay = document.getElementById('rating-display');
const starRatingDiv = document.querySelector('.star-rating');
const ratingExplanationDiv = document.getElementById('rating-explanation');
const inPageApplySection = document.getElementById('in-page-apply-section');
const expressInterestBtn = document.getElementById('expressInterestBtn');
const spontaneousApplicationBtn = document.getElementById('spontaneousApplicationBtn');
const inPageAnswerTextarea = document.getElementById('inPageAnswerTextarea');
const STEPS_IN_ORDER = ['read-page', 'settings', 'api-call', 'create-pdf', 'download'];
let currentAction = null;
let spontaneousEmailData = null;

const ratingSummary = document.getElementById('rating-summary');
const prosContainer = document.getElementById('pros-container');
const consContainer = document.getElementById('cons-container');
const prosList = document.getElementById('pros-list');
const consList = document.getElementById('cons-list');

// --- UI State Management ---
function showView(view) {
  progressSteps.style.display = view === 'progress' ? 'block' : 'none';
  ratingDisplay.style.display = view === 'rating' ? 'block' : 'none';
  inPageApplySection.style.display = view === 'in-page-apply' ? 'block' : 'none';
}

function setButtonsDisabled(disabled) {
  generateBtn.disabled = disabled;
  rateBtn.disabled = disabled;
  inPageApplyBtn.disabled = disabled;
}

// --- Event Listeners ---
rateBtn.addEventListener('click', () => handleAction('rate'));
generateBtn.addEventListener('click', () => handleAction('generate'));
inPageApplyBtn.addEventListener('click', () => handleAction('inPageApply'));

function handleAction(type) {
  currentAction = type;
  setButtonsDisabled(true);

  if (type === 'generate') {
    showView('progress');
    updateProgress('read-page', 'active', 'Reading page content...');
  } else if (type === 'rate') {
    showView('rating');
    ratingSummary.textContent = '';
    prosContainer.style.display = 'none';
    consContainer.style.display = 'none';
    prosList.innerHTML = '';
    consList.innerHTML = '';

    renderRating({ rating: 0 }); // Reset stars
    starRatingDiv.classList.add('loading');
    statusMessageDiv.textContent = 'Analyzing job match...';
  } else if (type === 'inPageApply') {
    showView('in-page-apply');
    statusMessageDiv.textContent = 'Ready to express interest.';
    expressInterestBtn.style.display = 'block';
    spontaneousApplicationBtn.style.display = 'block';
    inPageAnswerTextarea.style.display = 'none';
    inPageAnswerTextarea.textContent = '';
  }

  // Only inject content.js and send message if not in-page apply
  if (type === 'generate' || type === 'rate' || type === 'inPageApply') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        { target: { tabId: tabs[0].id }, files: ['content.js'] },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Script injection error:", chrome.runtime.lastError.message);
            if (currentAction === 'generate') {
              updateProgress('read-page', 'error', `Error: ${chrome.runtime.lastError.message}`);
            } else {
              statusMessageDiv.textContent = `Error reading page: ${chrome.runtime.lastError.message}`;
              statusMessageDiv.style.color = 'var(--error-color)';
            }
            setButtonsDisabled(false);
          }
        }
      );
    });
  }
}

// --- New Event Listener for In-Page Apply Button ---
expressInterestBtn.addEventListener('click', () => {
  setButtonsDisabled(true);
  expressInterestBtn.style.display = 'none';
  spontaneousApplicationBtn.style.display = 'none';
  inPageAnswerTextarea.style.display = 'block';
  statusMessageDiv.textContent = 'Generating answer...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "requestPageContent" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error receiving page content for in-page apply:", chrome.runtime.lastError.message);
        statusMessageDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
        statusMessageDiv.style.color = 'var(--error-color)';
        setButtonsDisabled(false);
        return;
      }

      if (response && response.action === "getPageContent") {
        chrome.runtime.sendMessage({
          action: 'generateInPageAnswer',
          question: "Express genuine interest in the company. Highlight 1-2 key reasons you're a good fit.",
          jobDescription: response.content
        }, (aiResponse) => {
          setButtonsDisabled(false);
          if (aiResponse && aiResponse.answer) {
            inPageAnswerTextarea.textContent = aiResponse.answer;
            statusMessageDiv.textContent = 'Answer generated.';
            statusMessageDiv.style.color = 'var(--secondary-text-color)';
          } else {
            inPageAnswerTextarea.textContent = 'Error generating answer.';
            statusMessageDiv.textContent = `Error: ${aiResponse.answer || 'Unknown error'}`;
            statusMessageDiv.style.color = 'var(--error-color)';
          }
        });
      } else {
        statusMessageDiv.textContent = 'Error: Could not get page content.';
        statusMessageDiv.style.color = 'var(--error-color)';
        setButtonsDisabled(false);
      }
    });
  });
});

spontaneousApplicationBtn.addEventListener('click', () => {
  setButtonsDisabled(true);
  expressInterestBtn.style.display = 'none';
  spontaneousApplicationBtn.style.display = 'none';
  inPageAnswerTextarea.style.display = 'block';
  statusMessageDiv.textContent = 'Generating email...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "requestPageContent" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error receiving page content for spontaneous application:", chrome.runtime.lastError.message);
        statusMessageDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
        statusMessageDiv.style.color = 'var(--error-color)';
        setButtonsDisabled(false);
        return;
      }

      if (response && response.action === "getPageContent") {
        chrome.runtime.sendMessage({
          action: 'generateInPageAnswer',
          question: "Write a brief and professional email for a spontaneous application to the company, based on the provided web page content. The email should express interest in the company, briefly mention my potential value, and inquire about any suitable open positions. The tone should be proactive and respectful. Return the response as a JSON object with the following keys: 'email', 'subject', 'body'.",
          jobDescription: response.content
        }, (aiResponse) => {
          setButtonsDisabled(false);
          if (aiResponse && aiResponse.answer) {
            console.log("AI Response:", aiResponse.answer);
            try {
              let jsonString = aiResponse.answer;
              const firstBrace = jsonString.indexOf('{');
              const lastBrace = jsonString.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonString = jsonString.substring(firstBrace, lastBrace + 1);
              }
              const answer = JSON.parse(jsonString);
              if (answer.body) {
                spontaneousEmailData = answer;
                inPageAnswerTextarea.textContent = answer.body;
                statusMessageDiv.textContent = 'Email generated.';
                statusMessageDiv.style.color = 'var(--secondary-text-color)';
              } else {
                inPageAnswerTextarea.textContent = 'Error: Invalid response format from AI (missing body).';
                statusMessageDiv.textContent = 'Error: Invalid response format from AI (missing body).';
                statusMessageDiv.style.color = 'var(--error-color)';
              }
            } catch (e) {
              inPageAnswerTextarea.textContent = 'Error: Could not parse AI response.';
              statusMessageDiv.textContent = 'Error: Could not parse AI response.';
              statusMessageDiv.style.color = 'var(--error-color)';
            }
          } else {
            inPageAnswerTextarea.textContent = 'Error generating email.';
            statusMessageDiv.textContent = `Error: ${aiResponse.answer || 'Unknown error'}`;
            statusMessageDiv.style.color = 'var(--error-color)';
          }
        });
      } else {
        statusMessageDiv.textContent = 'Error: Could not get page content.';
        statusMessageDiv.style.color = 'var(--error-color)';
        setButtonsDisabled(false);
      }
    });
  });
});

// --- Copy to Clipboard for In-Page Answer ---
inPageAnswerTextarea.addEventListener('click', async () => {
  const textToCopy = inPageAnswerTextarea.textContent;
  if (textToCopy) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalStatusText = statusMessageDiv.textContent;
      const originalStatusColor = statusMessageDiv.style.color;
      statusMessageDiv.textContent = 'Copied to clipboard!';
      statusMessageDiv.style.color = 'var(--success-color)';

      if (spontaneousEmailData && spontaneousEmailData.email && spontaneousEmailData.subject && spontaneousEmailData.body) {
        const mailtoLink = `mailto:${spontaneousEmailData.email}?subject=${encodeURIComponent(spontaneousEmailData.subject)}&body=${encodeURIComponent(spontaneousEmailData.body)}`;
        chrome.tabs.create({ url: mailtoLink });
      }

      setTimeout(() => {
        statusMessageDiv.textContent = originalStatusText;
        statusMessageDiv.style.color = originalStatusColor;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      statusMessageDiv.textContent = 'Failed to copy answer.';
      statusMessageDiv.style.color = 'var(--error-color)';
    }
  }
});

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
