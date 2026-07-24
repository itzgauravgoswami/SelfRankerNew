import React, { useState } from 'react';
import { MessageSquare, Sparkles, RefreshCw, AlertCircle, ChevronDown, ChevronUp, CheckCircle, RotateCcw, Lightbulb } from 'lucide-react';
import { generateQA, evaluateQA } from '../../utils/gemini';
import { api } from '../../utils/api';
import { useUsage } from '../../context/UsageContext';
import UpgradeModal from '../../components/UpgradeModal';
import UsageBadge from '../../components/UsageBadge';

const EXAM_TYPES = ['JEE Main', 'JEE Advanced', 'NEET', 'UPSC', 'CAT', 'GATE', 'IBPS', 'SSC CGL', 'Class 10', 'Class 12', 'General'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function AIQA() {
  const { used, limit, refresh: refreshUsage, onUpgrade } = useUsage();
  const [form, setForm] = useState({ topic: '', subject: '', examType: 'UPSC', difficulty: 'Medium', numQuestions: 5 });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKeyPoints, setShowKeyPoints] = useState({});
  const [showAnswer, setShowAnswer] = useState({});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ used: 0, limit: null });
  const [submitting, setSubmitting] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [overallScore, setOverallScore] = useState(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.topic.trim() || !form.subject.trim()) { setError('Please fill in Topic and Subject.'); return; }
    setError(''); setLoading(true); setQuestions([]); setAnswers({}); setSubmitted(false); setShowKeyPoints({}); setShowAnswer({});
    try {
      // Check usage limit
      const usageRes = await api.post('/usage/qa/increment', {});
      if (!usageRes.allowed) {
        setLimitInfo({ used: usageRes.used, limit: usageRes.limit });
        setShowUpgrade(true);
        setLoading(false);
        return;
      }
      await refreshUsage();
      const qs = await generateQA({ ...form, numQuestions: parseInt(form.numQuestions) });
      setQuestions(qs);
    } catch (e) {
      if (e.message && e.message.includes('limit')) {
        setLimitInfo({ used: used('qa'), limit: limit('qa') });
        setShowUpgrade(true);
      } else {
        setError(e.message);
      }
    }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) { setError('Please attempt all questions.'); return; }
    setError(''); setSubmitting(true);

    try {
      // Call AI evaluation API
      const evalRes = await evaluateQA({ questions, answers });
      setEvaluations(evalRes.evaluations || []);
      setOverallScore(evalRes.overallScore || 0);

      setSubmitted(true);
      const allShown = {};
      questions.forEach((_, i) => { allShown[i] = true; });
      setShowAnswer(allShown);

      // Log action with actual score and 'qa' actionType
      await api.post('/data/log-action', {
        actionType: 'qa',
        subject: form.subject || 'General',
        questionsCount: questions.length,
        score: evalRes.overallScore || 0
      });
    } catch (err) {
      console.error('Failed to evaluate and log Q&A submission:', err);
      setError(err.message || 'Failed to submit and grade answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setError('');
    setShowKeyPoints({});
    setShowAnswer({});
    setEvaluations([]);
    setOverallScore(null);
  };

  const isLimitReached = limit('qa') !== null && used('qa') >= limit('qa');

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={onUpgrade}
        feature="qa"
        used={limitInfo.used}
        limit={limitInfo.limit}
      />
      {/* Form Panel */}
      <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24 lg:self-start">
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-4 shadow-sm h-auto lg:h-[540px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-md shadow-indigo-500/30">
                <MessageSquare size={16} className="text-white" />
              </div>
              <h2 className="font-display font-bold text-slate-800 dark:text-white">Configure Q&A</h2>
            </div>
            <div className="mb-3">
              <UsageBadge feature="qa" used={used('qa')} limit={limit('qa')} />
            </div>

            {isLimitReached && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2 mb-3 animate-pulse-glow">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Daily Limit Reached</p>
                  <p className="font-normal mt-0.5">You have completed your 5 daily Q&A tests. Upgrade to Premium for unlimited attempts.</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Topic *</label>
                <input name="topic" value={form.topic} onChange={handleChange} placeholder="e.g. Indian Constitution" disabled={isLimitReached}
                  className="w-full px-3 py-2 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Subject *</label>
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Polity, Chemistry" disabled={isLimitReached}
                  className="w-full px-3 py-2 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Exam Type</label>
                <div className="relative">
                  <select name="examType" value={form.examType} onChange={handleChange} disabled={isLimitReached}
                    className="w-full px-3 py-2 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed">
                    {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Difficulty</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DIFFICULTIES.map(d => (
                    <button key={d} type="button" onClick={() => !isLimitReached && setForm(f => ({ ...f, difficulty: d }))} disabled={isLimitReached}
                      className={`py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${form.difficulty === d ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25' : 'border-purple-100/70 dark:border-zinc-700/70 text-slate-600 dark:text-zinc-400 hover:border-purple-300'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">No. of Questions: <span className="text-purple-600 dark:text-purple-400 font-bold">{form.numQuestions}</span></label>
                <input type="range" min="3" max="15" step="1" name="numQuestions" value={form.numQuestions} onChange={handleChange} disabled={isLimitReached}
                  className="w-full accent-purple-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>3</span><span>15</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
              </div>
            )}
            <button onClick={handleGenerate} disabled={loading || isLimitReached}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
              {loading ? <><RefreshCw size={15} className="animate-spin" /><span>Generating...</span></> : <><Sparkles size={15} /><span>Generate Q&A</span></>}
            </button>
            {questions.length > 0 && !submitted && (
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-2 rounded-xl bg-green-600 text-white font-semibold text-sm shadow-md shadow-green-500/25 hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? (
                  <><RefreshCw size={14} className="animate-spin" /><span>Evaluating...</span></>
                ) : (
                  <><CheckCircle size={14} /><span>Submit Answers</span></>
                )}
              </button>
            )}
            {submitted && (
              <button onClick={handleReset}
                className="w-full py-2 rounded-xl border border-purple-200/70 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 font-semibold text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center gap-2">
                <RotateCcw size={14} /><span>New Q&A Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Questions Area */}
      <div className="flex-1 space-y-5 h-[540px] overflow-y-auto no-scrollbar">
        {/* Score Banner */}
        {submitted && overallScore !== null && (
          <div className={`p-5 rounded-2xl border flex items-center gap-4 ${overallScore >= 60 ? 'bg-green-50 dark:bg-green-950/30 border-green-300/60 dark:border-green-800/40' : 'bg-red-50 dark:bg-red-950/30 border-red-300/60 dark:border-red-800/40'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-display flex-shrink-0 ${overallScore >= 60 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
              {overallScore}%
            </div>
            <div>
              <p className="font-display font-bold text-lg text-slate-800 dark:text-white">
                {overallScore >= 80 ? '🏆 Excellent!' : overallScore >= 60 ? '👍 Good Job!' : '📚 Keep Practicing!'}
              </p>
              <p className="text-sm text-slate-600 dark:text-zinc-400">AI graded your descriptive answers. Overall Score: <strong>{overallScore}%</strong></p>
            </div>
          </div>
        )}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/70 dark:bg-zinc-900/60 border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-purple-100/60 dark:bg-zinc-800/60 rounded-lg w-4/5 mb-4" />
                <div className="h-24 bg-purple-100/40 dark:bg-zinc-800/40 rounded-xl" />
              </div>
            ))}
          </div>
        )}
        {!loading && questions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full bg-white/70 dark:bg-zinc-900/60 border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl text-slate-400 dark:text-zinc-500">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-purple-300 dark:text-purple-700" />
            </div>
            <p className="font-medium text-sm">Configure and generate descriptive questions</p>
            <p className="text-xs mt-1">Write answers and get AI evaluation with model answers</p>
          </div>
        )}
        {questions.map((q, i) => (
          <div key={i} className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100 leading-relaxed">{q.question}</p>
            </div>

            {/* Key Points accordion */}
            <button
              onClick={() => setShowKeyPoints(s => ({ ...s, [i]: !s[i] }))}
              className="mb-3 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              <Lightbulb size={14} />
              <span>Key Points to Cover</span>
              {showKeyPoints[i] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showKeyPoints[i] && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40">
                <ul className="space-y-1.5">
                  {q.keyPoints?.map((kp, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                      <span className="w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</span>
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Answer textarea */}
            <textarea
              value={answers[i] || ''}
              onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
              disabled={submitted}
              placeholder="Write your answer here..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition resize-none disabled:opacity-70 disabled:cursor-not-allowed"
            />

            {/* Model answer + explanation on submit */}
            {showAnswer[i] && (
              <div className="mt-4 space-y-3">
                {evaluations && evaluations[i] && (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/40">
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">🤖 AI Score & Feedback</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-purple-900 dark:text-purple-100">{evaluations[i].score}%</span>
                      <div className="flex-1 h-1.5 bg-purple-200 dark:bg-purple-900/50 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${evaluations[i].score}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">{evaluations[i].feedback}</p>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/40">
                  <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-2">✅ Model Answer</p>
                  <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">{q.modelAnswer}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">💡 Explanation & What Examiners Look For</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            )}

            {/* Toggle answer while submitted (already auto-shown on submit) */}
            {!submitted && (
              <button
                onClick={() => setShowAnswer(s => ({ ...s, [i]: !s[i] }))}
                className="mt-3 text-xs font-semibold text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {showAnswer[i] ? 'Hide Model Answer' : 'Peek Model Answer'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
