// This script is injected into the page to get its content.

console.log("content.js has been injected!");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request.action);
    if (request.action === "inPageApply") {
        console.log("In-page apply started");
        activateInPageApply();
    } else if (request.action === "requestPageContent") {
        console.log("Responding to requestPageContent...");
        sendResponse({
            action: "getPageContent", // Include action in response for clarity
            content: document.body.innerText,
            url: window.location.href
        });
        console.log("Sent getPageContent response.");
    }
});

// Send page content immediately when injected
chrome.runtime.sendMessage({
    action: "getPageContent",
    content: document.body.innerText,
    url: window.location.href
});

function activateInPageApply() {
    console.log("activateInPageApply called.");
    const questionText = "Be specific & engaging: Express genuine interest in the company. Highlight 1-2 key reasons you're a good fit.";
    
    // Find all text nodes on the page
    const allTextNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let currentNode;
    let found = false;
    while (currentNode = allTextNodes.nextNode()) {
        if (currentNode.nodeValue.includes(questionText)) {
            console.log("Found question text node.", currentNode);
            const targetElement = currentNode.parentElement;
            injectUI(targetElement);
            found = true;
            break;
        }
    }
    if (!found) {
        console.log("Question text not found on page:", questionText);
    }
}

function injectUI(targetElement) {
    console.log("injectUI called with targetElement:", targetElement);
    const uiContainer = document.createElement('div');
    uiContainer.style.marginTop = '10px';
    uiContainer.style.border = '1px solid #ccc';
    uiContainer.style.padding = '10px';

    const generateButton = document.createElement('button');
    generateButton.textContent = 'Generate Answer';
    generateButton.style.marginRight = '10px';

    const answerTextarea = document.createElement('textarea');
    answerTextarea.style.width = '100%';
    answerTextarea.style.marginTop = '10px';
    answerTextarea.rows = 3;

    uiContainer.appendChild(generateButton);
    uiContainer.appendChild(answerTextarea);

    targetElement.appendChild(uiContainer);

    generateButton.addEventListener('click', () => {
        const jobDescription = document.body.innerText;
        chrome.runtime.sendMessage({
            action: 'generateInPageAnswer',
            question: "Be specific & engaging: Express genuine interest in the company. Highlight 1-2 key reasons you're a good fit.",
            jobDescription: jobDescription
        }, (response) => {
            if (response && response.answer) {
                answerTextarea.value = response.answer;
            } else {
                answerTextarea.value = 'Error generating answer.';
            }
        });
    });
}
