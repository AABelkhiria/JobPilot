// Use importScripts to load the library.
importScripts('./lib/jspdf.umd.min.js');

const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

// Main listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateCoverLetter") {
    generate(request);
    return true; // Indicates an asynchronous response.
  }
});

// The main logic flow
async function generate(requestData) {
  const sendStatusUpdate = (message) => chrome.runtime.sendMessage({ action: 'updateStatus', message });
  const sendCompletionMessage = (status, message) => chrome.runtime.sendMessage({ action: 'generationComplete', status, message });

  try {
    sendStatusUpdate('Accessing your settings...');
    const items = await chrome.storage.sync.get(['geminiApiKey', 'userInfo']);
    
    if (!items.geminiApiKey) {
      chrome.runtime.openOptionsPage();
      sendCompletionMessage('error', 'API key not found. Please set it in options.');
      return;
    }
    if (!items.userInfo || !items.userInfo.profile || !items.userInfo.experience || !items.userInfo.skills) {
      chrome.runtime.openOptionsPage();
      sendCompletionMessage('error', 'User info is incomplete. Please fill out Profile, Experience, and Skills in options.');
      return;
    }

    sendStatusUpdate('Contacting Gemini AI...');
    const rawApiResponse = await callGeminiApi(items.geminiApiKey, items.userInfo, requestData.pageContent, requestData.pageUrl);
    const coverLetterText = cleanApiResponse(rawApiResponse);
    
    sendStatusUpdate('AI response received. Creating PDF data...');
    const { dataUri, filename } = generatePdfData(coverLetterText, items.userInfo);

    sendStatusUpdate('Preparing download...');
    await savePdfViaOffscreen(dataUri, filename);

    sendCompletionMessage('success');

  } catch (error) {
    console.error("Background script error:", error);
    sendCompletionMessage('error', error.message);
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
