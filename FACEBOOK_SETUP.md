# Facebook API Setup Guide

## Step 1: Create Facebook Developer Account
1. Go to https://developers.facebook.com/
2. Click "Get Started" and create a developer account
3. Verify your account with phone/email

## Step 2: Create a Facebook App
1. Click "My Apps" → "Create App"
2. Choose "Business" or "Consumer" app type
3. Fill in app details:
   - App name: "Streamer Monitor"
   - App contact email: your email
   - Business account: (optional)

## Step 3: Add Graph API Product
1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Also add "Graph API Explorer" if needed

## Step 4: Generate Access Token
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app from the dropdown
3. Click "Generate Access Token"
4. Grant permissions (pages_read_engagement, pages_show_list)
5. Copy the long access token

## Step 5: Add to .env
```
FACEBOOK_ACCESS_TOKEN=your_long_token_here
```

## Step 6: Test the Token
The app will automatically test the token when checking live streams.