import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Bot, Send, RefreshCw, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import { chatWithTutor } from '../../utils/gemini';
import { api } from '../../utils/api';

export default function AITutor() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get('/auth/profile');
        setProfile(data.user);
      } catch (err) {
        console.error('Failed to fetch user profile in tutor:', err);
      }
    };
    fetchProfile();
  }, []);

  const startSession = async () => {
    if (!topic.trim() || !subject.trim()) { setError('Please enter Topic and Subject.'); return; }
    setError('');
    setSessionStarted(true);
    setMessages([{
      role: 'ai',
      content: `👋 Hello! I'm your AI Tutor for **${topic}** in **${subject}**.\n\nAsk me anything — concepts, formulas, solved examples, or doubts. I'm here to help you master this topic!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);

    try {
      await api.post('/data/log-action', {
        actionType: 'study_session',
        subject: subject || 'General'
      });
    } catch (err) {
      console.error('Failed to log tutor study session:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatWithTutor(updatedMessages, topic, subject);
      setMessages(m => [...m, { role: 'ai', content: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', content: `❌ Error: ${e.message}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleClear = () => { setMessages([]); setSessionStarted(false); setTopic(''); setSubject(''); };

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/Assets/Logos/Logo (MAIN).png" alt="Self Ranker Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">AI Tutor</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Enter your topic and subject to start a personalized tutoring session</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">Topic *</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Integration by Parts, Photoelectric Effect"
                className="w-full px-4 py-3 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">Subject *</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics, Physics, History"
                className="w-full px-4 py-3 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition" />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={14} /><span>{error}</span>
              </div>
            )}
            <button onClick={startSession}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
              <Sparkles size={16} /><span>Start Tutoring Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100/50 dark:border-zinc-800/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/Assets/Logos/Logo (MAIN).png" alt="Self Ranker Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-slate-800 dark:text-white">{topic}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">{subject} · AI Tutor Session</p>
          </div>
        </div>
        <button onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 border border-purple-100/60 dark:border-zinc-800/60 transition-all">
          <Trash2 size={13} /><span>End Session</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm overflow-hidden ${msg.role === 'ai' ? '' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'}`}>
              {msg.role === 'ai' ? (
                <img src="/Assets/Logos/Logo (MAIN).png" alt="Self Ranker Logo" className="w-full h-full object-contain" />
              ) : (
                profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0) || 'S'
                )
              )}
            </div>
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'ai'
                  ? 'bg-purple-50 dark:bg-zinc-800/70 text-slate-800 dark:text-zinc-100 rounded-tl-sm border border-purple-100/60 dark:border-zinc-700/50'
                  : 'bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-tr-sm shadow-md shadow-purple-500/20'
                }`}>
                {msg.role === 'ai' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 px-1">{msg.time}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
              <img src="/Assets/Logos/Logo (MAIN).png" alt="Self Ranker Logo" className="w-full h-full object-contain" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-purple-50 dark:bg-zinc-800/70 border border-purple-100/60 dark:border-zinc-700/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-purple-100/50 dark:border-zinc-800/50 flex-shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about ${topic}...`}
            rows={2}
            className="flex-1 px-4 py-3 rounded-2xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition resize-none"
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white shadow-md shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100 flex-shrink-0">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
