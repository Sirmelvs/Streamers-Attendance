# Streamer Attendance Monitoring Database

A Node.js/React web application for tracking and monitoring streamer attendance with comprehensive statistics and reporting capabilities.

## Features

- **Streamer Management**: Add, update, and delete streamer profiles with platform and page link
- **Edit Streamer Info**: Quick edit modal to update streamer name, platform, and page link
- **Page Links**: Add and store links to streamer pages (Twitch, YouTube, Facebook, TikTok, personal websites, etc.)
- **Live Detection**: Automatic live detection for multiple streaming platforms:
  - **Twitch**: Requires Twitch API credentials (automatic)
  - **Facebook**: Requires Facebook Graph API token (automatic)
  - **TikTok**: Requires TikTok API credentials (automatic)- **Attendance Tracking**: Record and track streamer online/offline status with timestamps
- **Real-time Status**: Quick status toggle for marking streamers as online or offline
- **Statistics & Analytics**: View attendance statistics including:
  - Times online/offline
  - Active days count
  - Last online timestamp
- **Attendance Records**: View detailed attendance history for each streamer
- **Export to CSV**: Export attendance data for analysis and reporting
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Backend**: 
  - Node.js
  - Express.js
  - SQLite (better-sqlite3)
  - CORS for cross-origin requests
  - **Timezone**: GMT+8 (Asia/Singapore)

- **Frontend**:
  - React 18
  - Axios for API calls
  - CSS3 for styling

## Installation

### Prerequisites
- Node.js 14 or higher
- npm or yarn

### Setup

1. **Clone/Navigate to the project directory**
```bash
cd "Attendance Database"
```

2. **Install all dependencies**
```bash
npm run install-all
```

3. **Configure live monitoring (optional)**

Add API credentials to `.env` to enable automatic live detection:

```env
# Twitch (https://dev.twitch.tv/console/apps)
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Facebook (https://developers.facebook.com/)
FACEBOOK_ACCESS_TOKEN=your_facebook_token

# TikTok (https://developers.tiktok.com/)
TIKTOK_ACCESS_TOKEN=your_tiktok_token

# Polling interval (milliseconds, default: 60000)
LIVE_POLL_INTERVAL_MS=60000

# Enable/disable HTML scraping fallback for Facebook/TikTok when API tokens are unavailable
USE_SCRAPE_FALLBACK=true
```

**Demo Mode**: If you don't have API tokens, the system will use either scraping fallback or simulated demo behavior depending on configuration.

This enables the app to automatically check streaming status and record timestamped online/offline events.

This will install both server and client dependencies.

## Running the Application

### Development Mode (with live reload)
```bash
npm run dev
```

This will start both the Express server and React development server concurrently.

### Production Mode
```bash
npm run build
npm start
```

The application will be available at `http://localhost:5000`

## Project Structure

```
.
├── server/
│   ├── routes/
│   │   ├── streamers.js      # Streamer CRUD operations
│   │   └── attendance.js     # Attendance tracking endpoints
│   ├── db/
│   │   └── database.js       # SQLite database initialization
│   ├── middleware/           # Custom middleware (reserved)
│   └── server.js            # Express server configuration
├── client/
│   ├── public/
│   │   └── index.html       # HTML entry point
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddStreamer.js
│   │   │   ├── StreamerList.js
│   │   │   └── AttendanceRecords.js
│   │   ├── styles/
│   │   │   ├── AddStreamer.css
│   │   │   ├── StreamerList.css
│   │   │   └── AttendanceRecords.css
│   │   ├── App.js           # Main React app
│   │   ├── App.css
│   │   └── index.js         # React entry point
│   └── package.json
├── package.json             # Root dependencies
└── README.md               # This file
```

## API Endpoints

### Streamers
- `GET /api/streamers` - Get all streamers
- `GET /api/streamers/:id` - Get specific streamer
- `POST /api/streamers` - Create new streamer
- `PUT /api/streamers/:id` - Update streamer
- `DELETE /api/streamers/:id` - Delete streamer

### Attendance
- `GET /api/attendance` - Get all attendance records (with optional date filters)
- `GET /api/attendance/streamer/:streamerId` - Get attendance for specific streamer
- `GET /api/attendance/stats/:streamerId` - Get attendance statistics
- `POST /api/attendance` - Record new attendance

## Database Schema

### Streamers Table
```sql
CREATE TABLE streamers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  platform TEXT,
  page_link TEXT,
  status TEXT DEFAULT 'offline',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streamer_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (streamer_id) REFERENCES streamers(id)
)
```

## Usage

1. **Add a Streamer**
   - Enter the streamer's name, platform, and optional page link
   - Click "Add Streamer"

2. **Edit Streamer Info**
   - Click the "Edit" button on a streamer
   - Update any field (name, platform, page link)
   - Click "Save Changes"

3. **Visit Streamer Page**
   - Click the "🔗 Visit Page" link if one has been added
   - Opens the streamer's page in a new tab

4. **Record Attendance**
   - Select a streamer from the list
   - Click "Mark Online" or "Mark Offline" to record status changes

5. **View Statistics**
   - Select a streamer to see their attendance records
   - View summary statistics (times online/offline, active days)

6. **Export Data**
   - Select a streamer and click "Export to CSV"
   - CSV file will be downloaded with all attendance records

## Troubleshooting

**Port already in use:**
- Change the PORT in the .env file or modify server.js

**Database errors:**
- Ensure the server/db directory exists with write permissions
- Delete `attendance.db` to reset the database

**CORS errors:**
- Ensure both frontend and backend are running
- Check that the proxy in client/package.json matches the backend URL

## Future Enhancements

- Real-time stream monitoring integration (Twitch API)
- Advanced analytics and reporting
- User authentication and multi-user support
- Data visualizations and charts
- Scheduled monitoring
- Email notifications

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
