# JobPilot (AI Chrome Extension)

A Chrome extension that reads a job description from the active page, uses the Google Gemini API to generate a tailored cover letter based on your personal information, and saves it as a PDF.

![alt text](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)
![alt text](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![alt text](https://img.shields.io/badge/PDF-jsPDF-red.svg)

## Core Features
- **AI Cover Letter Generation**: Creates a tailored cover letter from a job description and downloads it as a PDF.
- **"Rate My Fit" Analysis**: Analyzes how your profile matches a job and provides a rating with pros and cons.
- **In-Page Apply Assistant**: Generates concise, AI-powered answers for common application form questions and helps draft emails for spontaneous applications.
- **Context-Aware & Personalized**: Reads the job page context and uses your stored personal info for generation.
- **Real-time Feedback**: Displays live status updates during the generation process.

## Documentation

For detailed information, please refer to the documentation directory:

- **[Features Overview](./docs/FEATURES.md)**: A detailed look at what the extension can do.
- **[Installation and Usage Guide](./docs/SETUP.md)**: Step-by-step instructions on how to install, configure, and use the extension.
- **[Technical Details](./docs/TECHNICAL_DETAILS.md)**: An overview of the project's architecture, technology stack, and development guidelines.

## Technology Stack
- **Platform**: Google Chrome Extension (Manifest V3)
- **Core Logic**: JavaScript (ES6+)
- **AI Model**: Google Gemini Pro
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)

## License
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
