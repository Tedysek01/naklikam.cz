# Firebase Admin Setup for Vercel

## Prerequisites
You need a Firebase Service Account Key to use Firebase Admin SDK on Vercel.

## Steps to Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (lovable-clone)
3. Click the gear icon ⚙️ → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Save the downloaded JSON file

## Setting up on Vercel

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add a new environment variable:
   - Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Value: Copy the ENTIRE content of the downloaded JSON file
   - Environment: Production (and Preview if needed)

4. Also add:
   - Name: `FIREBASE_PROJECT_ID`
   - Value: `lovable-clone` (or your project ID)
   - Environment: Production

## Alternative: Use Vercel KV or Database

Since we only need to update token counts, you could alternatively:
1. Use Vercel KV (Redis) for token tracking
2. Keep subscription data in Firebase (read-only)
3. Update only token usage in Vercel KV

This would avoid the Firebase Admin complexity.

## Testing Locally

For local development, save the service account JSON as `serviceAccountKey.json` and add to `.env`:

```
FIREBASE_SERVICE_ACCOUNT_KEY=$(cat serviceAccountKey.json)
```

**IMPORTANT**: Never commit the service account key to git!