import React, { useState } from 'react';
import { HelpCircle, Sparkles, RefreshCw, AlertCircle, CheckCircle, XCircle, ChevronDown, Trophy, RotateCcw } from 'lucide-react';
import { generateQuiz } from '../../utils/gemini';
import { api } from '../../utils/api';
import { useUsage } from '../../context/UsageContext';
import UpgradeModal from '../../components/UpgradeModal';
import UsageBadge from '../../components/UsageBadge';

const EXAM_TYPES = ['JEE Main', 'JEE Advanced', 'NEET', 'UPSC', 'CAT', 'GATE', 'IBPS', 'SSC CGL', 'Class 10', 'Class 12', 'General'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function AIQuiz() {
  const { used, limit, refresh: refreshUsage, onUpgrade } = useUsage();
  const [form, setForm] = useState({ topic: '', subject: '', examType: 'JEE Main', difficulty: 'Medium', numQuestions: 10 });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ used: 0, limit: null });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.topic.trim() || !form.subject.trim()) { setError('Please fill in Topic and Subject.'); return; }
    setError(''); setLoading(true); setQuestions([]); setAnswers({}); setSubmitted(false); setScore(null);
    try {
      // Check usage limit first
      const usageRes = await api.post('/usage/quiz/increment', {});
      if (!usageRes.allowed) {
        setLimitInfo({ used: usageRes.used, limit: usageRes.limit });
        setShowUpgrade(true);
        setLoading(false);
        return;
      }
      await refreshUsage();
      const qs = await generateQuiz({ ...form, numQuestions: parseInt(form.numQuestions) });
      setQuestions(qs);
    } catch (e) {
      // Handle 429 limit-reached response from the API
      if (e.message && e.message.includes('limit')) {
        setLimitInfo({ used: used('quiz'), limit: limit('quiz') });
        setShowUpgrade(true);
      } else {
        setError(e.message);
      }
    }
    finally { setLoading(false); }
  };

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    setAnswers(a => ({ ...a, [qIdx]: option[0] })); // Store just the letter A/B/C/D
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setError('');
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    setScore(correct);
    setSubmitted(true);

    try {
      const scorePercent = Math.round((correct / questions.length) * 100);
      await api.post('/data/log-action', {
        actionType: 'quiz',
        subject: form.subject || 'General',
        questionsCount: questions.length,
        score: scorePercent
      });
    } catch (err) {
      console.error('Failed to log quiz score:', err);
    }
  };

  const handleReset = () => {
    setQuestions([]); setAnswers({}); setSubmitted(false); setScore(null); setError('');
  };

  const getOptionClass = (qIdx, option) => {
    const letter = option[0];
    const selected = answers[qIdx] === letter;
    const correct = questions[qIdx]?.correct === letter;
    if (!submitted) {
      return selected
        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200'
        : 'border-purple-100/60 dark:border-zinc-700/60 hover:border-purple-300 dark:hover:border-purple-700 text-slate-700 dark:text-zinc-300';
    }
    if (correct) return 'border-green-500 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200';
    if (selected && !correct) return 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200';
    return 'border-purple-100/40 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-500 opacity-60';
  };

  const isLimitReached = limit('quiz') !== null && used('quiz') >= limit('quiz');
  const scorePercent = questions.length ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={onUpgrade}
        feature="quiz"
        used={limitInfo.used}
        limit={limitInfo.limit}
      />
      {/* Form Panel */}
      <div className="lg:w-80 flex-shrink-0 lg:sticky lg:top-24 self-start">
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-4 shadow-sm h-[540px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-purple-500/30">
                <HelpCircle size={16} className="text-white" />
              </div>
              <h2 className="font-display font-bold text-slate-800 dark:text-white">Configure Quiz</h2>
            </div>
            <div className="mb-3">
              <UsageBadge feature="quiz" used={used('quiz')} limit={limit('quiz')} />
            </div>

            {isLimitReached && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2 mb-3 animate-pulse-glow">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Daily Limit Reached</p>
                  <p className="font-normal mt-0.5">You have completed your 5 daily quizzes. Upgrade to Premium for unlimited attempts.</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Topic *</label>
                <input name="topic" value={form.topic} onChange={handleChange} placeholder="e.g. Gravitation, Calculus" disabled={isLimitReached}
                  className="w-full px-3 py-2 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Subject *</label>
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Physics, Maths" disabled={isLimitReached}
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
                <input type="range" min="5" max="30" step="5" name="numQuestions" value={form.numQuestions} onChange={handleChange} disabled={isLimitReached}
                  className="w-full accent-purple-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>5</span><span>30</span></div>
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
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
              {loading ? <><RefreshCw size={15} className="animate-spin" /><span>Generating...</span></> : <><Sparkles size={15} /><span>Generate Quiz</span></>}
            </button>
            {questions.length > 0 && !submitted && (
              <button onClick={handleSubmit}
                className="w-full py-2 rounded-xl bg-green-600 text-white font-semibold text-sm shadow-md shadow-green-500/25 hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                <CheckCircle size={14} /><span>Submit Quiz</span>
              </button>
            )}
            {submitted && (
              <button onClick={handleReset}
                className="w-full py-2 rounded-xl border border-purple-200/70 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 font-semibold text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center gap-2">
                <RotateCcw size={14} /><span>New Quiz</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Area */}
      <div className="flex-1 space-y-4 h-[540px] overflow-y-auto no-scrollbar">
        {/* Score Banner */}
        {submitted && (
          <div className={`p-5 rounded-2xl border flex items-center gap-4 ${scorePercent >= 60 ? 'bg-green-50 dark:bg-green-950/30 border-green-300/60 dark:border-green-800/40' : 'bg-red-50 dark:bg-red-950/30 border-red-300/60 dark:border-red-800/40'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-display flex-shrink-0 ${scorePercent >= 60 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
              {scorePercent}%
            </div>
            <div>
              <p className="font-display font-bold text-lg text-slate-800 dark:text-white">
                {scorePercent >= 80 ? '🏆 Excellent!' : scorePercent >= 60 ? '👍 Good Job!' : '📚 Keep Practicing!'}
              </p>
              <p className="text-sm text-slate-600 dark:text-zinc-400">You scored <strong>{score}/{questions.length}</strong> correct answers</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/70 dark:bg-zinc-900/60 border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-purple-100/60 dark:bg-zinc-800/60 rounded-lg w-3/4 mb-4" />
                <div className="space-y-2">{[...Array(4)].map((_, j) => <div key={j} className="h-10 bg-purple-100/40 dark:bg-zinc-800/40 rounded-xl" />)}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && questions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full bg-white/70 dark:bg-zinc-900/60 border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl text-slate-400 dark:text-zinc-500">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
              <Trophy size={28} className="text-purple-300 dark:text-purple-700" />
            </div>
            <p className="font-medium text-sm">Set your preferences and generate a quiz</p>
            <p className="text-xs mt-1">AI-generated MCQs with explanations</p>
          </div>
        )}

        {questions.map((q, i) => (
          <div key={i} className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <p className="text-sm font-medium text-slate-800 dark:text-zinc-100 leading-relaxed">{q.question}</p>
            </div>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <button key={opt} onClick={() => handleSelect(i, opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 flex items-center gap-3 ${getOptionClass(i, opt)}`}>
                  {submitted && questions[i]?.correct === opt[0] && <CheckCircle size={15} className="text-green-500 flex-shrink-0" />}
                  {submitted && answers[i] === opt[0] && answers[i] !== questions[i]?.correct && <XCircle size={15} className="text-red-500 flex-shrink-0" />}
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            {submitted && (
              <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Explanation</p>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
