# JobPilot Features

This document provides a detailed breakdown of the features available in the AI Cover Letter Generator Chrome Extension.

## Core User Features

### 1. AI-Powered Cover Letter Generation
The primary feature of the extension is its ability to generate a high-quality, tailored cover letter with a single click.

- **How it Works**: The extension reads the text content and URL from the active job posting page. It sends this information, along with your personal details (name, experience summary, etc.) stored in the settings, to the Google Gemini API.
- **Output**: The generated cover letter is automatically formatted and downloaded as a professional-looking PDF file, ready to be attached to your application. This is handled by the `jsPDF` library.
- **Process**: The popup UI provides real-time status updates, so you know exactly what's happening—from reading the page to generating the text and creating the PDF.

### 2. "Rate My Fit" Job Analysis
This feature helps you quickly assess whether a job is a good match for your profile before you decide to apply.

- **How it Works**: By clicking the "Rate Job" button, the extension analyzes the job description against the "My Experience" summary you provided in the settings.
- **Output**: It returns a simple rating and a concise list of "Pros" and "Cons," giving you a quick overview of how well your skills align with the employer's requirements.

### 3. In-Page Apply Assistant
This feature is designed to speed up the process of filling out online application forms.

- **How it Works**: When you click the "In-Page Apply" button, the UI presents an "Express Interest" option. This sends a request to the AI to generate a short, positive statement of interest based on the job description.
- **One-Click Copy**: The generated text appears directly in the popup. You can click the text to instantly copy it to your clipboard, making it easy to paste into application form fields like "Why are you interested in this role?".

## Technical Features

- **Context-Aware**: The extension is aware of the content on your current tab and uses it as the primary context for its actions.
- **Secure Storage**: Your personal information and API key are stored securely using the `chrome.storage` API.
- **Modern Architecture**: Built on Manifest V3, ensuring it meets the latest standards for Chrome extension security and performance.
- **Offscreen Processing**: Utilizes the `chrome.offscreen` API to handle file downloads from the service worker, which is a requirement in Manifest V3.
