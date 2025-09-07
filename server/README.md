# YouTube Transcript Proxy Server

This is a simple Node.js server that acts as a proxy to fetch YouTube transcripts, bypassing CORS limitations that prevent client-side applications from directly accessing YouTube's transcript data.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:3001/api/youtube-transcript/dQw4w9WgXcQ
   ```

## API Endpoints

### `GET /health`
Health check endpoint to verify the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### `GET /api/youtube-transcript/:videoId`
Fetch transcript for a YouTube video.

**Parameters:**
- `videoId`: YouTube video ID (11 characters)

**Success Response:**
```json
{
  "success": true,
  "transcript": "Full transcript text...",
  "segments": [
    {
      "text": "Hello world",
      "start": 0.5,
      "duration": 2.1
    }
  ],
  "title": "Video Title",
  "videoId": "dQw4w9WgXcQ",
  "source": "Backend Proxy"
}
```

**Error Response:**
```json
{
  "error": "No transcript available for this video",
  "videoId": "dQw4w9WgXcQ",
  "details": "Detailed error message"
}
```

## Deployment Options

### Option 1: Local Development
Run locally during development:
```bash
npm start
```
The main app will try to connect to `http://localhost:3001`

### Option 2: Vercel Serverless (Recommended)
Deploy the serverless function to Vercel:

1. Copy the `api/` folder to your main project
2. Install the dependency in your main project:
   ```bash
   npm install youtube-transcript
   ```
3. Deploy to Vercel:
   ```bash
   vercel deploy
   ```

### Option 3: Traditional Server Hosting
Deploy to any Node.js hosting service (Heroku, Railway, DigitalOcean, etc.)

## Environment Variables

- `PORT`: Server port (default: 3001)

## Error Handling

The server handles various YouTube-specific errors:

- **Transcript disabled**: Video owner has disabled transcripts
- **No transcript found**: Video doesn't have captions/transcripts
- **Video unavailable**: Private, deleted, or restricted video
- **Network errors**: Connection issues with YouTube

## Rate Limiting

Consider implementing rate limiting in production to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

## CORS Configuration

The server is configured to allow all origins by default. In production, consider restricting to your domain:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost:3000']
}));
```
