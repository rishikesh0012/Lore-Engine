"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import { askQuestion } from "@/lib/api";
import { AskResponse } from "@/lib/types";
import { MessageSquare, Sparkles, Send, BookOpen, GitCommit, CheckCircle2, HelpCircle } from "lucide-react";

const EXAMPLE_QUERIES = [
  "Who are Zeus' children?",
  "Who opposes Odysseus?",
  "Compare Athena across all sources.",
  "Show everyone connected to Apollo."
];

export default function NaturalLanguageSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setQuery(queryText);
    const res = await askQuestion(queryText);
    setResponse(res);
    setLoading(false);
  };

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            Hybrid Retrieval Engine
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-100">
            Natural Language Search
          </h1>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Ask natural language questions across Greek and Roman mythological texts with graph-backed citations.
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
              className="px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Ask AI"}
              <Send size={14} />
            </button>
          </form>

          {/* Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Try example:
            </span>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleAsk(q)}
                className="text-[11px] font-mono px-3 py-1 bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 rounded-lg text-slate-300 hover:text-amber-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Response Display */}
        {loading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-16 bg-slate-800/60 rounded-xl" />
            <div className="h-24 bg-slate-800/40 rounded-xl" />
          </div>
        )}

        {response && !loading && (
          <div className="space-y-6">
            {/* Generated Answer Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Synthesized Answer
                </span>
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-mono text-emerald-400 font-bold">
                  {(response.confidence * 100).toFixed(0)}% Confidence Score
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans font-normal">
                {response.answer}
              </p>

              {/* Mentioned Entities */}
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
            </div>

            {/* Supporting Passages */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Supporting Text Passages
              </h3>
              <div className="space-y-3">
                {response.passages.map((p, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-amber-400">
                      <span>Source: {p.source}</span>
                      <span>Verified Citation</span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{p.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
