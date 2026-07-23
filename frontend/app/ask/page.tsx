"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import { askQuestion } from "@/lib/api";
import { AskResponse } from "@/lib/types";
import { MessageSquare, Sparkles, Send, BookOpen, AlertTriangle, CheckCircle2, HelpCircle, RefreshCw, Loader2 } from "lucide-react";

const EXAMPLE_QUERIES = [
  "Who are the parents of Athena and how was she born?",
  "What is the conflict between Poseidon and Odysseus in Homer's Odyssey?",
  "What are the key differences in how Ovid retells the story of Zeus compared to Hesiod?",
  "Show everyone connected to Apollo."
];

export default function NaturalLanguageSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setQuery(queryText);

    try {
      const res = await askQuestion(queryText.trim());
      setResponse(res);
    } catch (err: any) {
      setError(err.message || "Failed to process query. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            Hybrid GraphRAG Engine
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-100">
            Natural Language Search
          </h1>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Ask natural language questions across classical texts with vector search & graph-backed citations.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm shadow-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about classical mythology..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              aria-label="Submit Question"
              className="px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  Ask AI <Send size={14} />
                </>
              )}
            </button>
          </form>

          {/* Example Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Try example:
            </span>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAsk(q)}
                aria-label={`Ask example question: ${q}`}
                className="text-[11px] font-mono px-3 py-1 bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 rounded-lg text-slate-300 hover:text-amber-300 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Timeout / Error Banner */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-5 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-bold text-sm">GraphRAG Query Failure</p>
                <p className="text-red-400/90">{error}</p>
              </div>
            </div>
            <button
              onClick={() => handleAsk(query)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded-lg font-mono text-xs"
            >
              <RefreshCw size={12} /> Retry Query
            </button>
          </div>
        )}

        {/* Skeleton Loading State */}
        {loading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-4 w-40 bg-slate-800 rounded" />
            <div className="h-20 bg-slate-800/60 rounded-xl" />
            <div className="h-32 bg-slate-800/40 rounded-xl" />
          </div>
        )}

        {/* Response Display */}
        {response && !loading && (
          <div className="space-y-6">
            {/* Generated Answer Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Synthesized GraphRAG Answer
                </span>
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-mono text-emerald-400 font-bold">
                  {(response.confidence * 100).toFixed(0)}% Confidence Score
                </span>
              </div>
              
              <p className="text-sm text-slate-200 leading-relaxed font-sans font-normal whitespace-pre-line">
                {response.answer}
              </p>

              {/* Mentioned Entities */}
              {response.entities && response.entities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">Entities Found:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {response.entities.map((e) => (
                      <span key={e} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] font-mono text-amber-300">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Supporting Passages */}
            {response.passages && response.passages.length > 0 ? (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <h3 className="font-serif text-base font-bold text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Supporting Text Passages ({response.passages.length})
                </h3>
                <div className="space-y-3">
                  {response.passages.map((p, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-amber-400">
                        <span>Source Document: {p.source}</span>
                        <span className="text-slate-400">Extracted Passage</span>
                      </div>
                      <p className="text-xs text-slate-300 italic">"{p.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Genuine No-Answer State */
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400 font-mono">
                No direct text passages found in index for query: "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </Navigation>
  );
}
