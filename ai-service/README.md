# AI Service – Independent Microservice

Standalone AI service for the tuition platform. Supports multiple models (Gemini, OpenAI, Claude) and is accessible from backend, frontend, and mobile app.

## Features

- **Multi-model:** Gemini, OpenAI, Claude (extensible)
- **Generation:** Exam questions, study materials, qualification exams
- **Evaluation:** Grade student/teacher exams, drawings
- **Monitoring:** Real-time classroom and exam monitoring (direct access from clients)
- **Doubt answering:** Student Q&A
- **Caching:** Redis for exam questions, study materials

## Setup

```bash
npm install
cp .env.example .env
# Configure GEMINI_API_KEY, OPENAI_API_KEY (optional), REDIS_URL
npm run dev
```

Runs at http://localhost:3002 by default.

## API

See [docs/AI-SERVICE-ARCHITECTURE.md](../docs/AI-SERVICE-ARCHITECTURE.md) for full API design and architecture.

### Quick Reference

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/generate/qualification-exam` | Teacher qualification questions |
| `POST /v1/generate/student-exam` | Student exam questions |
| `POST /v1/generate/study-material` | Study material |
| `POST /v1/evaluate/exam` | Grade student exam |
| `POST /v1/monitor/classroom` | Classroom frame analysis (direct access) |
| `POST /v1/monitor/exam` | Exam frame + audio analysis (direct access) |
| `POST /v1/doubt/ask` | Answer student doubt |

## Direct Monitoring

Frontend/app can call monitoring endpoints directly with a short-lived JWT from the backend. This reduces latency for real-time proctoring.
