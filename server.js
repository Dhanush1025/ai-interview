import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { YoutubeTranscript } from 'youtube-transcript';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Logger ───────────────────────────────────────────────────
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ─── Config ───────────────────────────────────────────────────
const SUPABASE_URL = 'https://kecbjrzpezxxqycjazxh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_D8BnCw2g7W-KOcQ-wE_zvQ_VmWNwNQj';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL  = 'llama-3.1-8b-instant';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ──────────────────────────────────────────────────
/** Calls Groq chat completion — throws on error */
async function groqChat(messages, maxTokens = 500, temperature = 0.8) {
    const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens, temperature })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.choices[0].message.content.trim();
}

/** Extract YouTube video ID from any URL format */
function extractVideoId(url) {
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return match?.[1] || null;
}

/** Chunk text into ~500-char blocks with sentence awareness */
function chunkText(text, size = 500) {
    const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
        if ((current + s).length > size && current.length > 0) {
            chunks.push(current.trim());
            current = s;
        } else {
            current += ' ' + s;
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
}

// ─── Health Check ─────────────────────────────────────────────
app.get('/', (_req, res) => res.send('🚀 AI Backend Active'));

// ─── POST /api/chat ───────────────────────────────────────────
// Main chat endpoint: RAG + Groq interview Q generation
app.post('/api/chat', async (req, res) => {
    try {
        const { history = [], lastAnswer = '', company = 'a top tech company', role = 'candidate', skills = '', interviewType = 'technical' } = req.body;

        // Fetch up to 5 relevant context chunks from knowledge base
        const searchTerms = [role, skills, interviewType].filter(Boolean).join(' ');
        const { data: chunks } = await supabase
            .from('knowledge_base')
            .select('content')
            .or(searchTerms.split(' ').map(t => `content.ilike.%${t}%`).join(','))
            .limit(5);

        const contextText = chunks?.length
            ? chunks.map(c => c.content).join('\n---\n')
            : 'No custom training data — use your general knowledge.';

        const historyText = history.slice(-6) // last 6 turns only (keep prompt lean)
            .map(h => `Q: ${h.question}\nA: ${h.answer}`)
            .join('\n\n');

        const isFirst = !lastAnswer;
        const systemMsg = isFirst
            ? `You are a Senior Interviewer at ${company} hiring a ${role} (${interviewType} interview).
Skills required: ${skills || 'general'}.
Context: ${contextText}
TASK: Start the interview. Ask your FIRST concise opening question.
LANGUAGE RULE: You must use completely friendly, simple, and easy-to-understand English. Never use Hindi, other non-English languages, or complex academic words. Keep the tone warm, welcoming, and clear.
RULES: Max 1 sentence. No intro speech. No "Hello". Just the question.`
            : `You are a Senior Interviewer at ${company} hiring a ${role} (${interviewType} interview).
Context: ${contextText}
History: ${historyText}
Candidate's last answer: "${lastAnswer}"
TASK:
1. Give brief evaluation (max 1 sentence).
2. Ask the NEXT unique question (max 1 sentence).
LANGUAGE RULE: You must use completely friendly, simple, and easy-to-understand English. Never use Hindi, other non-English languages, or complex academic words. Keep the tone warm, welcoming, and clear.
FORMAT EXACTLY: [EVALUATION] <text> [NEXT QUESTION] <text>`;

        const fullResponse = await groqChat([{ role: 'system', content: systemMsg }], 300, 0.85);

        let feedback = '';
        let nextQuestion = fullResponse;

        if (!isFirst && fullResponse.includes('[NEXT QUESTION]')) {
            const parts = fullResponse.split('[NEXT QUESTION]');
            feedback = parts[0].replace('[EVALUATION]', '').trim();
            nextQuestion = parts[1].trim();
        }

        res.json({ feedback, nextQuestion });
    } catch (err) {
        console.error('Chat API Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/score ──────────────────────────────────────────
// AI evaluates full interview transcript and returns structured scores
app.post('/api/score', async (req, res) => {
    try {
        const { conversation = [], role = 'candidate', interviewType = 'technical' } = req.body;

        if (conversation.length === 0) {
            return res.json({ overall: 0, technical: 0, communication: 0, problemSolving: 0, summary: 'No answers recorded.' });
        }

        const transcript = conversation
            .filter(h => h.answer && h.answer !== '[Skipped]')
            .map((h, i) => `Q${i + 1}: ${h.question}\nA: ${h.answer}`)
            .join('\n\n');

        const prompt = `You evaluated a ${interviewType} interview for a ${role} position.
Transcript:
${transcript}

Score the candidate on these 3 dimensions (0-10 each):
1. Technical Depth
2. Communication Clarity  
3. Problem Solving

Also write a 2-sentence professional summary.
LANGUAGE RULE: The summary must be written in completely friendly, clear, and easy-to-understand English. Never use Hindi, other non-English languages, or complex/unfriendly words.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no extra text):
{"technical":7,"communication":8,"problemSolving":6,"overall":7,"summary":"Candidate showed..."}`;

        const raw = await groqChat([{ role: 'user', content: prompt }], 300, 0.4);

        // Extract JSON safely
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Invalid score JSON');
        const scores = JSON.parse(match[0]);
        res.json(scores);
    } catch (err) {
        console.error('Score API Error:', err.message);
        // Return a sensible fallback so UI doesn't break
        res.json({ technical: 6, communication: 6, problemSolving: 6, overall: 6, summary: 'Good effort! Keep practicing to improve your interview skills.' });
    }
});

// ─── POST /api/evaluate-challenge ─────────────────────────────
// Grades a single Daily Challenge question & answer pair with semantic AI scoring
app.post('/api/evaluate-challenge', async (req, res) => {
    try {
        const { question, answer } = req.body;
        if (!question || !answer) {
            return res.status(400).json({ error: 'Question and answer are required' });
        }

        const prompt = `You are a strict, highly accurate, and friendly technical grader. Evaluate the candidate's answer to this question:
Question: "${question}"
Candidate's Answer: "${answer}"

GRADING RUBRIC (Strictly enforce this):
- 9 to 10: Excellent, comprehensive, technically accurate answer that covers all facets of the question with deep insight and professional vocabulary.
- 7 to 8: Good, correct answer that explains the basic concept clearly but misses deep technical depth or advanced details.
- 5 to 6: Average, shallow, or very brief answer (e.g. only 1-2 sentences) that is conceptually correct but lacks explanation or examples.
- 3 to 4: Poor, extremely short, vague, or partially incorrect answer.
- 1 to 2: Completely wrong, empty, gibberish, single-word, or totally irrelevant answer.

TASK:
1. Carefully analyze the answer for technical correctness. Determine whether it is correct, partially correct, or completely wrong.
2. Differentiate the score strictly based on the rubric above.
3. Write a 2-3 sentence friendly, constructive feedback. The feedback MUST begin with a clear correctness label: 'Correct! ', 'Partially Correct! ', or 'Incorrect! ' depending on your analysis, followed by the details.

LANGUAGE RULE: Use simple, easy-to-understand, friendly English only. Avoid Hindi, non-English terms, or unnecessarily complex academic jargon.

RESPOND ONLY IN THIS EXACT JSON FORMAT (no markdown, no extra text):
{"score": 5, "feedback": "Partially Correct! Your answer is..."}`;

        const raw = await groqChat([{ role: 'user', content: prompt }], 250, 0.4);
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Invalid JSON response');
        const result = JSON.parse(match[0]);
        res.json(result);
    } catch (err) {
        console.error('Challenge Evaluation Error:', err.message);
        const fallbackScore = answer.length > 50 ? 6 : 3;
        res.json({ score: fallbackScore, feedback: "Good attempt! Make sure to write a detailed technical explanation to earn a higher score." });
    }
});

// ─── POST /api/train-youtube ──────────────────────────────────
// Fetches YouTube transcript, chunks it, upserts into knowledge_base
app.post('/api/train-youtube', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const videoId = extractVideoId(url);
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL. Use format: youtube.com/watch?v=...' });

    try {
        // 1. Fetch transcript
        console.log(`Fetching transcript for video: ${videoId}`);
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        if (!transcriptItems || transcriptItems.length === 0) {
            return res.status(404).json({ error: 'No transcript available for this video. Try one with captions enabled.' });
        }

        // 2. Combine into full text
        const fullText = transcriptItems.map(t => t.text).join(' ');
        console.log(`Transcript length: ${fullText.length} chars`);

        // 3. Check for duplicates
        const { data: existing } = await supabase
            .from('knowledge_base')
            .select('id')
            .eq('video_url', url)
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'This video is already in your knowledge base.' });
        }

        // 4. Chunk the transcript
        const chunks = chunkText(fullText, 500);
        console.log(`Created ${chunks.length} chunks`);

        // 5. Insert all chunks into Supabase (no embeddings — using keyword search)
        const rows = chunks.map(content => ({ video_url: url, content }));
        const { error: insertError } = await supabase.from('knowledge_base').insert(rows);
        if (insertError) throw insertError;

        res.json({ success: true, chunksAdded: chunks.length, message: `AI trained on ${chunks.length} knowledge chunks from this video!` });
    } catch (err) {
        console.error('Train YouTube Error:', err.message);
        if (err.message?.includes('Transcript is disabled')) {
            return res.status(422).json({ error: 'This video has disabled captions. Please try a different video.' });
        }
        res.status(500).json({ error: 'Failed to process video: ' + err.message });
    }
});

// ─── DELETE /api/knowledge ────────────────────────────────────
// Delete all knowledge chunks for a given video URL
app.delete('/api/knowledge', async (req, res) => {
    const { video_url } = req.body;
    if (!video_url) return res.status(400).json({ error: 'video_url is required' });

    try {
        const { error } = await supabase
            .from('knowledge_base')
            .delete()
            .eq('video_url', video_url);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Delete Knowledge Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/transcribe ─────────────────────────────────────
// Proxy for Groq Whisper — keeps API key server-side
app.post('/api/transcribe', async (req, res) => {
    try {
        // Forward the multipart form directly to Groq
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            const body = Buffer.concat(chunks);
            const contentType = req.headers['content-type'];

            const groqRes = await fetch('https://api.groq.com/openai/v1/audio/translations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': contentType
                },
                body
            });
            const data = await groqRes.json();
            if (data.error) throw new Error(data.error.message);
            res.json({ text: data.text || '' });
        });
    } catch (err) {
        console.error('Transcribe Error:', err.message);
        res.status(500).json({ error: err.message, text: '' });
    }
});

// ─── Start ────────────────────────────────────────────────────
const PORT = 8888;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on http://localhost:${PORT}`));
