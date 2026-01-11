'use client';

import { useState } from 'react';

interface ApiResponse {
  pass?: boolean;
  error?: string;
  metaTags?: string; // Comma-separated keywords
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data: ApiResponse = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="w-full max-w-2xl">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-black dark:text-zinc-50">
            Website Summarizer & Legitimacy Checker
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Enter a URL to check if the website is legitimate (no pornographic, illicit, or harmful content)
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Website URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !url}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Checking...' : 'Check Website'}
            </button>
          </form>

          {result && (
            <div className="mt-6 space-y-4">
              {result.error ? (
                <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <p className="font-semibold text-red-600 dark:text-red-400">Error:</p>
                  <p className="text-red-600 dark:text-red-400">{result.error}</p>
                </div>
              ) : result.pass !== undefined ? (
                <>
                  {/* Legitimacy Result */}
                  <div
                    className={`p-4 rounded-lg border ${
                      result.pass
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{result.pass ? '✅' : '❌'}</span>
                      <span
                        className={`font-semibold text-lg ${
                          result.pass
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {result.pass
                          ? 'Website is legitimate'
                          : 'Website contains inappropriate content'}
                      </span>
                    </div>
                    <p className="text-sm opacity-75">
                      Pass: <strong>{result.pass ? 'true' : 'false'}</strong>
                    </p>
                  </div>

                  {/* Website Meta Tags */}
                  {result.metaTags && (
                    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                      <h3 className="font-semibold text-lg mb-4 text-black dark:text-zinc-50">
                        Meta Tags (Keywords)
                      </h3>
                      <div>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                          Website Categories & Topics:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.metaTags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 italic">
                          Comma-separated keywords for database storage
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <strong>API Endpoint:</strong> POST /api/summarize
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              <strong>Response Format:</strong> {'{ "pass": boolean }'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
