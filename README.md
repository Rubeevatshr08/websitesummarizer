# Website Summarizer & Legitimacy Checker

A Next.js API that summarizes any website URL and checks if it's legitimate (no pornographic, illicit, or harmful content) using ExaJS for summarization and Groq AI for content moderation.

## Features

- 📝 Summarizes website content using ExaJS
- ✅ Checks website legitimacy using Groq AI (Llama 3.1)
- 🔒 TypeScript for type safety
- 🚀 Built with Next.js 16

## Prerequisites

- Node.js 18+ installed
- API keys from:
  - [Exa AI](https://exa.ai/) - for website summarization
  - [Groq](https://groq.com/) - for LLM-based legitimacy checking

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
EXA_API_KEY=your_exa_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

**Get your API keys:**
- Exa API Key: Sign up at [https://exa.ai/](https://exa.ai/) and get your API key from the dashboard
- Groq API Key: Sign up at [https://groq.com/](https://groq.com/) and get your API key from the console

### 3. Run the Development Server

```bash
npm run dev
```

The server will start on [http://localhost:3000](http://localhost:3000)

## API Usage

### Endpoint

**POST** `/api/summarize`

### Request

```bash
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Response

```json
{
  "pass": true
}
```

- `pass: true` - Website is legitimate (no inappropriate content)
- `pass: false` - Website contains pornographic, illicit, or harmful content

### Example with JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/summarize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com'
  })
});

const data = await response.json();
console.log(data); // { pass: true } or { pass: false }
```

## Project Structure

```
website_summeriser/
├── app/
│   ├── api/
│   │   └── summarize/
│   │       └── route.ts    # API route for summarization
│   ├── layout.tsx
│   └── page.tsx
├── .env.local              # Environment variables (create this)
├── package.json
└── tsconfig.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## How It Works

1. **Summarization**: The API receives a URL and uses ExaJS to fetch and summarize the website content
2. **Legitimacy Check**: The summary is sent to Groq AI (Llama 3.1 70B) to analyze if the website contains inappropriate content
3. **Response**: Returns `{ pass: boolean }` indicating if the website is legitimate

## Troubleshooting

- **"EXA_API_KEY environment variable is not set"**: Make sure you've created `.env.local` with your Exa API key
- **"GROQ_API_KEY environment variable is not set"**: Make sure you've created `.env.local` with your Groq API key
- **"No content found for the provided URL"**: The URL might be inaccessible or blocked by Exa
- **Port already in use**: Change the port with `npm run dev -- -p 3001`

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **ExaJS** - Website summarization
- **Groq SDK** - LLM for content moderation
