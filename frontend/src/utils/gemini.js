// Gemini API utility for Self Ranker AI features
// Re-routed through the Express backend proxy

import { api } from './api';

/**
 * Generate AI Notes in markdown format with math support.
 */
export async function generateNotes({ topic, subject, examType, notesType, specialRequirements }) {
  const data = await api.post('/ai/notes', { topic, subject, examType, notesType, specialRequirements });
  return data.content;
}

/**
 * Generate AI Quiz questions as JSON.
 */
export async function generateQuiz({ topic, subject, difficulty, numQuestions, examType }) {
  const data = await api.post('/ai/quiz', { topic, subject, difficulty, numQuestions, examType });
  return data.questions;
}

/**
 * Generate AI Q&A questions as JSON.
 */
export async function generateQA({ topic, subject, difficulty, numQuestions, examType }) {
  const data = await api.post('/ai/qa', { topic, subject, difficulty, numQuestions, examType });
  return data.questions;
}

/**
 * Generate notes for Supreme Learning in specified language.
 */
export async function generateSupremeNotes({ topic, subject, examType, language }) {
  const data = await api.post('/ai/supreme-notes', { topic, subject, examType, language });
  return data.content;
}

/**
 * Generate a Learning Path as structured JSON.
 */
export async function generateLearningPath({ goal, examType, timeframe }) {
  const data = await api.post('/ai/learning-path', { goal, examType, timeframe });
  return data.path;
}

/**
 * Chat with AI Tutor - returns AI response for a conversation.
 */
export async function chatWithTutor(messages, topic, subject) {
  const messageHistory = messages.slice(0, -1);
  const newMessage = messages[messages.length - 1].content;
  const data = await api.post('/ai/chat-tutor', { topic, subject, messageHistory, newMessage });
  return data.reply;
}

/**
 * Evaluate and grade Q&A descriptive answers using the Gemini API proxy.
 */
export async function evaluateQA({ questions, answers }) {
  return api.post('/ai/score-qa', { questions, answers });
}
