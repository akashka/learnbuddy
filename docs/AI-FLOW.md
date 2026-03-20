# AI Flow – Models, Usage, and Architecture

This document describes how AI is used across LearnBuddy, which models power each feature, and the request flow.

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────────────────────┐
│  Frontend   │────▶│     Backend      │────▶│  AI Service (or local ai-unified)        │
│  / Admin    │     │  (Express API)   │     │  Multi-provider fallback chain            │
└─────────────┘     └──────────────────┘     └─────────────────────────────────────────┘
                              │                                    │
                              │  AI_SERVICE_URL set?                │
                              ├── Yes ──▶ ai-client ──▶ HTTP ──────┘
                              │
                              └── No  ──▶ ai-unified (local providers)
```

- **With AI_SERVICE_URL:** Backend calls the standalone AI service over HTTP. Keys live in `ai-service/.env`.
- **Without AI_SERVICE_URL:** Backend uses `ai-unified` with local providers. Keys live in `backend/.env`.

---

## Provider Fallback Order

When a provider fails (429, quota exceeded, rate limit), the next is tried:

**Gemini → Groq → Hugging Face → OpenRouter → Cloudflare → Together → OpenAI**

| Provider | Text | JSON | Vision | Audio (transcribe) |
|----------|------|------|--------|--------------------|
| Gemini | ✓ | ✓ | ✓ | ✓ |
| Groq | ✓ | ✓ | - | - |
| Hugging Face | ✓ | ✓ | - | - |
| OpenRouter | ✓ | ✓ | ✓ | - |
| Cloudflare | ✓ | ✓ | - | - |
| Together | ✓ | ✓ | ✓ | - |
| OpenAI | ✓ | ✓ | ✓ | ✓ |

**Vision** = image understanding (exam monitoring, document verification, drawing grading).  
**Audio** = speech-to-text (exam monitoring with audio).

---

## Where Each AI Capability Is Used

### 1. Text Generation (`aiGenerate`)

| Feature | Location | Purpose |
|---------|----------|---------|
| Doubt answering | `ai-service/services/doubt.ts` | Answer student questions with educational content |
| Study material | `ai-service/services/generation.ts` | Generate study content from topic |
| Flashcards | `ai-service/services/generation.ts` | Generate flashcards from topic, material, or exam feedback |
| Exam overall feedback | `ai-service/services/evaluation.ts` | Summarize exam performance |
| Teacher qualification exam | `ai-service/services/generation.ts` | Generate MCQ questions |
| Sentiment fallback text | `ai-service/services/sentiment.ts` | Safe display when content flagged |

**Models used:** Any provider (Gemini, Groq, HuggingFace, OpenRouter, Cloudflare, Together, OpenAI).

---

### 2. JSON Generation (`aiGenerateJson`)

| Feature | Location | Purpose |
|---------|----------|---------|
| Teacher qualification exam | `ai-service/services/generation.ts` | Structured MCQ output |
| Student exam questions | `ai-service/services/generation.ts` | Structured question set |
| Exam evaluation | `ai-service/services/evaluation.ts` | Marks, feedback, structured results |
| Sentiment analysis | `ai-service/services/sentiment.ts` | `{ score, safe, flags }` |
| Document verification | `ai-service/services/monitoring.ts` | `verified | not_verified | partially_verified` |

**Models used:** Any provider.

---

### 3. Vision / Image Analysis (`aiGenerateWithImages`, `aiGenerateWithImageAndAudio`)

| Feature | Location | Purpose |
|---------|----------|---------|
| Exam monitoring | `ai-service/services/monitoring.ts` | Check: alone, no phone, face visible, no cheating |
| Exam monitoring + audio | `ai-service/services/monitoring.ts` | Same + speech-to-text for transcript |
| Classroom monitoring | `ai-service/services/monitoring.ts` | Student + teacher frame safety check |
| Document verification | `ai-service/services/monitoring.ts` | Match document photo to profile photo |
| Drawing/diagram grading | `ai-service/services/evaluation.ts` | Grade student drawings in exams |

**Models used:** Gemini, OpenRouter, Together, OpenAI (vision-capable only).

---

### 4. Audio Transcription (`aiTranscribeAudio`)

| Feature | Location | Purpose |
|---------|----------|---------|
| Exam monitoring | `ai-service/services/monitoring.ts` | Convert audio to text for audit + sentiment |

**Models used:** Gemini, OpenAI only (Whisper / native audio support).

---

## Request Flow by User Action

### Student Takes Exam

1. **Generate questions:** `POST /api/student/exam/generate` → ai-service `/v1/generate/student-exam`  
   - Uses `aiGenerateJson` (text provider).

2. **During exam – monitoring:** `POST /api/student/exam/monitor` → ai-service `/v1/monitor/exam`  
   - Uses `aiGenerateWithImageAndAudio` (vision + optional audio).  
   - Uses `aiTranscribeAudio` if audio provided.  
   - Uses `aiGenerateJson` (sentiment on transcript).

3. **Submit & evaluate:** `POST /api/student/exam/evaluate` → ai-service `/v1/evaluate/exam`  
   - Uses `aiGenerateJson` for short/objective answers.  
   - Uses `aiGenerateWithImages` for drawing/diagram answers.  
   - Uses `aiGenerate` for overall feedback.

### Teacher Registration Exam

1. **Generate questions:** `POST /api/teachers/qualification-exam` → ai-service `/v1/generate/qualification-exam`  
   - Uses `aiGenerateJson`.

2. **Monitor during exam:** Same as student exam monitoring (vision + audio).

### Student Asks Doubt

1. **Ask doubt:** `POST /api/study/ask` → ai-service `/v1/doubt/ask`  
   - Uses `aiGenerate` (text).  
   - Uses `aiGenerateJson` (sentiment on question and answer).

### Study Material Generation

1. **Generate:** `POST /api/study/generate` → ai-service `/v1/generate/study-material`  
   - Uses `aiGenerate` for text, optionally `includeFlashcards` for Option B.
2. **Generate flashcards (Option A):** `POST /api/study/generate-flashcards` → ai-service `/v1/generate/flashcards`  
   - Uses `aiGenerateJson` for `{ cards: [{ front, back }] }`.
3. **Flashcards from material (Option C):** `POST /api/study/generate-flashcards-from-material` → ai-service `/v1/generate/flashcards-from-material`  
   - Extracts flashcards from study material text.
4. **Flashcards from exam (Option D):** `POST /api/study/generate-flashcards-from-exam` → ai-service `/v1/generate/flashcards-from-exam`  
   - Uses weak areas from exam feedback to generate remedial flashcards.

### Document Verification

1. **Verify:** `POST /api/.../verify-document` → ai-service `/v1/monitor/verify-document`  
   - Uses `aiGenerateWithImages` (document + profile photo).

### Classroom Monitoring

1. **Analyze frame:** `POST /api/classroom/monitor` → ai-service `/v1/monitor/classroom`  
   - Uses `aiGenerateWithImages` (student + teacher frames).

---

## Provider-Specific Models

| Provider | Model(s) |
|----------|----------|
| Gemini | gemini-1.5-flash, gemini-1.5-pro, gemini-2.5-flash, gemini-2.0-flash |
| Groq | llama-3.3-70b-versatile |
| Hugging Face | meta-llama/Llama-3.3-70B-Instruct:groq (override: HF_MODEL) |
| OpenRouter | openrouter/free (routes to free models) |
| Cloudflare | @cf/meta/llama-3.1-8b-instruct |
| Together | meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo, meta-llama/Llama-3.2-3B-Instruct-Turbo |
| OpenAI | gpt-4o-mini |

---

## Environment Variables

| Variable | Service | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | backend, ai-service | Google Gemini |
| `GROQ_API_KEY` | backend, ai-service | Groq |
| `HF_TOKEN` or `HUGGINGFACE_TOKEN` | backend, ai-service | Hugging Face Inference |
| `OPENROUTER_API_KEY` | backend, ai-service | OpenRouter |
| `CLOUDFLARE_ACCOUNT_ID` | backend, ai-service | Cloudflare Workers AI |
| `CLOUDFLARE_API_TOKEN` | backend, ai-service | Cloudflare Workers AI |
| `TOGETHER_API_KEY` | backend, ai-service | Together AI |
| `OPENAI_API_KEY` | backend, ai-service | OpenAI |
| `AI_SERVICE_URL` | backend | Use external AI service instead of local |
| `AI_SERVICE_API_KEY` | backend | Auth for AI service calls |

---

## Smart Model Selection

The AI service runs a **provider health monitor** that:

1. **Periodically probes** each provider (default: every 5 min) with a simple request
2. **Records outcomes** from every AI request (success/failure, latency)
3. **Stores health data** in Redis (`ai:provider:health:{name}:{capability}`)
4. **Selects providers** by score: recent success, low latency, fewer failures

Before each request, the **smart selector** returns the best provider order. Configure:

- `AI_HEALTH_CHECK_INTERVAL_MS` – probe interval (default 300000 = 5 min). Set 0 to disable.
- `REDIS_URL` – required for health persistence. Without Redis, default order is used.

**Endpoint:** `GET /health/providers` – returns current health data per capability (text, vision, audio).

---

## Caching

- **Redis:** AI service caches doubt answers and some generation results via `cacheGetOrSet`.
- **TTL:** `AI_CACHE_TTL` (default 1 hour) for doubt and study material.

---

## Error Handling

- **Retryable:** 429, 404, "quota exceeded", "rate limit" → try next provider.
- **Non-retryable:** Other errors → fail immediately.
- **Fallback:** Some features (e.g. sentiment) return safe defaults if all providers fail.

---

## Related Docs

- [AI-MODELS-GUIDE.md](./AI-MODELS-GUIDE.md) – How to get API keys for each provider
- [COMPONENT-CONNECTIONS.md](./COMPONENT-CONNECTIONS.md) – Env vars and service wiring
