import { NextResponse } from "next/server";

const PICKAXE_API_URL = "https://api.pickaxe.co/v1/completions";
const PICKAXE_TIMEOUT_MS = 90000;

type PickaxeRequestPayload = {
  message?: string;
  userId?: string;
  conversationId?: string;
  imageUrls?: string[];
  stream?: boolean;
};

type MarineResponse = {
  summary: string;
  window: string;
  risk: string;
  why: string;
  confidence: string;
};

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildPrompt(message: string) {
  return [
    "You are WaveWatch, a marine conditions assistant.",
    "Answer the user's query as raw JSON only with exactly these string keys:",
    'summary, window, risk, why, confidence.',
    "Do not wrap the JSON in markdown fences.",
    "Keep each value concise and operationally useful.",
    `Query: ${message}`,
  ].join("\n");
}

function buildFallbackResponse(summary: string, why: string): MarineResponse {
  return {
    summary,
    window: "Unavailable",
    risk: "Unavailable",
    why,
    confidence: "Unknown",
  };
}

function extractResultText(data: Record<string, unknown>) {
  const candidates = [data.result, data.response, data.message];
  const textCandidate = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  );

  if (typeof textCandidate === "string") {
    return textCandidate.trim();
  }

  return JSON.stringify(data);
}

function parseStructuredResponse(resultText: string): MarineResponse {
  const candidates = [
    resultText.trim(),
    resultText.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim(),
    resultText.match(/\{[\s\S]*\}/)?.[0]?.trim(),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<MarineResponse>;
      return {
        summary: asString(parsed.summary, "No summary returned."),
        window: asString(parsed.window, "Unavailable"),
        risk: asString(parsed.risk, "Unavailable"),
        why: asString(parsed.why, "No reasoning returned."),
        confidence: asString(parsed.confidence, "Unknown"),
      };
    } catch {
      continue;
    }
  }

  return buildFallbackResponse(
    resultText || "No response returned.",
    "Pickaxe returned a non-JSON response.",
  );
}

function elapsedMs(startTime: number) {
  return `${Math.round(performance.now() - startTime)}ms`;
}

export async function POST(request: Request) {
  const requestId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const requestStart = performance.now();
  const deploymentToken = process.env.PICKAXE_DEPLOYMENT_TOKEN;

  if (!deploymentToken) {
    console.error(`[pickaxe:${requestId}] missing deployment token`);
    return NextResponse.json(
      { error: "Missing PICKAXE_DEPLOYMENT_TOKEN." },
      { status: 500 },
    );
  }

  let payload: PickaxeRequestPayload;

  try {
    payload = (await request.json()) as PickaxeRequestPayload;
  } catch {
    console.error(`[pickaxe:${requestId}] invalid json body`);
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = payload.message?.trim();

  if (!message) {
    console.error(`[pickaxe:${requestId}] missing message`);
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  console.info(
    `[pickaxe:${requestId}] start total=${elapsedMs(requestStart)} messageLength=${message.length} hasUserId=${Boolean(payload.userId)} hasConversationId=${Boolean(payload.conversationId)} hasImages=${Boolean(payload.imageUrls?.length)}`,
  );

  try {
    const upstreamSignal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(PICKAXE_TIMEOUT_MS),
    ]);
    const upstreamStart = performance.now();

    console.info(
      `[pickaxe:${requestId}] upstream fetch start total=${elapsedMs(requestStart)}`,
    );

    const upstreamResponse = await fetch(PICKAXE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deploymentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: buildPrompt(message),
        userId: payload.userId,
        conversationId: payload.conversationId,
        imageUrls: payload.imageUrls,
        stream: payload.stream ?? false,
      }),
      cache: "no-store",
      signal: upstreamSignal,
    });

    console.info(
      `[pickaxe:${requestId}] upstream headers received total=${elapsedMs(requestStart)} fetch=${elapsedMs(upstreamStart)} status=${upstreamResponse.status} contentType=${upstreamResponse.headers.get("content-type") ?? "unknown"}`,
    );

    const bodyStart = performance.now();
    const rawText = await upstreamResponse.text();

    console.info(
      `[pickaxe:${requestId}] upstream body received total=${elapsedMs(requestStart)} body=${elapsedMs(bodyStart)} bytes=${rawText.length}`,
    );

    let rawData: Record<string, unknown>;

    try {
      rawData = JSON.parse(rawText) as Record<string, unknown>;
    } catch (error) {
      console.error(
        `[pickaxe:${requestId}] upstream json parse failed total=${elapsedMs(requestStart)} bodyPreview=${JSON.stringify(rawText.slice(0, 300))} error=${error instanceof Error ? error.message : "unknown"}`,
      );

      return NextResponse.json(
        {
          error: "Pickaxe returned invalid JSON.",
          bodyPreview: rawText.slice(0, 300),
        },
        { status: 502 },
      );
    }

    if (!upstreamResponse.ok) {
      console.error(
        `[pickaxe:${requestId}] upstream non-200 total=${elapsedMs(requestStart)} status=${upstreamResponse.status} error=${asString(rawData.error, "Pickaxe request failed.")}`,
      );

      return NextResponse.json(
        {
          error: asString(rawData.error, "Pickaxe request failed."),
          details: rawData,
        },
        { status: upstreamResponse.status },
      );
    }

    const resultText = extractResultText(rawData);
    const structured = parseStructuredResponse(resultText);

    console.info(
      `[pickaxe:${requestId}] success total=${elapsedMs(requestStart)} resultLength=${resultText.length} structuredSummaryLength=${structured.summary.length}`,
    );

    return NextResponse.json({
      structured,
      raw: rawData,
    });
  } catch (error) {
    if (request.signal.aborted) {
      console.warn(
        `[pickaxe:${requestId}] client aborted total=${elapsedMs(requestStart)}`,
      );

      return NextResponse.json(
        { error: "Client request was aborted." },
        { status: 499 },
      );
    }

    if (error instanceof Error && error.name === "TimeoutError") {
      console.error(
        `[pickaxe:${requestId}] upstream timeout total=${elapsedMs(requestStart)} limit=${PICKAXE_TIMEOUT_MS}ms`,
      );

      return NextResponse.json(
        {
          error: `Pickaxe timed out after ${PICKAXE_TIMEOUT_MS / 1000}s.`,
        },
        { status: 504 },
      );
    }

    console.error(
      `[pickaxe:${requestId}] upstream failure total=${elapsedMs(requestStart)} error=${error instanceof Error ? `${error.name}: ${error.message}` : "unknown"}`,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to reach Pickaxe.",
      },
      { status: 502 },
    );
  }
}
