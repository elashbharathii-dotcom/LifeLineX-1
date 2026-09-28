import React, { useState, useRef, useEffect } from 'react';
import { aiService, AIChatMessage } from '../../services/aiService';
import { locationService } from '../../services/locationService';
import { Sparkles, Send, ShieldCheck, Bot, User, HelpCircle } from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  'Find nearby hospitals',
  'Where can I find blood?',
  'Show my appointments',
  'How do I contact emergency services?',
];

export const LifelineAIChat: React.FC = () => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      content:
        'Hello! I am Lifeline Assistant — your verified healthcare guide.\n\nI can help you locate accredited hospitals, check blood compatibility and bank reserves, coordinate emergency ambulance dispatch, and review your scheduled appointments.\n\nHow can I help you today?',
      timestamp: new Date().toISOString(),
      metadata: {
        suggestions: DEFAULT_SUGGESTIONS,
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: AIChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const loc = locationService.getCurrentState();
      const response = await aiService.processQuery(textToSend, {
        lat: loc.latitude,
        lon: loc.longitude,
      });
      setMessages((prev) => [...prev, response]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          content: 'Unable to reach the assistant right now. If this is a medical emergency, please call 108 or activate Emergency SOS immediately.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-10 bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-muted)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--color-primary)] text-white shadow-md">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)] mb-2">
                Verified Assistant
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                Ask Lifeline
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1.5 max-w-2xl">
                Real-time healthcare guidance, emergency dispatch assistance, hospital resource availability, and clinical triage support.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-2xl border border-teal-100 text-xs font-semibold text-teal-800 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Clinical Guardrails Active</span>
          </div>
        </div>
      </div>

      {/* ── 2. Chat Container ── */}
      <div className="rounded-[32px] bg-white border border-[var(--color-border-default)] shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Messages Transcript */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3.5 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-teal-50 text-[var(--color-primary)] border border-teal-100'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-3`}>
                <div
                  className={`p-5 rounded-[24px] text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm rounded-tr-sm'
                      : 'bg-[#F7F8F6] text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>

                {/* Suggestions Pills */}
                {m.metadata?.suggestions && m.metadata.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {m.metadata.suggestions.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => handleSend(sug)}
                        className="lx-btn lx-btn-secondary lx-btn-sm"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 pl-12 text-xs text-[var(--color-text-muted)] animate-pulse">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Checking verified healthcare database &amp; resources…</span>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* ── 3. Quick Suggestions Toolbar ── */}
        <div className="px-6 py-2 border-t border-[var(--color-border-muted)] bg-[#FAFBF9] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold uppercase text-[var(--color-text-muted)] shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Suggestions:
          </span>
          {DEFAULT_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              onClick={() => handleSend(sug)}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 border border-[var(--color-border-default)] text-[11px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap transition-colors shrink-0"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* ── 4. Input Area ── */}
        <div className="p-4 sm:p-5 bg-white border-t border-[var(--color-border-default)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about hospital beds, blood types, emergency procedures, or appointments..."
              className="flex-1 h-12 rounded-2xl px-5 bg-[#F7F8F6] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="lx-btn lx-btn-primary lx-btn-icon shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
