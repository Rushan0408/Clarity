# Clarity

Clarity is a browser extension designed to help you stay focused by blurring distracting (non-educational) content on the web. Using an embedded machine learning model (logistic regression), Clarity automatically distinguishes educational content from non-educational content and applies a blur effect to anything deemed distracting.

## Features
- **Automatic Detection**: Uses a logistic regression model to identify educational vs. non-educational content.
- **Blurring**: Distracting (non-educational) content is blurred to minimize distractions.
- **Customizable**: Add extra keywords for personalized educational content detection.
- **Works on YouTube**: Currently supports blurring on YouTube, with more sites planned.

## Technology Stack
- **Language**: JavaScript (ES6)
- **Browser API**: Chrome Extensions API (Manifest V3)
- **Machine Learning**: Logistic Regression (model parameters stored as JSON, inference in JS)
- **Frontend**: HTML, CSS

## File Structure
- `manifest.json`: Extension manifest (permissions, scripts, etc.)
- `background.js`: Handles background messaging and settings sync
- `content.js`: Main logic for content detection and blurring
- `popup.html`, `popup.js`, `styles.css`: Popup UI for user settings
- `json/model_params.json`, `json/vocab.json`: ML model parameters and vocabulary

## How It Works
1. The extension loads a logistic regression model (parameters and vocabulary) in the browser.
2. When you visit a supported site (e.g., YouTube), it analyzes video titles using the ML model.
3. If the model predicts non-educational content, the video is blurred.
4. You can adjust settings and add extra keywords via the popup.

## Installation & Setup

### 1. Download or Clone the Repository
```
git clone <repo-url>
```
Or download and extract the ZIP.

### 2. Load the Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `Clarity` folder (the one containing `manifest.json`)

### 3. Usage
- Visit YouTube and browse videos. Non-educational videos will be blurred.
- Click the Clarity extension icon to adjust settings or add keywords.

## Technologies Used
- JavaScript (ES6)
- Chrome Extensions API (Manifest V3)
- HTML, CSS
- Logistic Regression (inference in-browser)

## Contributing
Pull requests and suggestions are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
