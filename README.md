# 🎅 Secret Santa App

A modern web application for organizing Secret Santa gift exchanges, built with Angular, Firebase, and Tailwind CSS.

## Features

- **Easy Event Creation**: Set up a Secret Santa event with customizable gift budget ranges
- **Participant Management**: Simple registration with secret word authentication
- **Smart Raffle Algorithm**: Automated gift assignment that ensures no one gets themselves
- **Admin Dashboard**: Control registration, run raffles, and manage participants
- **Mobile-First Design**: Beautiful, responsive UI with festive Christmas theme
- **Privacy Options**: Admins can choose whether to see the full assignment matrix
- **Password Recovery**: Built-in reset functionality for forgotten secret words
- **Preference Sharing**: Participants can add gift preferences and size information
- **Internationalization (i18n)**: Full support for English and Spanish (Mexican)

## Technology Stack

- **Frontend**: Angular 19 (Standalone Components)
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS v3
- **Forms**: Angular Reactive Forms
- **Routing**: Angular Router with Guards
- **i18n**: Angular Localization (English & Spanish)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- A Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jgu7man/secret-santa.git
   cd secret-santa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Follow the instructions in [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
   - Update `src/app/firebase-config.ts` with your Firebase credentials

4. Start the development server:
   ```bash
   # English version
   npm start
   
   # Spanish version
   npm run start:es
   ```

   Or alternatively:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:4200`

## Project Structure

```
src/app/
├── components/          # UI Components
│   ├── create-event/    # Event creation form
│   ├── admin-dashboard/ # Admin control panel
│   ├── event-landing/   # Participant registration/login
│   └── password-reset/  # Secret word reset
├── services/            # Business logic
│   ├── event.service.ts # Event CRUD & raffle
│   └── participant.service.ts # Participant management
├── models/              # TypeScript interfaces
├── guards/              # Route guards
├── firebase-config.ts   # Firebase configuration
└── locale/              # i18n translation files
```

## Internationalization

The app supports multiple languages. See [I18N.md](I18N.md) for detailed information.

- 🇺🇸 English (default)
- 🇲🇽 Spanish (Mexican)

To add translations or work with different languages, refer to the [i18n documentation](I18N.md).
```

## Usage

### For Event Organizers

1. Visit the home page and create a new event
2. Set the event name and gift budget range
3. Choose whether you want to see all assignments
4. Share the participant link with your group
5. Once everyone has registered, run the raffle
6. Participants can now see their assignments!

### For Participants

1. Click the event link shared by the organizer
2. Register with your name and a secret word (or login if already registered)
3. Add your gift preferences
4. After the raffle, see who you're gifting to and their preferences
5. Update your preferences anytime

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Deployment

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for instructions on deploying to Firebase Hosting.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.19.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
