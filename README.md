# Face Match

## Problem Statement
A mobile-first application that compares faces across two or more images using AI-powered facial recognition. Built for the **CodeQuest AI & Computer Vision Contest** organized by the **District Administration, Bhilwara**.

## 👥 Team Name & Members
**Team FaceVision**  
- Jatin Narayan  
- Ankit Sharma  
- Aditya Maheshwari  
- Nitesh Verma


## Features

- 📸 Upload and compare faces
- 🔍 Find similar faces in your photo library
- 📱 Cross-platform mobile app (iOS & Android)
- 💾 Save matches as albums

## Demo
[Take me to the Demo](https://drive.google.com/file/d/1jF0WLPULUx-uA2nCIcpD60qtYaySQt9L/view?usp=drivesdk)


https://github.com/user-attachments/assets/018894cf-0df2-488c-bf23-045b7e2d2689


## Tech Stack

### Client (React Native)
- Expo
- React Native
- TypeScript
- AsyncStorage for local data persistence
- Expo Image Picker
- React Navigation

### Server (Python)
- FastAPI
- DeepFace for facial recognition
- Python 3.8+
- Uvicorn
- Pillow for image processing

## Project Structure

```
face-match/
├── face-match-client/     # React Native mobile app
│   ├── app/              # Main application code
│   ├── assets/           # Images and fonts
│   ├── components/       # Reusable components
│   └── utils/            # Utility functions
│
└── face-match-server/    # Python backend
    ├── app/              # Main application code
    ├── models/           # Data models
    └── utils/            # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 14+
- Python 3.8+
- Expo CLI
- iOS Simulator (for Mac) or Android Studio

### Client Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

### Server Setup

1. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
