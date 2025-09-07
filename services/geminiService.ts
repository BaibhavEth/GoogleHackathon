import { GoogleGenAI, Type } from "@google/genai";
import { VisualNoteSection } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const visualNotesSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'A clear and concise title for this section of the notes.',
      },
      summary: {
        type: Type.STRING,
        description: 'A brief summary of the topic discussed in this section.',
      },
      keyPoints: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: 'A list of the most important bullet points or takeaways.',
      },
      visual: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "Type of visual, e.g., 'diagram', 'scribble', 'icon', 'mindmap', 'flowchart', 'quote'.",
          },
          description: {
            type: Type.STRING,
            description: 'A detailed description of a simple visual element (like a diagram or icon) that could be sketched to illustrate the point. For example: "A simple flowchart with three boxes: \'Input\' -> \'Process\' -> \'Output\'".',
          },
        },
        required: ['type', 'description'],
      },
    },
    required: ['title', 'summary', 'keyPoints', 'visual'],
  },
};


export async function generateVisualNotes(transcript: string): Promise<VisualNoteSection[]> {
  const prompt = `
You are an expert visual note-taker specializing in transforming dense information into clear, engaging, and memorable visual summaries. Your task is to process the following YouTube video transcript and generate a structured set of visual notes.

For each distinct topic or key concept in the transcript, create a note section. Each section must include:
1.  A clear and concise **title**.
2.  A brief **summary** of the topic.
3.  A list of the most important **key points** or takeaways, formatted as a list.
4.  A description of a **visual element** that could be sketched alongside the text. This visual should be simple and conceptual. Think in terms of icons, simple diagrams (flowcharts, Venn diagrams), mind maps, or symbolic scribbles. Describe what to draw, not the drawing itself.

Your entire output MUST be a JSON object that strictly adheres to the provided schema. Do not add any extra text or explanations outside of the JSON structure.

Here is the transcript:
---
${transcript}
---
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: visualNotesSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    // Basic validation
    if (!Array.isArray(parsedJson)) {
        throw new Error("API did not return a valid array for visual notes.");
    }
    
    return parsedJson as VisualNoteSection[];
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate visual notes from the API.");
  }
}

export async function generateImageFromDescription(prompt: string): Promise<string> {
  const enhancedPrompt = `A clear, simple, vector-style diagram or icon on a clean white background, representing the concept: "${prompt}". The style should be suitable for visual note-taking, like a sketch or a whiteboard drawing.`;

  // Try fal.ai's Gemini 2.5 Flash Image first (no rate limits!)
  if (process.env.FAL_API_KEY && process.env.FAL_API_KEY !== 'your_fal_api_key_here') {
    try {
      console.log('Using fal.ai Gemini 2.5 Flash Image (no rate limits)...');
      return await generateImageViaFal(enhancedPrompt, false);
    } catch (error) {
      console.warn('fal.ai Gemini Flash failed, falling back to direct Gemini:', error);
      // Continue to direct Gemini fallback
    }
  }

  // Fallback to direct Gemini Imagen (with rate limits)
  try {
    console.log('Using direct Gemini Imagen...');
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    } else {
      throw new Error("API did not return any images.");
    }
  } catch (error) {
    console.error("Error calling Gemini Image API:", error);
    
    // Check if it's a quota exceeded error
    if (error instanceof Error && error.message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Quota exceeded. Try using fal.ai by adding FAL_API_KEY to your environment, or try again tomorrow.");
    }
    
    throw new Error("Failed to generate image from the API.");
  }
}

/**
 * Helper function to generate images via fal.ai
 * Supports both Gemini Flash Image and Nano Banana
 */
async function generateImageViaFal(prompt: string, useNanoBanana: boolean = false): Promise<string> {
  const endpoint = useNanoBanana 
    ? 'https://fal.run/fal-ai/nano-banana'
    : 'https://fal.run/fal-ai/gemini-25-flash-image';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        num_images: 1,
        output_format: 'png',
        sync_mode: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`fal.ai API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      return data.images[0].url;
    } else {
      throw new Error('No images returned from fal.ai API');
    }

  } catch (error) {
    console.error(`Error calling fal.ai ${useNanoBanana ? 'Nano Banana' : 'Gemini Flash'}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Invalid fal.ai API key. Please check your credentials.');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message.includes('402')) {
        throw new Error('Insufficient credits. Please add credits to your fal.ai account.');
      }
    }
    
    throw new Error(`Failed to generate image with fal.ai ${useNanoBanana ? 'Nano Banana' : 'Gemini Flash'}.`);
  }
}

/**
 * Generate colorful image using fal.ai's Nano Banana model
 * This is an optional alternative for users who want more vibrant visuals
 */
export async function generateColorfulImageFromDescription(prompt: string): Promise<string> {
  const enhancedPrompt = `Create a colorful, engaging, and vibrant visual representation of: "${prompt}". Style: modern, colorful, artistic diagram with bright colors, engaging design, suitable for visual learning and note-taking. Make it visually appealing and easy to understand.`;

  return await generateImageViaFal(enhancedPrompt, true);
}
