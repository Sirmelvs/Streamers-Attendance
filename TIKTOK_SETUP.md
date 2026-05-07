# TikTok API Setup Guide

## Step 1: Create TikTok Developer Account
1. Go to https://developers.tiktok.com/
2. Click "Get Started" or "Sign Up"
3. Create account with email/phone verification

## Step 2: Create a TikTok App
1. In TikTok Developer Portal, click "Create App"
2. Choose app type: "Research API" or "Commercial API"
3. Fill in app details:
   - App name: "Streamer Monitor"
   - Description: "Monitor streamer live status"
   - Category: "Social Media" or "Analytics"

## Step 3: Configure App Settings
1. Set redirect URIs (can use http://localhost for testing)
2. Add required scopes:
   - user.info.basic
   - video.list
   - research.live_video

## Step 4: Generate Access Token
1. In app settings, go to "Authentication"
2. Generate "Client Access Token" or "Authorization Code"
3. For live video access, you may need Research API approval

## Step 5: Add to .env
```
TIKTOK_ACCESS_TOKEN=your_tiktok_token_here
```

## Step 6: Test the Token
The app will automatically test the token when checking live streams.

## Note: TikTok API Limitations
- TikTok's live detection API is limited
- May require Research API approval for full access
- Some features might need additional permissions