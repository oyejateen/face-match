# Face Match

A mobile application that uses facial recognition to find similar faces in your photo library. Built with React Native and Python for codeQuest

## Features

- 📸 Upload and compare faces
- 🔍 Find similar faces in your photo library
- 📱 Cross-platform mobile app (iOS & Android)
- 💾 Save matches as albums

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
