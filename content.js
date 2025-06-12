// This script is injected into the page to get its content.
chrome.runtime.sendMessage({
    action: "getPageContent",
    content: document.body.innerText,
    url: window.location.href
});