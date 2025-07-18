# JobPilot: Installation and Usage Guide

This guide provides step-by-step instructions for installing, configuring, and using the AI Cover Letter Generator extension.

## Prerequisites
- You must have **Google Chrome** installed on your computer.

## 1. Installation

### Step 1: Get the Extension Files
You can either download the project as a ZIP file or clone it using Git.

```bash
# Clone the repository to your local machine
git clone https://github.com/AABelkhiria/ai-cover-letter-generator.git
```
If you download a ZIP, be sure to unzip it into a dedicated folder.

### Step 2: Get Your Gemini API Key
The extension requires a Google Gemini API key to function.

1. Go to **[Google AI Studio](https://aistudio.google.com)**.
2. Sign in with your Google account.
3. Click the **"Get API key"** button.
4. Select **"Create API key in new project"**.
5. Copy the generated key. **Keep this key private and secure.**

### Step 3: Load the Extension in Chrome
1. Open Google Chrome and navigate to the extensions page by typing `chrome://extensions` in the address bar.
2. In the top-right corner, enable **"Developer mode"**.
3. Click the **"Load unpacked"** button that appears on the left.
4. In the file selection dialog, navigate to and select the `cover-letter-ai` folder you created in Step 1.

The extension should now appear in your list of installed extensions and in your Chrome toolbar.

## 2. Configuration

Before you can use the extension, you must add your API key and personal details.

1. Find the extension's icon in your Chrome toolbar. You may need to click the puzzle piece icon to see it.
2. **Right-click** the icon and select **"Options"**.
3. This will open the **Settings** page. Fill out the following fields:
    - **Gemini API Key**: Paste the key you got from Google AI Studio.
    - **Your Name**: Your full name.
    - **Your Email**: Your contact email.
    - **Your Phone**: Your contact phone number.
    - **Your Website/Portfolio**: A link to your personal site or portfolio (optional).
    - **My Experience**: A brief summary of your skills, experience, and career goals. This is the most important part for generating a relevant cover letter. Be descriptive!
4. Click **"Save Settings"**. Your information is now saved securely in the browser.

## 3. How to Use

Once configured, using the extension is simple.

1. **Navigate to a job description page.** This can be on any site, like LinkedIn, Indeed, or a company's own careers page.
2. **Click the extension's icon** in the toolbar to open the popup.
3. **Choose an action**:
    - **Generate Letter**: Reads the page and generates a full cover letter tailored to the job. The letter will be downloaded automatically as a PDF.
    - **Rate Job**: Analyzes how your experience summary matches the job description and gives you a simple rating with pros and cons.
    - **In-Page Apply**: Helps you fill out application forms. Click "Express Interest" to get a concise, AI-generated answer for fields like "Tell us about yourself." Click the generated text to copy it.

## Troubleshooting

- **Error Message in Popup**: If you see an error, the most common cause is an invalid or missing API key. Re-open the **Options** page and ensure your key is pasted correctly.
- **Extension Doesn't Respond**: Try refreshing the job description page and reopening the popup.
- **PDF Not Downloading**: Ensure you have granted the extension any necessary permissions. Check the `chrome://downloads` page for any errors.
