# Firebase Setup Guide

## Prerequisites
- A Google/Firebase account
- Node.js and npm installed

## Steps to Configure Firebase

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Give your project a name (e.g., "secret-santa-app")

### 2. Enable Firestore Database
1. In the Firebase Console, go to "Build" > "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development (change rules for production later)
4. Select a location closest to your users

### 3. Register Your Web App
1. In the Firebase Console, click the web icon (</>) to add a web app
2. Give your app a nickname (e.g., "Secret Santa Web")
3. Check "Also set up Firebase Hosting" if you want to deploy
4. Click "Register app"

### 4. Get Your Firebase Configuration
After registering your app, you'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 5. Update the Application Configuration
1. Open `src/app/firebase-config.ts`
2. Replace the placeholder values with your actual Firebase configuration
3. Save the file

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
```

## Firestore Security Rules (Production)

For production, update your Firestore security rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events are readable by anyone with the event ID
    match /events/{eventId} {
      allow read: if true;
      allow create: if true;
      allow update: if request.auth != null || 
                    (request.resource.data.diff(resource.data).affectedKeys()
                    .hasOnly(['status', 'isRegistrationOpen']));
      
      // Participants sub-collection
      match /participants/{participantId} {
        allow read: if true;
        allow create: if get(/databases/$(database)/documents/events/$(eventId)).data.isRegistrationOpen == true;
        allow update: if true;
      }
    }
  }
}
```

## Firebase Hosting (Optional)

To deploy your app to Firebase Hosting:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init hosting
   ```
   - Choose your Firebase project
   - Set the public directory to `dist/secret-santa`
   - Configure as a single-page app: Yes
   - Don't overwrite index.html: No

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

Your app will be available at: `https://your-project-id.web.app`

## Testing Locally

Before deploying, test your app locally:

```bash
npm start
```

Visit `http://localhost:4200` in your browser.

## Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Firebase Connection Issues
- Verify your Firebase configuration is correct
- Check that Firestore is enabled in your Firebase project
- Ensure your Firestore security rules allow the operations you're performing

### CORS Issues
- If testing locally with Firebase, you may need to configure CORS settings
- Consider using Firebase emulators for local development

## Support

For more information, visit:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Angular Documentation](https://angular.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
