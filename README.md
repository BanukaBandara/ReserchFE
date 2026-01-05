# Research-FE

Mobile app for detecting pineapple diseases using your phone's camera. Built with React Native and Expo.

## What's This About?

We built this app to help farmers spot pineapple diseases early. Just snap a photo of your plant, and the app analyzes it using machine learning to identify potential issues. You can also track multiple plants over time and share observations with the community.

### Main Features

- User login and registration
- Take photos of pineapples to detect diseases
- Keep track of your plants and their health history
- Community feed where users can share posts
- Get detailed results and recommendations when diseases are detected
- Personal profile to manage your account

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

## What We're Using

Here's all the tech that makes this work:

### The Basics

- React 19.1.0 - for building the UI
- React Native 0.81.5 - to make it work on mobile
- Expo ~54.0.30 - makes development way easier

### Navigation

We're using React Navigation to move around the app - stack navigation for the main flow and bottom tabs for the main sections.

### State & Data

- Redux Toolkit to manage app state
- AsyncStorage to save stuff locally on your phone
- Axios for talking to the backend API

### Camera & Media

- Expo Camera to take pictures
- Image Picker to grab photos from your gallery
- Optimized image components for better performance

### UI & Styling

We went with Tailwind CSS (through NativeWind) because it's fast to work with and keeps things consistent. Also using gradients and some nice visual touches.

### Charts

Added react-native-chart-kit and SVG support to show plant health trends over time.

### Other Helpful Stuff

- date-fns for handling dates
- Haptic feedback for better UX
- TypeScript for type safety (fewer bugs!)
- ESLint to keep code clean

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
