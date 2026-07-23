import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2, Minimize2, Maximize2, X } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface FloatingChatWidgetProps {
  universeId: string;
  onEntityClick: (label: string) => void;
}

export default function FloatingChatWidget({ universeId, onEntityClick }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "oracle", text: string, entities?: string[] }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      // In overlap or conflicts mode, we might pass a blank ID, but since this relies on the backend route we just pass universeId or "global".
      // The backend route is /api/universes/{id}/ask.
      const safeId = universeId === "Overlap" || universeId === "Conflicts" ? "global" : universeId;
      
      const res = await fetch(`${getApiBaseUrl()}/universes/${safeId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage })
      });
      
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: "oracle", 
        text: data.response, 
        entities: data.entities_mentioned || [] 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "oracle", text: "Error communicating with the Oracle." }]);
    }
    
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-myth-accent-violet rounded-full shadow-lg shadow-myth-accent-violet/20 flex items-center justify-center text-white hover:scale-105 transition-transform z-50 group"
      >
        <MessageSquare size={24} className="group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <div className={`absolute bottom-6 right-6 bg-myth-card border border-myth-accent-gold/20 shadow-2xl flex flex-col transition-all duration-300 z-50 ${isMinimized ? 'w-64 h-12 rounded-t-xl rounded-b-xl' : 'w-96 h-[500px] rounded-xl overflow-hidden'}`}>
      
      {/* Header */}
      <div className="h-12 bg-myth-bg-dark border-b border-myth-accent-gold/10 flex justify-between items-center px-4 shrink-0 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2 text-myth-accent-gold">
          <MessageSquare size={16} />
          <span className="font-cormorant font-medium tracking-wide">Ask the Oracle</span>
        </div>
        <div className="flex gap-2 text-myth-text-secondary">
          <button className="hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button className="hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-sans bg-myth-bg-dark/50">
            {messages.length === 0 && (
              <div className="text-center text-myth-text-secondary text-sm mt-10 italic">
                Ask a question about {universeId.replace('_', ' ')}.
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2 max-w-[85%] rounded-xl text-sm ${msg.role === 'user' ? 'bg-myth-accent-violet/20 text-white border border-myth-accent-violet/30' : 'bg-myth-bg-dark text-myth-text-primary border border-white/5'}`}>
                  {msg.text}
                </div>
                
                {/* Render Entity Chips */}
                {msg.entities && msg.entities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.entities.map((ent, i) => (
                      <button 
                        key={i}
                        onClick={() => onEntityClick(ent)}
                        className="text-[10px] font-jetbrains uppercase tracking-widest px-2 py-0.5 bg-myth-accent-gold/10 text-myth-accent-gold hover:bg-myth-accent-gold hover:text-myth-bg-dark border border-myth-accent-gold/30 rounded-full transition-colors"
                      >
                        {ent}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 bg-myth-bg-dark border border-white/5 rounded-xl flex gap-1">
                  <span className="w-1.5 h-1.5 bg-myth-accent-gold/50 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-myth-accent-gold/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-1.5 h-1.5 bg-myth-accent-gold/50 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-myth-bg-dark border-t border-myth-accent-gold/10 flex gap-2 shrink-0">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the texts..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-myth-text-secondary focus:outline-none focus:border-myth-accent-violet/50"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-lg bg-myth-accent-violet/20 border border-myth-accent-violet/50 flex items-center justify-center text-myth-accent-violet hover:bg-myth-accent-violet hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
