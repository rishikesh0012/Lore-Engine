"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { fetchCharacterProfile } from "@/lib/api";
import { ArrowLeft, GitCommit, BookOpen, ExternalLink, Network, Sparkles, AlertTriangle } from "lucide-react";

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string || "zeus";

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchCharacterProfile(id)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load character profile.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Navigation>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-40 bg-slate-800 rounded-lg" />
          <div className="h-48 bg-slate-900 border border-slate-800 rounded-2xl" />
          <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl" />
        </div>
      </Navigation>
    );
  }

  if (error || !data || !data.profile) {
    return (
      <Navigation>
        <div className="max-w-4xl mx-auto text-center space-y-4 py-16">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-serif font-bold text-slate-200">Character Profile Not Found</h2>
          <p className="text-xs text-slate-400">Could not retrieve detailed profile for identifier: "{id}"</p>
          <Link
            href="/characters"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono"
          >
            <ArrowLeft size={14} /> Back to Character Explorer
          </Link>
        </div>
      </Navigation>
    );
  }

  const { profile, relationships, subgraph } = data;

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/characters"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Characters
        </Link>

        {/* Profile Card Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-lg">
              {profile.avatar || "🏛️"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-amber-300">{profile.name}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                  {profile.tradition}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{profile.title}</p>
            </div>
          </div>

          <Link
            href={`/graph?entity=${encodeURIComponent(profile.name)}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 rounded-xl text-xs font-mono transition-all shadow-md"
          >
            <Network size={16} /> Open in Knowledge Graph
          </Link>
        </div>

        {/* Aliases Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Cross-Tradition Aliases & Titles
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.aliases && profile.aliases.map((alias: string) => (
              <span
                key={alias}
                className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-300"
              >
                {alias}
              </span>
            ))}
          </div>
        </div>

        {/* Mythological Summary */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">Mythological Profile</h2>
          <p className="text-sm text-slate-300 leading-relaxed font-serif">{profile.summary}</p>
        </div>

        {/* Primary Sources & Citations */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-400" /> Attributed Source Manuscripts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.sources && profile.sources.map((src: string) => (
              <div key={src} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs font-mono text-teal-300 flex items-center justify-between">
                <span>{src}</span>
                <span className="text-[10px] text-slate-500">Verified</span>
              </div>
            ))}
          </div>
        </div>

        {/* Extracted Graph Relationships */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-purple-400" /> Extracted Graph Neighborhood ({relationships ? relationships.length : 0})
            </h2>
          </div>

          <div className="space-y-2">
            {relationships && relationships.map((rel: any) => (
              <div key={rel.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-100 font-bold">{rel.entity_a}</span>
                  <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/30 text-violet-300 rounded text-[10px]">
                    {rel.relation_type}
                  </span>
                  <span className="text-slate-100 font-bold">{rel.entity_b}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>{rel.source}</span>
                  <span className="text-emerald-400 font-bold">{(rel.confidence * 100).toFixed(0)}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Navigation>
  );
}
