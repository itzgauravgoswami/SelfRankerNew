import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { FileText, Sparkles, Download, RefreshCw, AlertCircle, BookOpen, ChevronDown } from 'lucide-react';
import { generateNotes } from '../../utils/gemini';
import { exportToPDF } from '../../utils/pdfExport';
import { api } from '../../utils/api';
import { useUsage } from '../../context/UsageContext';
import UpgradeModal from '../../components/UpgradeModal';
import UsageBadge from '../../components/UsageBadge';

const EXAM_TYPES = ['JEE Main', 'JEE Advanced', 'NEET', 'UPSC', 'CAT', 'GATE', 'IBPS', 'SSC CGL', 'Class 10', 'Class 12', 'General'];
const NOTES_TYPES = ['Detailed', 'Short Notes'];

export default function AINotes() {
  const { used, limit, refresh: refreshUsage, onUpgrade } = useUsage();
  const [form, setForm] = useState({ topic: '', subject: '', examType: 'JEE Main', notesType: 'Detailed', specialRequirements: '' });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ used: 0, limit: null });
  const notesRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };



  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.topic.trim() || !form.subject.trim()) {
      setError('Please fill in Topic and Subject.');
      return;
    }
    setError('');
    setLoading(true);
    setNotes('');
    try {
      const result = await generateNotes(form);
      setNotes(result);
      try {
        await api.post('/data/log-action', {
          actionType: 'study_session',
          subject: form.subject || 'General'
        });
      } catch (err) {
        console.error('Failed to log study session:', err);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!notesRef.current) return;
    try {
      setError('');
      setPdfLoading(true);
      // Check monthly notes download limit
      const usageRes = await api.post('/usage/notes/increment', {});
      if (!usageRes.allowed) {
        setLimitInfo({ used: usageRes.used, limit: usageRes.limit });
        setShowUpgrade(true);
        setPdfLoading(false);
        return;
      }
      await refreshUsage();
      await exportToPDF(notesRef.current, `${form.topic}-${form.subject}-notes`, {
        topic: form.topic,
        subject: form.subject,
        examType: form.examType,
        notesType: form.notesType
      });
    } catch (e) {
      setError('PDF export failed: ' + e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const isLimitReached = limit('notes') !== null && used('notes') >= limit('notes');

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={onUpgrade}
        feature="notes"
        used={limitInfo.used}
        limit={limitInfo.limit}
      />
      {/* Form Panel */}
      <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24 lg:self-start">
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-4 shadow-sm h-auto lg:h-[540px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-md shadow-purple-500/30">
                <FileText size={16} className="text-white" />
              </div>
              <h2 className="font-display font-bold text-slate-800 dark:text-white">Configure Notes</h2>
            </div>
            <div className="mb-3">
              <UsageBadge feature="notes" used={used('notes')} limit={limit('notes')} />
            </div>

            {isLimitReached && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2 mb-3 animate-pulse-glow">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Download Limit Reached</p>
                  <p className="font-normal mt-0.5">You have downloaded all 10 notes for this month. Upgrade to Premium for unlimited downloads.</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Topic *</label>
                <input
                  name="topic"
                  value={form.topic}
                  onChange={handleChange}
                  placeholder="e.g. Thermodynamics, Integration"
                  className="w-full px-3 py-2 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Subject *</label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. Physics, Mathematics"
                  className="w-full px-3 py-2 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Exam Type</label>
                <div className="relative">
                  <select
                    name="examType"
                    value={form.examType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition appearance-none pr-8"
                  >
                    {EXAM_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Notes Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {NOTES_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, notesType: t }))}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                        form.notesType === t
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25'
                          : 'border-purple-100/70 dark:border-zinc-700/70 text-slate-600 dark:text-zinc-400 hover:border-purple-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Generating Notes...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Generate Notes</span>
                </>
              )}
            </button>

            {notes && (
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading || isLimitReached}
                className="w-full py-2 rounded-xl border border-purple-200/70 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 font-semibold text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes Preview */}
      <div className="flex-1 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[540px]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100/50 dark:border-zinc-800/50">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-purple-600 dark:text-purple-400" />
            <span className="font-display font-semibold text-sm text-slate-700 dark:text-zinc-200">
              {notes ? `${form.topic} — ${form.notesType}` : 'Notes Preview'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {notes && (
              <>
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 border border-purple-100/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy Notes'}
                </button>
                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded-lg font-medium">
                  {form.examType}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
          {loading && (
            <div className="space-y-3 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-4 bg-purple-100/60 dark:bg-zinc-800/60 rounded-lg ${i % 3 === 0 ? 'w-2/3' : i % 3 === 1 ? 'w-full' : 'w-5/6'}`} />
              ))}
            </div>
          )}
          {!loading && !notes && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-500">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-purple-300 dark:text-purple-700" />
              </div>
              <p className="font-medium text-sm">Configure your notes and click Generate</p>
              <p className="text-xs mt-1">AI-powered notes with math support will appear here</p>
            </div>
          )}
          {notes && (
            <div ref={notesRef} className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-purple-800 dark:prose-headings:text-purple-200 prose-strong:text-slate-800 dark:prose-strong:text-zinc-100">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {notes}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
