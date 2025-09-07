// YouTube transcript fetching service
// Multiple reliable strategies for transcript extraction

export interface TranscriptSegment {
  text: string;
  start: number;
  duration?: number;
}

export interface TranscriptResult {
  transcript: string;
  segments?: TranscriptSegment[];
  videoTitle?: string;
  videoId: string;
  source: string;
}

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Uses Supadata API - reliable transcript service with API key
 */
async function fetchTranscriptViaSupadata(url: string): Promise<TranscriptResult> {
  try {
    const apiUrl = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': 'sd_4122153ea32154319546ea481404787b',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supadata API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Debug logging
    console.log('Supadata API response structure:', Object.keys(data));
    console.log('Content array length:', data.content?.length || 'No content array');
    
    // Check for the actual Supadata response format
    if (!data.content || !Array.isArray(data.content)) {
      throw new Error('No transcript content received from Supadata API');
    }
    
    // Extract video ID for consistency
    const videoId = extractVideoId(url) || 'unknown';
    
    // Convert Supadata format to our format
    const segments: TranscriptSegment[] = data.content.map((item: any) => ({
      text: item.text || '',
      start: item.offset ? item.offset / 1000 : 0, // Convert milliseconds to seconds
      duration: item.duration ? item.duration / 1000 : undefined // Convert milliseconds to seconds
    }));
    
    // Create full transcript text
    const transcript = segments.map(seg => seg.text).join(' ');
    
    if (!transcript.trim()) {
      throw new Error('Empty transcript received from Supadata API');
    }
    
    return {
      transcript,
      segments,
      videoTitle: `YouTube Video ${videoId}`, // Supadata doesn't seem to return title in this format
      videoId,
      source: 'Supadata API'
    };
    
  } catch (error) {
    throw new Error(`Supadata API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Uses a different API service as backup
 */
async function fetchTranscriptViaAlternativeAPI(videoId: string): Promise<TranscriptResult> {
  try {
    // Try another service - this is a hypothetical backup API
    const apiUrl = `https://api.youtubetranscript.com/v1/transcript?video_id=${videoId}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Alternative API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.transcript) {
      throw new Error('No transcript data received from alternative API');
    }
    
    return {
      transcript: data.transcript,
      segments: data.segments || [],
      videoTitle: data.title,
      videoId,
      source: 'Alternative API'
    };
    
  } catch (error) {
    throw new Error(`Alternative API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Uses a simple Node.js proxy approach (requires backend)
 */
async function fetchTranscriptViaBackendProxy(videoId: string): Promise<TranscriptResult> {
  try {
    // This would require a simple backend endpoint
    const response = await fetch(`/api/youtube-transcript/${videoId}`);
    
    if (!response.ok) {
      throw new Error(`Backend proxy error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      transcript: data.transcript,
      segments: data.segments || [],
      videoTitle: data.title,
      videoId,
      source: 'Backend Proxy'
    };
    
  } catch (error) {
    throw new Error(`Backend proxy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main function to fetch transcript from YouTube URL
 * Uses Supadata API as primary method with fallbacks
 */
export async function fetchYouTubeTranscript(url: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL. Please provide a valid YouTube video link.');
  }
  
  const errors: string[] = [];
  
  // Method 1: Try Supadata API (most reliable with API key)
  try {
    console.log('Trying Supadata API...');
    return await fetchTranscriptViaSupadata(url);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Supadata API: ${errorMsg}`);
    console.warn('Supadata API failed:', errorMsg);
  }
  
  // Method 2: Try backend proxy (if available)
  try {
    console.log('Trying backend proxy...');
    return await fetchTranscriptViaBackendProxy(videoId);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Backend proxy: ${errorMsg}`);
    console.warn('Backend proxy failed:', errorMsg);
  }
  
  // Method 3: Try alternative API (if available)
  try {
    console.log('Trying alternative API...');
    return await fetchTranscriptViaAlternativeAPI(videoId);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Alternative API: ${errorMsg}`);
    console.warn('Alternative API failed:', errorMsg);
  }
  
  // If all methods fail, provide helpful error message
  throw new Error(
    `Unable to fetch transcript automatically. This could be because:\n\n` +
    `• The video doesn't have captions/transcripts available\n` +
    `• The video is private or restricted\n` +
    `• The video is age-restricted or has limited access\n` +
    `• All transcript services are temporarily unavailable\n\n` +
    `Please try manually copying the transcript from YouTube:\n` +
    `1. Go to the video: https://youtube.com/watch?v=${videoId}\n` +
    `2. Click the "..." menu below the video\n` +
    `3. Select "Show transcript"\n` +
    `4. Copy and paste the text into the manual transcript field\n\n` +
    `You can also try these online tools:\n` +
    `• Supadata: https://supadata.ai\n` +
    `• YouTube Transcript: https://youtubetranscript.com\n\n` +
    `Technical details: ${errors.join('; ')}`
  );
}

/**
 * Validates if a URL looks like a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/,
    /^[a-zA-Z0-9_-]{11}$/ // Direct video ID
  ];
  
  return patterns.some(pattern => pattern.test(url));
}
