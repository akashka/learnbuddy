# Tuition Platform – Mobile App

Placeholder for React Native / Expo mobile app. This is a **separate project** that connects to the backend API.

## Setup

```bash
npx create-expo-app@latest . --template blank-typescript
npm install
```

## Connect to Backend

Create `.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

For production, use your deployed backend URL (e.g. `https://api.yourdomain.com`).

## API Calls

All API calls should use the base URL:

```ts
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function api(path: string, options?: RequestInit) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  return res;
}
```

## Deploy

- **iOS:** Build with EAS and submit to App Store
- **Android:** Build with EAS and submit to Google Play

```bash
npm install -g eas-cli
eas build --platform all
```
