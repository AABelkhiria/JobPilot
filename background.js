// Use importScripts to load the library.
importScripts('./lib/jspdf.umd.min.js');

const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

// Main listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateCoverLetter") {
    generate(request);
    return true;
  }
  if (request.action === "rateJobPosition") {
    rateJob(request);
    return true;
  }
});

async function rateJob(requestData) {
  try {
    const items = await chrome.storage.sync.get(['geminiApiKey', 'userInfo']);
    if (!items.geminiApiKey || !items.userInfo?.skills) { // Check for essential info
      chrome.runtime.sendMessage({ action: 'ratingComplete', status: 'error', message: 'API Key or user skills not set in options.' });
      chrome.runtime.openOptionsPage();
      return;
    }

    const ratingJson = await callGeminiForRating(items.geminiApiKey, items.userInfo, requestData.pageContent);
    chrome.runtime.sendMessage({ action: 'ratingComplete', status: 'success', data: ratingJson });

  } catch (error) {
    console.error("Rating Error:", error);
    chrome.runtime.sendMessage({ action: 'ratingComplete', status: 'error', message: error.message });
  }
}

async function callGeminiForRating(apiKey, userInfo, jobDescription) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `
        Analyze the following job description against my professional information and provide a detailed suitability analysis.

        MY PROFESSIONAL INFORMATION:
        - Profile: ${userInfo.profile}
        - Experience: ${userInfo.experience}
        - Key Skills: ${userInfo.skills}

        JOB DESCRIPTION:
        ${jobDescription.substring(0, 15000)}

        TASK:
        Based on my "Key Skills" and "Experience", analyze my fit for the role. Your response MUST be a single, valid JSON object with the following keys:
        
        1. "rating": An integer from 0 to 5, where 0 is no match and 5 is a perfect match.
        2. "summary": A brief, 1-2 sentence overall summary of the match.
        3. "pros": An array of strings. Each string should be a specific point explaining WHY I am a good fit (e.g., "Your experience with Node.js is a direct match for a key requirement.").
        4. "cons": An array of strings. Each string should be a specific point explaining a potential GAP or missing requirement (e.g., "The job asks for 3+ years of experience with GraphQL, which is not listed in your skills."). If there are no clear gaps, this can be an empty array.

        Example response format:
        {
          "rating": 4,
          "summary": "This is a strong match due to your extensive experience with backend technologies listed. The primary gap is in front-end styling frameworks.",
          "pros": [
            "Your 5+ years in full-stack development align with the senior-level expectation.",
            "Proficiency in AWS and Docker matches their cloud-native environment.",
            "Experience leading projects is a direct fit for the 'lead developer' responsibility."
          ],
          "cons": [
            "The role requires experience with Tailwind CSS, which is not mentioned in your skills.",
            "Familiarity with gRPC is listed as a plus and appears to be a gap."
          ]
        }
    `;

  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };
  const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API request failed: ${errorData.error.message}`);
  }

  const data = await response.json();
  const rawText = data.candidates[0].content.parts[0].text;

  try {
    const cleanedText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", rawText);
    throw new Error("The AI returned an invalid response. Please try again.");
  }
}

// The main logic flow
async function generate(requestData) {
  const sendStatusUpdate = (data) => chrome.runtime.sendMessage({ action: 'updateStatus', data });
  const sendCompletionMessage = (status, data, message) => chrome.runtime.sendMessage({ action: 'generationComplete', status, data, message });

  let currentStep = 'settings'; // Keep track of the current step for error reporting
  try {
    sendStatusUpdate({ step: 'settings', message: 'Accessing your settings...' });
    const items = await chrome.storage.sync.get(['geminiApiKey', 'userInfo']);

    if (!items.geminiApiKey) {
      chrome.runtime.openOptionsPage();
      sendCompletionMessage('error', { step: currentStep }, 'API key not found. Please set it in options.');
      return;
    }
    if (!items.userInfo || !items.userInfo.profile || !items.userInfo.experience || !items.userInfo.skills) {
      chrome.runtime.openOptionsPage();
      sendCompletionMessage('error', { step: currentStep }, 'User info incomplete. Please check options.');
      return;
    }

    currentStep = 'api-call';
    sendStatusUpdate({ step: 'api-call', message: 'Contacting Gemini AI...' });
    const rawApiResponse = await callGeminiApi(items.geminiApiKey, items.userInfo, requestData.pageContent, requestData.pageUrl);
    const coverLetterText = cleanApiResponse(rawApiResponse);

    currentStep = 'create-pdf';
    sendStatusUpdate({ step: 'create-pdf', message: 'AI response received. Creating PDF...' });
    const { dataUri, filename } = generatePdfData(coverLetterText, items.userInfo);

    currentStep = 'download';
    sendStatusUpdate({ step: 'download', message: 'Preparing download...' });
    await savePdfViaOffscreen(dataUri, filename);

    // Success is handled by the popup listener after the final step is marked completed
    sendCompletionMessage('success');

  } catch (error) {
    console.error(`Error during step '${currentStep}':`, error);
    sendCompletionMessage('error', { step: currentStep }, error.message);
  }
}

/**
 * Removes the markdown code block fence (```text ... ```) from the AI response.
 * @param {string} text The raw text from the Gemini API.
 * @returns {string} The cleaned text.
 */
function cleanApiResponse(text) {
  // Use a regular expression to find and replace the markdown wrapper.
  // It looks for ``` followed by an optional language specifier (like 'text')
  // at the beginning, and ``` at the end. The 's' flag allows '.' to match newlines.
  const regex = /^\s*```(?:[a-zA-Z]*)?\n(.*?)\n```\s*$/s;
  const match = text.match(regex);

  // If a match is found, return the captured group (the content inside).
  // Otherwise, return the original text, trimmed.
  return match ? match[1].trim() : text.trim();
}

async function callGeminiApi(apiKey, userInfo, jobDescription, jobUrl) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `
      Please write a professional and enthusiastic cover letter based on my information and the provided job description. The job was found at this URL: ${jobUrl}.
      
      The cover letter must be tailored specifically to the job description. It should connect my skills and experience to the requirements listed in the job post. do not mention skills or experiences that are not matching the job description.
      Address the hiring manager if their name is available, otherwise use a generic but professional greeting.
      Structure it in a standard cover letter format. Be concise, professional, and do not make up any skills I don't have.
      Answer with just the email body.

      ---
      MY PROFESSIONAL INFORMATION:

      ## Profile Summary
      ${userInfo.fullName}
      ${userInfo.profile}

      ## Experience Summary
      ${userInfo.experience}

      ## Key Skills
      ${userInfo.skills}
      ---
      JOB DESCRIPTION:
      ${jobDescription.substring(0, 28000)} 
      ---
    `;

  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };
  const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
  if (!response.ok) { const errorData = await response.json(); throw new Error(`API request failed: ${errorData.error.message}`); }
  const data = await response.json();
  if (!data.candidates || !data.candidates[0].content.parts[0].text) { throw new Error('Received an invalid response from the API.'); }
  return data.candidates[0].content.parts[0].text;
}

function generatePdfData(text, userInfo) {
  const { jsPDF } = self.jspdf;
  const doc = new jsPDF();
  doc.setProperties({ title: `Cover Letter - ${userInfo.fullName}`, author: userInfo.fullName });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(userInfo.fullName, 15, 20);
  doc.text(userInfo.address || '', 15, 26);
  doc.text(`${userInfo.email} | ${userInfo.phone}`, 15, 32);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(today, 15, 50);
  const bodyLines = doc.splitTextToSize(text, 180);
  doc.text(bodyLines, 15, 65);
  const filename = `Cover-Letter-${userInfo.fullName.replace(/\s/g, '_')}.pdf`;
  return { dataUri: doc.output('datauristring'), filename: filename };
}

async function savePdfViaOffscreen(dataUri, filename) {
  const existingContexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existingContexts.length > 0) {
    chrome.runtime.sendMessage({ target: 'offscreen-doc', action: 'download-pdf', dataUri: dataUri, filename: filename });
    return;
  }
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['BLOBS'],
    justification: 'To create a blob from a data URI and trigger a PDF download.',
  });
  setTimeout(() => {
    chrome.runtime.sendMessage({ target: 'offscreen-doc', action: 'download-pdf', dataUri: dataUri, filename: filename });
  }, 500);
}
