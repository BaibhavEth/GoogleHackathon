// Simple Node.js server to proxy YouTube transcript requests
// This bypasses CORS issues by running server-side

const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// YouTube transcript endpoint
app.get('/api/youtube-transcript/:videoId', async (req, res) => {
  const { videoId } = req.params;
  
  try {
    console.log(`Fetching transcript for video: ${videoId}`);
    
    // Fetch transcript using youtube-transcript library
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return res.status(404).json({
        error: 'No transcript found for this video',
        videoId
      });
    }
    
    // Convert to our format
    const segments = transcript.map(item => ({
      text: item.text,
      start: item.offset / 1000, // Convert ms to seconds
      duration: item.duration / 1000
    }));
    
    const fullTranscript = segments.map(seg => seg.text).join(' ');
    
    // Try to get video title (optional)
    let videoTitle = null;
    try {
      // This would require additional API call or scraping
      // For now, we'll skip the title
      videoTitle = `YouTube Video ${videoId}`;
    } catch (titleError) {
      console.warn('Could not fetch video title:', titleError.message);
    }
    
    res.json({
      success: true,
      transcript: fullTranscript,
      segments,
      title: videoTitle,
      videoId,
      source: 'Backend Proxy'
    });
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    
    let errorMessage = 'Failed to fetch transcript';
    let statusCode = 500;
    
    if (error.message.includes('Transcript is disabled')) {
      errorMessage = 'Transcript is disabled for this video';
      statusCode = 404;
    } else if (error.message.includes('No transcript found')) {
      errorMessage = 'No transcript available for this video';
      statusCode = 404;
    } else if (error.message.includes('Video unavailable')) {
      errorMessage = 'Video is unavailable or private';
      statusCode = 404;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      videoId,
      details: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`YouTube Transcript Proxy Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API endpoint: http://localhost:${port}/api/youtube-transcript/{videoId}`);
});

module.exports = app;
