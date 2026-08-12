# React Firebase Real-Time Chat

A real-time one-to-one chat application built with React and Firebase.

## Features

- Email/password authentication
- User registration and login
- Real-time user list
- One-to-one real-time messages
- Online status field
- Last seen field
- Read receipts
- Responsive UI
- Profile editing
- Firestore security rules

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Firebase project.

3. Enable:
   - Authentication > Email/Password
   - Firestore Database

4. Copy `.env.example` to `.env` and add your Firebase web app values.

5. Start:

```bash
npm start
```

## Firestore

The app creates:

```text
users/{uid}
chats/{chatId}
chats/{chatId}/messages/{messageId}
```

## Security rules

Copy `firestore.rules` into the Firebase Firestore Rules editor and publish.

## Important

The sample UI stores `isOnline` and `lastSeen` in Firestore. For production-grade presence across browser crashes and multiple devices, use Firebase Realtime Database presence or a server-side presence service.

## Build

```bash
npm run build
```
