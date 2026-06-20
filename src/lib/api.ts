import { AppConfig, RatingResult } from '../types';
import { SYSTEM_PROMPT_QUICK, SYSTEM_PROMPT_FULL, USER_PROMPT_QUICK, USER_PROMPT_FULL } from './prompt';

const ANTHROPIC_VERSION = '2023-06-01';

export type Mode = 'quick' | 'full';

export type CallOptions = {
  config: AppConfig;
  imageBase64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  mode: Mode;
  signal?: AbortSignal;
};

function extractJson(text: string): RatingResult {
  let t = text.trim();
  // 去 markdown 代码块
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // 去 <think> 块
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // 再去一次 fence
  const fence2 = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence2) t = fence2[1].trim();

  // 抓第一个 { 并平衡配对
  const start = t.indexOf('{');
  if (start === -1) {
    throw new Error(`模型没有返回 JSON\n原文前 500 字：${t.slice(0, 500)}`);
  }
  let depth = 0, inString = false, escape = false, lastValidEnd = -1;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { lastValidEnd = i; break; }
    }
  }
  if (lastValidEnd === -1) {
    // 尝试修复被截断的 JSON (简单补齐括号)
    let healed = t.slice(start);
    if (inString) healed += '"';
    let tempDepth = depth;
    while (tempDepth > 0) {
      healed += '}';
      tempDepth--;
    }
    try {
      const parsed = JSON.parse(healed);
      return { ...parsed, raw: text, _healed: true } as RatingResult;
    } catch (e) {
      throw new Error(`JSON 未闭合且无法自动修复\n原文前 500 字：${t.slice(0, 500)}`);
    }
  }
  const candidate = t.slice(start, lastValidEnd + 1);

  try {
    const parsed = JSON.parse(candidate);
    return { ...parsed, raw: text } as RatingResult;
  } catch (e: any) {
    // 兜底：去尾部多余逗号 + 中文引号
    let fixed = candidate
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/[“”]/g, '\\"')
      .replace(/[‘’]/g, "'");
    try {
      const parsed = JSON.parse(fixed);
      return { ...parsed, raw: text } as RatingResult;
    } catch (e2: any) {
      throw new Error(
        `JSON 解析失败：${e2?.message ?? e2}\n截取 JSON 前 500 字：${candidate.slice(0, 500)}`,
      );
    }
  }
}

export async function rateOutfit({
  config,
  imageBase64,
  mediaType,
  mode,
  signal,
}: CallOptions): Promise<RatingResult> {
  if (!config.apiUrl) throw new Error('请先在设置里填 API URL');
  if (!config.apiKey) throw new Error('请先在设置里填 API Key');
  if (!config.model) throw new Error('请先在设置里填模型名');

  const url = config.apiUrl.replace(/\/+$/, '') + '/v1/messages';
  const isQuick = mode === 'quick';
  const body = {
    model: config.model,
    max_tokens: 8192,
    system: isQuick ? SYSTEM_PROMPT_QUICK : SYSTEM_PROMPT_FULL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: isQuick ? USER_PROMPT_QUICK : USER_PROMPT_FULL },
        ],
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`API 失败 ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? '';
  if (!text) throw new Error('模型没有返回内容');
  if (typeof globalThis !== 'undefined') (globalThis as any).__lastModelRaw = text;
  return extractJson(text);
}