// Listen for messages from the background script
chrome.runtime.onMessage.addListener(handleMessages);

function handleMessages(message) {
  // Check that the message is intended for this offscreen document
  if (message.target === 'offscreen-doc' && message.action === 'download-pdf') {
    downloadPdf(message.dataUri, message.filename);
    // Return true to indicate you will be sending a response asynchronously
    return true; 
  }
}

// Function to create an anchor tag and trigger the download
function downloadPdf(dataUri, filename) {
  const a = document.createElement('a');
  a.href = dataUri;
  a.download = filename;
  a.click();
  // After the download is triggered, we can close the offscreen document
  // to free up resources. Give it a moment to ensure the click is processed.
  setTimeout(() => window.close(), 500);
}
