// Vercel serverless function for YouTube transcript fetching
// This can be deployed to Vercel for free and handles CORS automatically

const { YoutubeTranscript } = require('youtube-transcript');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }
  
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
    
    res.json({
      success: true,
      transcript: fullTranscript,
      segments,
      title: `YouTube Video ${videoId}`,
      videoId,
      source: 'Vercel Serverless Function'
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
}
