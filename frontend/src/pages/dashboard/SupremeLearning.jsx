import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Tv, Sparkles, RefreshCw, AlertCircle, Maximize, Minimize, ChevronDown, PlayCircle } from 'lucide-react';
import { generateSupremeNotes } from '../../utils/gemini';
import { api } from '../../utils/api';
import { useUsage } from '../../context/UsageContext';
import UpgradeModal from '../../components/UpgradeModal';
import UsageBadge from '../../components/UsageBadge';

const EXAM_TYPES = ['JEE Main', 'JEE Advanced', 'NEET', 'UPSC', 'CAT', 'GATE', 'General'];
const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati'];

function buildYouTubeSearchLink(topic, subject, examType, language) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} ${subject} ${examType} ${language} lecture tutorial`)}`;
}

export default function SupremeLearning() {
  const { used, limit, refresh: refreshUsage, onUpgrade } = useUsage();
  const [form, setForm] = useState({ topic: '', subject: '', examType: 'JEE Main', videoLanguage: 'English', notesLanguage: 'English' });
  const [notes, setNotes] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ used: 0, limit: null });
  const containerRef = useRef(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.topic.trim() || !form.subject.trim()) { setError('Please fill in Topic and Subject.'); return; }
    setError(''); setVideoError(''); setLoading(true); setNotes(''); setVideoInfo(null);
    try {
      // Check supreme learning daily limit
      const usageRes = await api.post('/usage/supreme/increment', {});
      if (!usageRes.allowed) {
        setLimitInfo({ used: usageRes.used, limit: usageRes.limit });
        setShowUpgrade(true);
        setLoading(false);
        return;
      }
      await refreshUsage();

      // Generate notes
      const notesResult = await generateSupremeNotes({
        topic: form.topic, subject: form.subject, examType: form.examType, language: form.notesLanguage
      });
      setNotes(notesResult);

      // Search for a real YouTube video
      setVideoLoading(true);
      try {
        const query = `${form.topic} ${form.subject} ${form.examType} ${form.videoLanguage} lecture`;
        const videoData = await api.get(`/ai/youtube-search?query=${encodeURIComponent(query)}`);
        setVideoInfo(videoData);
      } catch (vErr) {
        console.error('Video search failed:', vErr);
        setVideoError('Could not find a video. Use the YouTube link below.');
      } finally {
        setVideoLoading(false);
      }

      // Log action (best effort)
      try {
        await api.post('/data/log-action', {
          actionType: 'study_session',
          subject: form.subject || 'General'
        });
      } catch (err) {
        console.error('Failed to log supreme study session:', err);
      }
    } catch (e) {
      if (e.message && e.message.includes('limit')) {
        setLimitInfo({ used: used('supreme'), limit: limit('supreme') });
        setShowUpgrade(true);
      } else {
        setError(e.message);
      }
    }
    finally { setLoading(false); }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const isLimitReached = limit('supreme') !== null && used('supreme') >= limit('supreme');

  const ytSearchUrl = buildYouTubeSearchLink(form.topic, form.subject, form.examType, form.videoLanguage);
  const ytEmbedSrc = videoInfo?.videoId
    ? `https://www.youtube.com/embed/${videoInfo.videoId}?autoplay=0&rel=0`
    : '';

  return (
    <div className="flex flex-col gap-6">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={onUpgrade}
        feature="supreme"
        used={limitInfo.used}
        limit={limitInfo.limit}
      />
      {/* Config Bar */}
      <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-full mb-1">
            <UsageBadge feature="supreme" used={used('supreme')} limit={limit('supreme')} />
          </div>

          {isLimitReached && (
            <div className="flex-1 min-w-full p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2 mb-2 animate-pulse-glow">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Daily Limit Reached</p>
                <p className="font-normal mt-0.5">You have completed your 5 daily Supreme Learning sessions. Upgrade to Premium for unlimited access.</p>
              </div>
            </div>
          )}

          {[['Topic *', 'topic', "e.g. Newton's Laws"], ['Subject *', 'subject', 'e.g. Physics']].map(([label, name, placeholder]) => (
            <div key={name} className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">{label}</label>
              <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} disabled={isLimitReached}
                className="w-full px-3 py-2.5 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
          ))}
          {[
            ['Exam Type', 'examType', EXAM_TYPES],
            ['Video Language', 'videoLanguage', LANGUAGES],
            ['Notes Language', 'notesLanguage', LANGUAGES],
          ].map(([label, name, options]) => (
            <div key={name} className="flex-1 min-w-[130px]">
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">{label}</label>
              <div className="relative">
                <select name={name} value={form[name]} onChange={handleChange} disabled={isLimitReached}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed">
                  {options.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          ))}
          <button onClick={handleGenerate} disabled={loading || isLimitReached}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex-shrink-0">
            {loading ? <><RefreshCw size={15} className="animate-spin" /><span>Generating...</span></> : <><Sparkles size={15} /><span>Generate</span></>}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle size={14} /><span>{error}</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!notes && !loading && (
        <div className="flex flex-col items-center justify-center h-72 bg-white/70 dark:bg-zinc-900/60 border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl text-slate-400 dark:text-zinc-500">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
            <Tv size={28} className="text-purple-300 dark:text-purple-700" />
          </div>
          <p className="font-medium text-sm">Fill in the details and click Generate</p>
          <p className="text-xs mt-1">Video on the left · AI Notes on the right</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="aspect-video bg-zinc-200/60 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
          <div className="space-y-3 p-5 bg-white/70 dark:bg-zinc-900/60 rounded-2xl border border-purple-100/70 dark:border-zinc-800/60 animate-pulse">
            {[...Array(8)].map((_, i) => <div key={i} className={`h-3 bg-purple-100/60 dark:bg-zinc-800/60 rounded-lg ${i % 3 === 0 ? 'w-2/3' : 'w-full'}`} />)}
          </div>
        </div>
      )}

      {/* Results */}
      {notes && (
        <div ref={containerRef} className="grid lg:grid-cols-2 gap-4">
          {/* Left: Video */}
          <div className="flex flex-col gap-3 lg:sticky lg:top-24 self-start">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <PlayCircle size={13} className="text-red-500" />
                Best Match Video ({form.videoLanguage})
              </span>
              <div className="flex gap-2 items-center">
                <a href={ytSearchUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">Open in YouTube →</a>
                <button onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-zinc-800/70 text-slate-500 dark:text-zinc-400 transition-colors">
                  {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                </button>
              </div>
            </div>

            {/* Video embed area */}
            <div className="rounded-2xl overflow-hidden border border-purple-100/70 dark:border-zinc-800/60 shadow-sm aspect-video bg-zinc-900 relative">
              {videoLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900">
                  <RefreshCw size={22} className="text-purple-400 animate-spin" />
                  <span className="text-xs text-zinc-400">Finding best video...</span>
                </div>
              )}
              {!videoLoading && ytEmbedSrc && (
                <iframe
                  key={ytEmbedSrc}
                  src={ytEmbedSrc}
                  title={videoInfo?.title || 'YouTube video'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {!videoLoading && !ytEmbedSrc && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <PlayCircle size={28} className="text-zinc-600" />
                  <span className="text-xs">No video loaded yet</span>
                </div>
              )}
            </div>

            {/* Video metadata or error */}
            {videoInfo && !videoLoading && (
              <div className="text-[10px] text-slate-500 dark:text-zinc-500 flex items-center justify-between px-1">
                <span className="truncate max-w-[70%]">{videoInfo.title} · {videoInfo.author} {videoInfo.duration ? `· ${videoInfo.duration}` : ''}</span>
                <a href={videoInfo.url} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline flex-shrink-0">Open ↗</a>
              </div>
            )}
            {videoError && !videoLoading && (
              <p className="text-[10px] text-amber-500 dark:text-amber-400 flex items-center gap-1 px-1">
                <AlertCircle size={10} /> {videoError} <a href={ytSearchUrl} target="_blank" rel="noopener noreferrer" className="text-purple-500 underline ml-1">Search on YouTube</a>
              </p>
            )}
          </div>

          {/* Right: Notes */}
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-purple-100/50 dark:border-zinc-800/50 flex-shrink-0">
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">📖 Notes in {form.notesLanguage}</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded-lg font-medium">{form.examType}</span>
            </div>
            <div className="p-5">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-purple-800 dark:prose-headings:text-purple-200">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {notes}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
