import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import authMiddleware from '../authMiddleware.js';
import LearningPath from '../models/LearningPath.js';
import User from '../models/User.js';
import { LIMITS } from '../usageLimits.js';
import yts from 'yt-search';

const router = express.Router();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 0. YouTube Video Search (using yt-search, no API key needed)
router.get('/youtube-search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'query param is required.' });

    const r = await yts(query);
    const videos = (r.videos || []).filter(v => v.videoId && v.seconds > 0);
    if (!videos.length) return res.status(404).json({ error: 'No videos found.' });

    const best = videos[0];
    res.json({
      videoId: best.videoId,
      title: best.title,
      thumbnail: best.thumbnail,
      url: best.url,
      author: best.author?.name || '',
      duration: best.duration?.timestamp || ''
    });
  } catch (err) {
    console.error('YouTube search error:', err);
    res.status(500).json({ error: 'Failed to search YouTube.' });
  }
});



// Helper to strip markdown formatting from JSON
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/i, '');
    cleaned = cleaned.replace(/```$/i, '');
  }
  return cleaned.trim();
}

// 1. Generate Notes
router.post('/notes', authMiddleware, async (req, res) => {
  try {
    const { topic, subject, examType, notesType, specialRequirements } = req.body;
    if (!topic || !subject) {
      return res.status(400).json({ error: 'Topic and Subject are required.' });
    }

    const prompt = `Generate detailed, high-quality study notes on the topic "${topic}" in the subject "${subject}" for the "${examType}" exam.
The notes type should be "${notesType}".
${specialRequirements ? `Special requirements: ${specialRequirements}` : ''}
Format the output using clean, professional Markdown. Use LaTeX notation (such as $...$ for inline math and $$...$$ for block equations) where appropriate for formulas, equations, or scientific notation. Ensure headings are well-structured, concepts are clearly explained, and important terms are highlighted.
Do NOT include any conversational introduction, preamble, summary, or concluding remarks (such as "These short notes provide...", "Here are the notes...", etc.). Start directly with the actual content/headings of the notes.
Do NOT use emojis anywhere in the content.`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();
    res.json({ content });
  } catch (err) {
    console.error('Gemini notes error:', err);
    res.status(500).json({ error: 'Failed to generate study notes.' });
  }
});

// 2. Generate Quiz
router.post('/quiz', authMiddleware, async (req, res) => {
  try {
    const { topic, subject, difficulty, numQuestions, examType } = req.body;
    if (!topic || !subject) {
      return res.status(400).json({ error: 'Topic and Subject are required.' });
    }

    const prompt = `Generate a multiple-choice quiz of ${numQuestions} questions on the topic "${topic}" in the subject "${subject}" for the "${examType}" exam at a "${difficulty}" difficulty level.
Return the response ONLY as a JSON object matching this schema:
{
  "questions": [
    {
      "question": "Question text...",
      "options": [
        "A) Option A text",
        "B) Option B text",
        "C) Option C text",
        "D) Option D text"
      ],
      "correct": "A",
      "explanation": "Detailed explanation..."
    }
  ]
}
Ensure the options are prefixed with "A) ", "B) ", "C) ", "D) ". The "correct" field must be a single uppercase letter ("A", "B", "C", or "D").`;

    const result = await model.generateContent(prompt);

    const text = result.response.text();
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);
  } catch (err) {
    console.error('Gemini quiz error:', err);
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

// 3. Generate Q&A
router.post('/qa', authMiddleware, async (req, res) => {
  try {
    const { topic, subject, difficulty, numQuestions, examType } = req.body;
    if (!topic || !subject) {
      return res.status(400).json({ error: 'Topic and Subject are required.' });
    }

    const prompt = `Generate ${numQuestions} descriptive/short answer questions on the topic "${topic}" in the subject "${subject}" for the "${examType}" exam at a "${difficulty}" difficulty level.
Return the response ONLY as a JSON object matching this schema:
{
  "questions": [
    {
      "question": "Question text...",
      "keyPoints": [
        "Key point 1 to cover",
        "Key point 2 to cover",
        "Key point 3 to cover"
      ],
      "modelAnswer": "Comprehensive model answer...",
      "explanation": "Detailed explanation..."
    }
  ]
}
Ensure the content is detailed and accurate.`;

    const result = await model.generateContent(prompt);

    const text = result.response.text();
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);
  } catch (err) {
    console.error('Gemini Q&A error:', err);
    res.status(500).json({ error: 'Failed to generate Q&A questions.' });
  }
});

// 4. Generate Supreme Notes
router.post('/supreme-notes', authMiddleware, async (req, res) => {
  try {
    const { topic, subject, examType, language } = req.body;
    if (!topic || !subject) {
      return res.status(400).json({ error: 'Topic and Subject are required.' });
    }

    const prompt = `Generate comprehensive, advanced study notes on the topic "${topic}" in the subject "${subject}" for the "${examType}" exam.
The notes must be written in the language: "${language}".
Format the output using clean Markdown. Use LaTeX notation ($...$ and $$...$$) where relevant. Provide deep insights, examples, and detailed explanations.
Do NOT include any conversational introduction, preamble, summary, or concluding remarks (such as "These notes provide...", "Here are the notes...", etc.). Start directly with the actual content/headings of the notes.
Do NOT use emojis anywhere in the content.`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();
    res.json({ content });
  } catch (err) {
    console.error('Gemini supreme notes error:', err);
    res.status(500).json({ error: 'Failed to generate supreme study notes.' });
  }
});

// URL validation helper function
async function isValidUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;

  const check = async (method) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 seconds timeout
    try {
      const res = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);
      return res.status;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    const status = await check('HEAD');
    if (status === 404) return false;
    return true;
  } catch (err) {
    try {
      const status = await check('GET');
      if (status === 404) return false;
      return true;
    } catch (e) {
      return false; // Connection, DNS, or timeout error
    }
  }
}

// 5. Generate and Persist Learning Path
router.post('/learning-path', authMiddleware, async (req, res) => {
  try {
    const { goal, examType, timeframe } = req.body;
    if (!goal) {
      return res.status(400).json({ error: 'Goal is required.' });
    }

    // Check active learning path limit
    const user = await User.findOne({ email: req.user.email });
    const tier = user?.isPremium ? 'premium' : 'free';
    const planLimit = LIMITS[tier].learningPlans;
    const activeCount = await LearningPath.countDocuments({ userEmail: req.user.email, archived: false });
    if (activeCount >= planLimit) {
      return res.status(429).json({
        limitReached: true,
        plan: tier,
        limit: planLimit,
        used: activeCount,
        message: tier === 'free'
          ? `Free plan allows up to ${planLimit} active learning paths. Upgrade to Premium for up to ${LIMITS.premium.learningPlans}.`
          : `Premium plan allows up to ${planLimit} active learning paths.`
      });
    }

    const prompt = `Generate a structured learning path/roadmap to achieve the goal "${goal}" for the "${examType}" exam in a timeframe of "${timeframe}".
Return the response ONLY as a JSON object matching this schema:
{
  "title": "Roadmap Title",
  "overview": "High-level overview of the learning path...",
  "totalDays": 30, // integer representing total days
  "milestones": [
    {
      "day": 10,
      "title": "Milestone Title"
    }
  ],
  "days": [
    {
      "day": 1,
      "title": "Day 1 Focus",
      "topics": ["Topic A", "Topic B"],
      "tasks": ["Task 1 description", "Task 2 description"],
      "resources": [
        {
          "title": "Resource title",
          "url": "https://..."
        }
      ]
    }
  ]
}
CRITICAL RESOURCE RULES:
1. For resources, provide ACTUAL, DIRECT, SPECIFIC working URLs (links) to high-quality tutorials, articles, official documentations, or YouTube videos.
2. DIVERSIFY the resource websites depending on the topic. Do NOT use GeeksforGeeks for every link.
   - For web/software development, use MDN Web Docs, freeCodeCamp, javascript.info, W3Schools, or official docs.
   - For science/math, use Khan Academy, Wikipedia, Paul's Online Math Notes, or YouTube educational channels (e.g. 3Blue1Brown).
   - For DSA, use LeetCode, NeetCode, YouTube tutorials, and GeeksforGeeks.
   - For general topics, use reputable online portals, textbooks, or reference links.
3. NEVER use search engine links (e.g. google.com search links or search queries).
4. NEVER use general homepages (e.g. do not just link to 'https://geeksforgeeks.org' or 'https://youtube.com'). Provide the specific article/video page URL.
5. Examples of good diversified resources:
   - { "title": "GeeksforGeeks: Array Rotation", "url": "https://www.geeksforgeeks.org/array-rotation-by-reversal-algorithm/" }
   - { "title": "YouTube: Harvard CS50 Data Structures Lecture", "url": "https://www.youtube.com/watch?v=5_y6V_U68D8" }
   - { "title": "MDN Web Docs: Array.prototype.map()", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map" }
   - { "title": "Khan Academy: Introduction to Gravity", "url": "https://www.khanacademy.org/science/physics/one-dimensional-motion/displacement-velocity-time/v/introduction-to-gravity" }

Estimate the totalDays as an integer. Do not wrap the JSON in markdown code blocks.`;

    const result = await model.generateContent(prompt);

    const text = result.response.text();
    const pathData = JSON.parse(cleanJsonResponse(text));

    // Verify and sanitize generated resources in parallel
    if (pathData.days && Array.isArray(pathData.days)) {
      const verifyPromises = [];
      for (const day of pathData.days) {
        if (day.resources && Array.isArray(day.resources)) {
          for (const resObj of day.resources) {
            if (resObj && typeof resObj === 'object' && resObj.url) {
              verifyPromises.push((async () => {
                const ok = await isValidUrl(resObj.url);
                if (!ok) {
                  console.log(`[URL Verification Failed]: ${resObj.url}. Reverting to search.`);
                  resObj.url = `https://www.google.com/search?q=${encodeURIComponent(resObj.title)}`;
                }
              })());
            }
          }
        }
      }
      await Promise.allSettled(verifyPromises);
    }

    // Save learning path directly to DB as it was originally done
    const newId = `path_${Date.now()}`;
    const newPath = new LearningPath({
      id: newId,
      userEmail: req.user.email,
      title: pathData.title || goal,
      overview: pathData.overview || '',
      totalDays: pathData.totalDays || 30,
      createdAt: new Date().toLocaleDateString(),
      milestones: pathData.milestones || [],
      days: pathData.days || [],
      completedTasks: {},
      archived: false
    });

    await newPath.save();

    res.json({
      id: newId,
      path: pathData
    });
  } catch (err) {
    console.error('Gemini learning path error:', err);
    res.status(500).json({ error: 'Failed to generate learning path.' });
  }
});

// 6. Chat with Tutor
router.post('/chat-tutor', authMiddleware, async (req, res) => {
  try {
    const { topic, subject, messageHistory, newMessage } = req.body;
    if (!topic || !subject || !newMessage) {
      return res.status(400).json({ error: 'Topic, Subject, and newMessage are required.' });
    }

    const systemPrompt = `You are an expert AI Tutor helping a student learn "${topic}" in the subject "${subject}". Respond to the student's messages clearly, concisely, and encouragingly. Use markdown and math notation ($...$ and $$...$$) where relevant.`;

    // Map messages history to Gemini contents API format
    const contents = (messageHistory || []).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Append the new message
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }]
    });

    const result = await model.generateContent({
      contents,
      systemInstruction: systemPrompt
    });

    const reply = result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error('Gemini chat tutor error:', err);
    res.status(500).json({ error: 'Failed to communicate with AI Tutor.' });
  }
});

// 7. Score Descriptive Answers
router.post('/score-qa', authMiddleware, async (req, res) => {
  try {
    const { questions, answers } = req.body;
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions array is required.' });
    }

    const prompt = `Evaluate the user's descriptive answers against the questions, key points, and model answers.
Questions and Answers to evaluate:
${questions.map((q, idx) => `
Question ${idx + 1}: ${q.question}
Key Points: ${(q.keyPoints || []).join(', ')}
Model Answer: ${q.modelAnswer}
User Answer: ${answers[idx] || '(No Answer Provided)'}
`).join('\n')}

For each question:
1. Grade the user's answer from 0 to 100 based on how well they covered the key points and matches the model answer's details.
2. Provide a constructive, brief feedback (1-2 sentences) on what they got correct and what was missing or incorrect.

Return the response ONLY as a JSON object matching this schema:
{
  "evaluations": [
    {
      "score": 85, // integer between 0 and 100
      "feedback": "Feedback text..."
    }
  ],
  "overallScore": 85 // integer representing the average score of all evaluated questions
}
Do not wrap the JSON in markdown code blocks.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);
  } catch (err) {
    console.error('Gemini Q&A evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate Q&A answers.' });
  }
});

export default router;
