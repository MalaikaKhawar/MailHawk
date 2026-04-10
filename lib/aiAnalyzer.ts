import OpenAI from "openai";
import type { AnalysisResult, AIVerdict } from "@/types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

const SYSTEM_PROMPT = `You are MailHawk, an expert email forensics analyst and cybersecurity investigator with 20 years of experience. You analyze email header data and provide clear, accurate, actionable forensic verdicts. You explain complex technical findings in plain English that non-technical users can understand. Always respond with valid JSON only. No markdown. No explanation outside the JSON structure.`;

const FALLBACK_VERDICT: AIVerdict = {
  verdict: "SUSPICIOUS",
  confidence: 50,
  phishingProbability: 50,
  oneLinerVerdict: "AI analysis unavailable — manual review recommended.",
  summary: "The AI forensic analysis could not be completed. Please review the header fields, SPF/DKIM/DMARC results, and relay hops manually using the data provided below.",
  redFlags: [],
  trustIndicators: [],
  recommendations: [
    { action: "Check SPF, DKIM, and DMARC results manually", priority: "HIGH" },
    { action: "Verify the sending domain is legitimate", priority: "HIGH" },
    { action: "Do not click any links in the email until verified", priority: "URGENT" },
  ],
  technicalBreakdown: {
    spfAnalysis: "AI unavailable",
    dkimAnalysis: "AI unavailable",
    dmarcAnalysis: "AI unavailable",
    routingAnalysis: "AI unavailable",
    ipAnalysis: "AI unavailable",
  },
};

export async function runAIAnalysis(
  data: Omit<AnalysisResult, "aiVerdict" | "analyzedAt">
): Promise<AIVerdict> {

  // Strip rawHeader from the payload to avoid token bloat (it can be huge)
  const { parsedHeader, ...rest } = data;
  const { rawHeader: _raw, ...headerWithoutRaw } = parsedHeader;
  const trimmedData = { parsedHeader: headerWithoutRaw, ...rest };

  const userPrompt = `Analyze this email header forensic report and respond ONLY with valid JSON matching this exact structure (no markdown, no explanation outside JSON):
{
  "verdict": "SAFE" | "SUSPICIOUS" | "SPOOFED",
  "confidence": <number 0-100>,
  "phishingProbability": <number 0-100>,
  "oneLinerVerdict": "<one sentence plain English summary>",
  "summary": "<2-3 paragraph detailed explanation>",
  "redFlags": [
    { "flag": "<flag name>", "severity": "HIGH"|"MEDIUM"|"LOW", "explanation": "<why this is suspicious>" }
  ],
  "trustIndicators": ["<things that seem legitimate>"],
  "recommendations": [
    { "action": "<what to do>", "priority": "URGENT"|"HIGH"|"LOW" }
  ],
  "technicalBreakdown": {
    "spfAnalysis": "<detailed SPF explanation>",
    "dkimAnalysis": "<detailed DKIM explanation>",
    "dmarcAnalysis": "<detailed DMARC explanation>",
    "routingAnalysis": "<relay path analysis>",
    "ipAnalysis": "<IP reputation analysis>"
  }
}

Email forensic data:
${JSON.stringify(trimmedData, null, 2)}`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      // Note: response_format omitted — not all Groq models support json_object mode reliably.
      // The system prompt + user prompt explicitly instruct JSON-only output.
    });

    const raw = completion.choices[0]?.message?.content || "";
    if (!raw) throw new Error("Empty response from AI model");

    // Extract JSON — handle cases where the model wraps output in markdown code fences
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/({[\s\S]*})/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : raw;

    const parsed = JSON.parse(jsonStr.trim()) as AIVerdict;
    return parsed;
  } catch (err) {
    console.error("[runAIAnalysis] AI Analysis Error:", err instanceof Error ? err.message : err);
    return FALLBACK_VERDICT;
  }
}

export async function createChatCompletion(
  messages: { role: "user" | "assistant"; content: string }[],
  context: string
): Promise<ReadableStream<Uint8Array>> {
  const systemMsg = `You are MailHawk, an expert email forensics analyst helping a user understand the analysis of an email header. 
Here are your rules:
1. Reply concisely and strictly to the point using a single short paragraph unless lists are absolutely necessary.
2. Provide the highest possible level of logical reasoning.
3. Use Markdown formatting for your responses.
4. Do not provide unnecessary or overly long explanations.
Here is the email forensic context:\n\n${context}`;

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemMsg },
      ...messages,
    ],
    temperature: 0.4,
    max_tokens: 800,
    stream: true,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}
