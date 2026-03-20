# AI Models Guide – Free Tier Setup

LearnBuddy supports multiple AI providers with automatic fallback when one hits quota. Configure at least one provider in `backend/.env` and/or `ai-service/.env`.

## Supported Providers (all have free tiers)

| Provider | Free Tier | Get Key |
|----------|-----------|---------|
| **Google Gemini** | 15 RPM (Flash), 10 RPM (Pro). No credit card. | [Google AI Studio](https://aistudio.google.com/apikey) |
| **Groq** | ~14,400 req/day, 30 RPM. Ultra-fast. No credit card. | [Groq Console](https://console.groq.com/keys) |
| **Hugging Face** | ~300 req/hour, $0.10/month credits. Many models. | [Hugging Face Tokens](https://huggingface.co/settings/tokens) |
| **OpenRouter** | ~50 req/day on free models. No credit card. | [OpenRouter Keys](https://openrouter.ai/keys) |
| **Cloudflare Workers AI** | 10,000 Neurons/day. Requires Cloudflare account. | [Cloudflare Dashboard](https://dash.cloudflare.com) |
| **Together AI** | Free models (Llama 3.2). Reduced rate limits. | [Together AI](https://api.together.xyz/settings/api-keys) |
| **OpenAI** | $5 free credits for new accounts. Credit card required. | [OpenAI Platform](https://platform.openai.com/api-keys) |

## Fallback Order

When a provider fails (429, quota exceeded), the next is tried:

**Gemini → Groq → Hugging Face → OpenRouter → Cloudflare → Together → OpenAI**

---

## How to Get Free API Keys

### 1. Google Gemini

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Get API key** → **Create API key**
4. Copy the key and add to `.env`:
   ```
   GEMINI_API_KEY=your-key-here
   ```

### 2. Groq

1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign up (free, no credit card)
3. Navigate to **API Keys**
4. Create a new key
5. Add to `.env`:
   ```
   GROQ_API_KEY=your-key-here
   ```

### 3. Hugging Face

1. Go to [Hugging Face](https://huggingface.co/join)
2. Sign up (free)
3. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click **New token**
5. Create a token with **Read** permission (or Inference if needed)
6. **Important:** Go to [Settings → Inference Providers](https://huggingface.co/settings/inference-providers) and enable at least one provider (e.g. **Groq** for Llama 3.3 70B)
7. Add to `.env`:
   ```
   HF_TOKEN=your-token-here
   ```
   (Alternatively: `HUGGINGFACE_TOKEN`)

### 4. OpenRouter

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up (free)
3. Go to [Settings → API Keys](https://openrouter.ai/keys)
4. Create a new key
5. Add to `.env`:
   ```
   OPENROUTER_API_KEY=your-key-here
   ```

### 5. Cloudflare Workers AI

1. Create a [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
2. Go to **Workers & Pages** → **Overview**
3. Note your **Account ID** (right sidebar)
4. Go to [Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
5. Click **Create Token**
6. Use template **Edit Cloudflare Workers** or create custom token with:
   - **Workers AI** → **Read**
7. Copy the token (shown only once)
8. Add to `.env`:
   ```
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-api-token
   ```

### 6. Together AI

1. Go to [Together AI](https://api.together.xyz/settings/api-keys)
2. Sign up (free)
3. Settings → **API Keys**
4. Create a new key
5. Add to `.env`:
   ```
   TOGETHER_API_KEY=your-key-here
   ```

### 7. OpenAI

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up (requires credit card for verification)
3. **API Keys** → **Create new secret key**
4. Add to `.env`:
   ```
   OPENAI_API_KEY=your-key-here
   ```

---

## Where to Add Keys

- **Backend** (when not using external AI service): `backend/.env`
- **AI Service** (standalone microservice): `ai-service/.env`

If you use `AI_SERVICE_URL`, only the AI service needs the keys. Otherwise, the backend uses its local AI and needs the keys in `backend/.env`.

---

## Admin: AI Models Page

In the admin panel, go to **AI Models** to see:

- Which providers are configured
- Step-by-step guides to get each key
- Direct links to each provider’s key page

---

## Capabilities by Provider

| Provider | Text | JSON | Vision | Audio (transcribe) |
|----------|------|------|--------|--------------------|
| Gemini | ✓ | ✓ | ✓ | ✓ |
| Groq | ✓ | ✓ | - | - |
| Hugging Face | ✓ | ✓ | - | - |
| OpenRouter | ✓ | ✓ | ✓ | - |
| Cloudflare | ✓ | ✓ | - | - |
| Together | ✓ | ✓ | ✓ | - |
| OpenAI | ✓ | ✓ | ✓ | ✓ |

Vision tasks (exam monitoring, document verification, drawing grading) use Gemini, OpenRouter, Together, or OpenAI. Groq, Hugging Face, and Cloudflare are text-only.

---

## Test Your Providers

Run the health check to verify which providers are working:

```bash
cd ai-service && npm run test-providers
```

This tests each configured provider with a simple MCQ generation and reports which respond correctly.

---

## Detailed AI Flow

See [AI-FLOW.md](./AI-FLOW.md) for:

- Which models are used for each feature
- Request flow by user action
- Architecture and fallback behavior
