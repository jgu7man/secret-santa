# 🎅 Secret Santa App

A modern, open-source web application for organizing Secret Santa gift exchanges. Built with Angular 19, Firebase Firestore, and Tailwind CSS.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-19-red.svg)](https://angular.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange.svg)](https://firebase.google.com/)

## ✨ Features

- 🎁 **Easy Event Creation**: Set up gift exchanges with customizable budget ranges and registration deadlines
- 👥 **Simple Participant Management**: No email required - just a name and secret word
- 🎲 **Smart Raffle Algorithm**: Automated, fair gift assignment (no one gets themselves!)
- 📊 **Admin Dashboard**: Control registration, run raffles, edit events, and manage participants
- 📱 **Mobile-First Design**: Beautiful, responsive UI with festive Christmas theme
- 🔒 **Privacy Controls**: Optional assignment visibility for organizers
- 🔄 **Password Recovery**: Built-in reset functionality for forgotten secret words
- 💝 **Gift Preferences**: Participants can share interests, sizes, and preferences
- 🌍 **Internationalization**: Full support for English and Spanish (easily extensible)
- ⚡ **Real-time Updates**: Live participant count and event status
- 🎯 **Event Editing**: Modify event details even after creation

## 🚀 Technology Stack

- **Frontend**: Angular 19 (Standalone Components)
- **Backend**: Firebase Firestore
- **Styling**: Tailwind CSS v3
- **Forms**: Angular Reactive Forms
- **Authentication**: Token-based admin access + secret word participant login
- **Routing**: Angular Router with Guards
- **i18n**: Angular Localization (@angular/localize)

## 📸 Screenshots

*Add screenshots of your app here*

## 🎯 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Firebase account (free tier works great)
- Basic knowledge of Angular and Firebase

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/secret-santa.git
   cd secret-santa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   
   Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
   
   - Enable Firestore Database
   - Enable Firebase Hosting (optional)
   - Copy your Firebase config
   
   Update `src/app/firebase-config.ts`:
   ```typescript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Deploy Firestore Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Start the development server**
   ```bash
   # English version
   npm start
   
   # Spanish version
   npm run start:es
   ```

6. **Open your browser** at `http://localhost:4200`

## 📁 Project Structure

```
src/app/
├── components/
│   ├── create-event/           # Event creation form
│   ├── admin-dashboard/        # Admin control panel with edit capabilities
│   ├── event-landing/          # Participant registration/login
│   ├── host-dashboard/         # Host's event management
│   ├── event-admin-login/      # Admin authentication
│   └── password-reset/         # Secret word recovery
├── services/
│   ├── event.service.ts        # Event CRUD, raffle algorithm
│   └── participant.service.ts  # Participant management
├── models/
│   ├── event.model.ts          # Event interfaces
│   └── participant.model.ts    # Participant interfaces
├── guards/
│   └── admin.guard.ts          # Route protection
├── pipes/
│   └── event-status.pipe.ts    # Status display formatting
└── locale/                     # i18n translation files
    ├── messages.xlf            # English (source)
    └── messages.es-MX.xlf      # Spanish (Mexico)
```

## 🌍 Internationalization

The app is fully internationalized using Angular's built-in i18n system:

- 🇺🇸 **English** (default)
- 🇲🇽 **Spanish** (Mexican)

### Development with Different Locales

```bash
# English
npm start

# Spanish
npm run start:es
```

### Building All Locales

```bash
npm run build  # Builds all configured locales
```

Each locale is compiled into a separate bundle for optimal performance. Learn more in [I18N.md](I18N.md).

## 📖 Usage Guide

### 🎯 For Event Organizers

1. **Create an Event**
   - Visit the home page and click "Create Event"
   - Set event name, budget range, and optional registration deadline
   - Choose whether you want to see all assignments
   - Save your admin link (it's your only way to manage the event!)

2. **Manage Your Event**
   - Share the participant link with your group
   - Monitor registrations in real-time
   - Close registration when ready or wait for the deadline
   - Edit event details if needed

3. **Run the Raffle**
   - Click "Run Raffle" when everyone has registered
   - The algorithm ensures fair, random assignments (no self-matches)
   - You can re-run the raffle if needed

4. **Manage Participants**
   - View all participants and their preferences
   - Generate password reset links for users who forget their secret word
   - Delete the event when the exchange is complete

### 👥 For Participants

1. **Join the Event**
   - Click the event link shared by the organizer
   - Register with your name and a secret word
   - Optionally add your email and gift preferences

2. **Update Your Preferences**
   - Add interests, hobbies, and size information
   - Edit anytime before or after the raffle

3. **See Your Assignment**
   - After the raffle, you'll see who you're gifting to
   - View their preferences to pick the perfect gift
   - Keep the assignment secret!

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start dev server (English)
npm run start:es   # Start dev server (Spanish)
npm run build      # Build for production (all locales)
npm run build:es   # Build Spanish version only
npm test           # Run unit tests
npm run watch      # Build in watch mode
```

### Code Scaffolding

```bash
ng generate component component-name
ng generate service service-name
ng generate guard guard-name
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Artifacts are generated in `dist/secret-santa/browser/`:
- `en-US/` - English version
- `es-MX/` - Spanish version

### Deploy to Firebase Hosting

1. **Configure Firebase Hosting**
   ```bash
   firebase init hosting
   ```

2. **Update `firebase.json`** to support multi-site or single locale:
   ```json
   {
     "hosting": {
       "public": "dist/secret-santa/browser/en-US",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

3. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

For multi-language hosting, see [Firebase Hosting Multi-Site documentation](https://firebase.google.com/docs/hosting/multisites).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Angular](https://angular.io/)
- Powered by [Firebase](https://firebase.google.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📚 Documentation

- [Firebase Setup Guide](FIREBASE_SETUP.md) - Detailed Firebase configuration
- [Internationalization Guide](I18N.md) - Adding new languages
- [Firestore Security Rules](firestore.rules) - Database security configuration

## 🐛 Known Issues & Roadmap

See [Issues](https://github.com/yourusername/secret-santa/issues) for a list of known issues and planned features.

## 💬 Support

If you have questions or need help, please:
- Check the [documentation](FIREBASE_SETUP.md)
- Open an [issue](https://github.com/yourusername/secret-santa/issues)
- Review existing issues for similar problems

---

**Made with ❤️ for the holiday season**
