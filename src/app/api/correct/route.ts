import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getOpenAIClient } from '@/lib/openai';

const BYO_KEY_PATTERN = /^sk-[A-Za-z0-9\-_]{20,}$/;

/**
 * Second-pass grammar check for a single user turn (design doc 1a —
 * "corrections arrive as quiet chips"). Returns a gentle rewrite, or
 * `null` when the sentence is already natural. Not rate-limited and not
 * counted toward the daily message allowance.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ correction: null });
  }

  const { text, targetLanguage, apiKey } = (body ?? {}) as Record<string, unknown>;
  if (typeof text !== 'string' || !text.trim() || text.length > 1000) {
    return Response.json({ correction: null });
  }

  const language =
    typeof targetLanguage === 'string' && targetLanguage.trim() ? targetLanguage : 'English';

  let client: OpenAI;
  if (typeof apiKey === 'string' && apiKey !== '' && BYO_KEY_PATTERN.test(apiKey)) {
    client = new OpenAI({ apiKey });
  } else {
    try {
      client = getOpenAIClient();
    } catch {
      return Response.json({ correction: null });
    }
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CORRECTION_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      max_tokens: 120,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a ${language} proofreader. The user sends one sentence they said while practising ${language}. If it has a grammar or word-choice mistake, reply with JSON {"correction": "<the corrected sentence>", "explanation": "<why, in at most 12 words>"}. If it is already natural and correct, reply with JSON {"correction": null}. Only fix real errors — do not rephrase for style. Keep the user's meaning and tone.`,
        },
        { role: 'user', content: text.trim() },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as { correction?: unknown; explanation?: unknown };
    const correction =
      typeof parsed.correction === 'string' && parsed.correction.trim() && parsed.correction.trim() !== text.trim()
        ? parsed.correction.trim()
        : null;
    const explanation =
      correction && typeof parsed.explanation === 'string' && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : null;
    return Response.json({ correction, explanation });
  } catch {
    return Response.json({ correction: null });
  }
}
