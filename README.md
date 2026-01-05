# Research-FE

Mobile app for detecting pineapple diseases using your phone's camera. Built with React Native and Expo.

## 📋 Project Overview

This mobile application helps farmers and agricultural professionals identify pineapple diseases early through image-based machine learning detection. The app provides:

- **Disease Detection**: Snap a photo and get instant AI-powered disease identification
- **Plant Tracking**: Monitor multiple plants and track their health over time
- **Community Features**: Share observations and learn from other users
- **Historical Data**: View plant health trends with visual charts
- **Personalized Recommendations**: Get actionable advice based on detection results

**Target Users**: Farmers, agricultural students, and farming communities

**Platform**: iOS and Android (via React Native/Expo)

## 🏗️ Architecture Diagram

Here's the basic flow of the app:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile Application                        │
│                      (React Native + Expo)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌─────────┐    ┌──────────┐
    │ UI/UX  │     │  State  │    │ Services │
    │ Layer  │     │  Mgmt   │    │  Layer   │
    └────────┘     └─────────┘    └──────────┘
         │               │               │
    ┌────┴───┐     ┌────┴────┐     ┌────┴────┐
    │ Screens│     │  Redux  │     │   API   │
    │Components    │  Store  │     │ Service │
    └────────┘     └─────────┘     └──────────┘
                         │               │
                         │               │
                    ┌────┴───────────────┴────┐
                    │   Redux Slices           │
                    ├──────────────────────────┤
                    │ • authSlice             │
                    │ • detectionSlice        │
                    │ • itemsSlice            │
                    │ • plantSlice            │
                    └──────────────────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │    Backend API         │
                    │  (REST API Endpoints)  │
                    └────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────┐        ┌─────────────┐
            │   Database   │        │  ML Model   │
            │   Server     │        │   Service   │
            └──────────────┘        └─────────────┘
```

## 📦 Project Dependencies

### Core Framework

```json
{
  "react": "19.1.0",
  "react-native": "0.81.5",
  "expo": "~54.0.30"
}
```

### Navigation & State Management

- `@react-navigation/native` - App navigation
- `@react-navigation/stack` - Stack-based navigation
- `@react-navigation/bottom-tabs` - Bottom tab navigation
- `@reduxjs/toolkit` - State management
- `react-redux` - Redux bindings for React
- `@react-native-async-storage/async-storage` - Local data persistence

### API & Networking

- `axios` - HTTP client for API requests

### Camera & Media

- `expo-camera` - Camera access
- `expo-image-picker` - Photo gallery access
- `expo-image` - Optimized image component

### UI & Styling

- `nativewind` - Tailwind CSS for React Native
- `tailwindcss` - Utility-first CSS framework
- `expo-linear-gradient` - Gradient components

### Data Visualization

- `react-native-chart-kit` - Chart components
- `react-native-svg` - SVG support for charts

### Utilities

- `date-fns` - Date formatting and manipulation
- `expo-haptics` - Haptic feedback
- `typescript` - Type safety
- `eslint` - Code linting

### Development Tools

- `@babel/core` - JavaScript compiler
- `@types/react` - TypeScript types for React

For complete dependency list with versions, see `package.json`.

## How It Works

Here's the basic flow of the app:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile Application                        │
│                      (React Native + Expo)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌─────────┐    ┌──────────┐
    │ UI/UX  │     │  State  │    │ Services │
    │ Layer  │     │  Mgmt   │    │  Layer   │
    └────────┘     └─────────┘    └──────────┘
         │               │               │
    ┌────┴───┐     ┌────┴────┐     ┌────┴────┐
    │ Screens│     │  Redux  │     │   API   │
    │Components    │  Store  │     │ Service │
    └────────┘     └─────────┘     └──────────┘
                         │               │
                         │               │
                    ┌────┴───────────────┴────┐
                    │   Redux Slices           │
                    ├──────────────────────────┤
                    │ • authSlice             │
                    │ • detectionSlice        │
                    │ • itemsSlice            │
                    │ • plantSlice            │
                    └──────────────────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │    Backend API         │
                    │  (REST API Endpoints)  │
                    └────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────┐        ┌─────────────┐
            │   Database   │        │  ML Model   │
            │   Server     │        │   Service   │
            └──────────────┘        └─────────────┘
```

### Tech Stack Breakdown

**Frontend**

- React Native screens for all the UI (login, camera, tracking, etc.)
- Reusable components like PostCard and DetectionResults
- React Navigation for moving between screens

**State Management**

- Redux Toolkit keeps everything organized
- Separate slices for auth, detection results, plant data, and general stuff
- AsyncStorage to save data locally on the device

**Services**

- Axios handles all API calls to the backend
- Expo Camera and Image Picker for photos
- Chart components to visualize plant health trends

## Getting Started

Want to run this locally? Here's what you need:

**Requirements:**

- Node.js (v16 or newer)
- npm or yarn
- Expo CLI
- An iOS/Android emulator or your actual phone

**Setup:**

1. Grab the code

```bash
git clone <repository-url>
cd Research-FE
```

2. Install everything

```bash
npm install
```

3. Fire it up

```bash
npm start
```

4. Choose your platform

```bash
npm run android  # Android
npm run ios      # iOS
npm run web      # Web browser
```

## App Screens

- **Splash** - Quick loading screen when you open the app
- **SignIn/SignUp** - Create account or log in
- **Home** - Your main feed with community posts
- **PineappleDetection** - Camera screen to scan plants
- **PlantTracker** - See all your tracked plants
- **DetectionResults** - Detailed info about detected diseases
- **Profile** - Your account settings

## Project Structure

```
Research-FE/
├── app/           # Main app entry
├── components/    # All our reusable components
├── services/      # API calls and external services
├── store/         # Redux state management
│   └── slices/    # Different parts of the state
├── types/         # TypeScript types
├── constants/     # Things like color themes
├── hooks/         # Custom React hooks
├── assets/        # Images, fonts, etc.
└── environment/   # Config for different environments
```

## Team & Collaboration

Check out the git history to see who worked on what. We tried to keep commits clean and use proper branching for new features.

## License

Private project for research purposes.
