import { NextRequest, NextResponse } from 'next/server';
import Exa from 'exa-js';
import Groq from 'groq-sdk';

// TypeScript interfaces
interface SummarizeRequest {
  url: string;
}

interface SummarizeResponse {
  pass: boolean;
  metaTags?: string; // Comma-separated keywords for categorization
}

interface GroqModerationResponse {
  isLegit?: boolean;
  reason?: string;
}

interface GroqTagsResponse {
  tags?: string;
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests',
      usage: {
        method: 'POST',
        url: '/api/summarize',
        body: {
          url: 'https://example.com',
        },
        example: 'curl -X POST http://localhost:3000/api/summarize -H "Content-Type: application/json" -d \'{"url": "https://example.com"}\'',
      },
    },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check for API keys
    if (!process.env.EXA_API_KEY) {
      return NextResponse.json(
        { error: 'EXA_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    // Initialize clients after validating API keys exist
    const exa = new Exa(process.env.EXA_API_KEY);
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const body: SummarizeRequest = await request.json();
    const { url } = body;

    // Validate URL
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Get contents with summary
    let exaResponse;
    try {
      exaResponse = await exa.getContents(url, {
        summary: true,
      });
    } catch (exaError: any) {
      console.error('Exa API Error:', exaError);
      if (exaError.message?.includes('API key') || exaError.message?.includes('Invalid')) {
        return NextResponse.json(
          { error: 'Invalid Exa API key. Please check your EXA_API_KEY in .env.local' },
          { status: 401 }
        );
      }
      throw exaError; // Re-throw if it's a different error
    }

    // Check if we got results
    if (!exaResponse.results || exaResponse.results.length === 0) {
      return NextResponse.json(
        { error: 'No content found for the provided URL' },
        { status: 404 }
      );
    }

    const result = exaResponse.results[0];
    const summary = (result as any).summary || 'No summary available';

    // Check legitimacy using Groq AI
    let isLegit = false;
    let legitimacyReason = '';

    try {
      const groqResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation assistant. Analyze the provided website summary and determine if the website is legitimate and safe. A legitimate website should NOT contain pornographic content, illicit material, illegal activities, or harmful content. Respond with a JSON object containing "isLegit" (boolean) and "reason" (string explaining your decision).',
          },
          {
            role: 'user',
            content: `Analyze the following website summary and determine if this website is legitimate (no pornographic, illicit, or harmful content):\n\nTitle: ${result.title || 'N/A'}\n\nSummary: ${summary}\n\nRespond with ONLY a valid JSON object in this format: {"isLegit": true/false, "reason": "your explanation here"}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const moderationResult = groqResponse.choices[0]?.message?.content;
      
      if (moderationResult) {
        try {
          const parsed: GroqModerationResponse = JSON.parse(moderationResult);
          isLegit = parsed.isLegit === true;
          legitimacyReason = parsed.reason || 'No reason provided';
        } catch (parseError) {
          // If JSON parsing fails, try to extract boolean from text response
          const lowerContent = moderationResult.toLowerCase();
          isLegit = lowerContent.includes('true') || 
                   lowerContent.includes('legitimate') || 
                   lowerContent.includes('safe');
          legitimacyReason = moderationResult;
        }
      }
    } catch (groqError: any) {
      console.error('Error checking legitimacy with Groq:', groqError);
      
      // Check if it's an API key error
      if (groqError.message?.includes('API key') || groqError.message?.includes('Invalid') || groqError.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Groq API key. Please check your GROQ_API_KEY in .env.local' },
          { status: 401 }
        );
      }
      
      // Continue with isLegit = false if Groq fails for other reasons
      legitimacyReason = 'Failed to verify legitimacy: ' + (groqError.message || 'Unknown error');
    }

    // Generate meta tags (keywords) using Groq AI
    let metaTags = '';
    try {
      const tagsResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a website categorization assistant. Analyze the website summary and generate relevant keywords/tags that describe what the website is about. Return ONLY a comma-separated list of keywords (5-10 keywords). Focus on the main topics, industry, content type, and purpose of the website.',
          },
          {
            role: 'user',
            content: `Generate relevant meta tags (keywords) for this website:\n\nTitle: ${result.title || 'N/A'}\n\nSummary: ${summary}\n\nReturn ONLY a comma-separated list of keywords, nothing else. Example: "technology, programming, web development, tutorials, education"`,
          },
        ],
        temperature: 0.5,
      });

      const tagsResult = tagsResponse.choices[0]?.message?.content;
      if (tagsResult) {
        // Clean up the response - remove quotes, newlines, extra spaces
        metaTags = tagsResult
          .trim()
          .replace(/^["']|["']$/g, '') // Remove surrounding quotes
          .replace(/\n/g, ',') // Replace newlines with commas
          .replace(/\s*,\s*/g, ', ') // Normalize comma spacing
          .replace(/\s+/g, ' ') // Normalize multiple spaces
          .trim();
      }
    } catch (tagsError: any) {
      console.error('Error generating meta tags:', tagsError);
      // If tag generation fails, extract basic tags from title and summary
      const words = `${result.title || ''} ${summary}`.toLowerCase().split(/\s+/);
      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can']);
      const uniqueWords = [...new Set(words.filter(word => word.length > 3 && !commonWords.has(word)))].slice(0, 10);
      metaTags = uniqueWords.join(', ');
    }

    // Return the result with meta tags
    const response: SummarizeResponse = {
      pass: isLegit,
      metaTags: metaTags || undefined,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error summarizing URL:', error);
    
    // Handle Exa API errors
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to summarize the URL' },
      { status: 500 }
    );
  }
}
