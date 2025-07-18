# JobPilot: Technical Details

This document provides a technical overview of the AI Cover Letter Generator extension, including its architecture, technology stack, and file structure.

## Technology Stack

- **Platform**: Google Chrome Extension (Manifest V3)
- **Core Logic**: JavaScript (ES6+)
- **Frontend**: HTML5 & CSS3
- **AI Model**: Google Gemini Pro via the Generative Language API
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)
- **Chrome APIs**:
    - `storage`: For securely saving user settings and the API key.
    - `scripting`: To programmatically inject the content script into the active page.
    - `runtime`: For handling messaging between the popup, service worker, and other extension components.
    - `tabs`: To get information about the active tab (e.g., its URL and content).
    - `offscreen`: To create and manage an offscreen document for tasks requiring DOM access, such as PDF generation.

## Project Structure

The project follows a standard structure for a Manifest V3 Chrome extension.

```
cover-letter-ai/
├── icons/                # Extension icons (16x16, 48x48, 128x128)
├── lib/
│   └── jspdf.umd.min.js  # The jsPDF library for creating PDFs
├── docs/                 # Detailed documentation files
│   ├── FEATURES.md
│   ├── SETUP.md
│   └── TECHNICAL_DETAILS.md
├── manifest.json         # The extension's manifest file. It defines all components, permissions, and metadata.
├── background.js         # The service worker. It listens for events and handles all core logic, including API calls to Gemini.
├── content.js            # A content script injected into the active webpage to read its text content.
├── popup.html            # The HTML structure for the main popup UI.
├── popup.js              # The script that controls the popup's behavior, handles user input, and communicates with the background script.
├── popup.css             # Styles for the popup UI.
├── options.html          # The HTML for the settings page.
├── options.js            # The script for saving and loading settings from `chrome.storage`.
├── offscreen.html        # A minimal, hidden HTML page.
└── offscreen.js          # A script that runs in the offscreen document. It's used to trigger the jsPDF download, as service workers cannot directly interact with the DOM or file downloads.
```

## Architectural Flow

### Data Flow for Cover Letter Generation
1.  **User Action**: The user clicks the "Generate Letter" button in `popup.html`.
2.  **Popup Script (`popup.js`)**:
    - Sends a message to the `background.js` service worker to start the process.
    - Updates the popup UI to show a "loading" or "in-progress" state.
3.  **Content Script (`content.js`)**:
    - The `background.js` script injects `content.js` into the active tab.
    - `content.js` reads the `innerText` of the page's `<body>` element and sends it back to `background.js`.
4.  **Service Worker (`background.js`)**:
    - Receives the page content from `content.js`.
    - Retrieves the user's settings (name, experience, API key) from `chrome.storage`.
    - Constructs a detailed prompt for the Gemini API, combining the user's data with the job description.
    - Makes a `fetch` call to the Google Generative Language API.
5.  **API Response and PDF Generation**:
    - Upon receiving a successful response from the API, `background.js` now has the generated cover letter text.
    - Because a service worker cannot create a file download link, it passes the text to the **offscreen document** (`offscreen.html` and `offscreen.js`).
    - `offscreen.js` uses the `jsPDF` library to create a PDF from the text and triggers the browser's download functionality.
6.  **Feedback**: The service worker sends status updates back to the popup (`popup.js`) throughout this process to keep the user informed.
