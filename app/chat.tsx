'use client';
import { useState } from 'react';

export default function Chat() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setAnswer('');
    setSources([]);

    try {
      const res = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      setAnswer(data.answer || "No strong answer found.");
      setSources(data.sources || []);
    } catch (err) {
      console.error(err);
      setAnswer("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-0">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
          🤖 AI Knowledge Search
        </h1>
        <p className="text-center text-gray-600 mt-2">
          Search Skool data for answers powered by AI embeddings
        </p>

        {/* Search Input */}
        <div className="mt-8 flex flex-col md:flex-row gap-3 md:gap-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask something like: How is GHL used?"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`px-6 py-3 rounded-lg text-white font-semibold transition ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* AI Answer */}
        {answer && (
          <div className="mt-10 bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">🤖 AI Answer</h3>
            <p className="text-gray-700 leading-relaxed">{answer}</p>
          </div>
        )}

        {/* Supporting Sources */}
        {sources.length > 0 && (
          <div className="mt-10">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">📚 Supporting Sources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sources.map((s, i) => (
                <div
                  key={i}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1"
                >
                  {/* Title */}
                  <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">{s.title || "Untitled"}</h4>

                  {/* Content snippet */}
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed line-clamp-4">
                    {s.content || "..."}
                  </p>

                  {/* Meta info */}
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span className="px-2 py-1 rounded-full bg-gray-100">{s.source}</span>
                    <span className="font-mono">Similarity: {s.similarity.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
