import { existsSync, readFileSync } from "node:fs";
import { supportPath } from "../lib/support";
import { translatePattern, ZH_DICTIONARY } from "./zh";

let userDict: Record<string, string> = {};

function loadUserDictionary(): void {
  try {
    const customPath = supportPath("locales", "zh-CN.json");
    if (existsSync(customPath)) {
      const parsed = JSON.parse(readFileSync(customPath, "utf8"));
      if (typeof parsed === "object" && parsed !== null) {
        userDict = parsed as Record<string, string>;
      }
    }
  } catch {
    // Ignore invalid JSON in user custom dictionary
  }
}

loadUserDictionary();

/**
 * 翻译给定文本为简体中文。
 * 1. 优先使用用户自定义字典 (~/Library/Application Support/Eleven/locales/zh-CN.json)
 * 2. 其次匹配内置全量字典
 * 3. 匹配常见动态正则模板
 * 4. 兜底返回原英文
 */
export function t(text: string, fallback?: string): string {
  if (!text) return text;
  if (userDict[text]) return userDict[text];
  if (ZH_DICTIONARY[text]) return ZH_DICTIONARY[text];

  const patterned = translatePattern(text);
  if (patterned !== null) return patterned;

  return fallback ?? text;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function tAgo(at: number, now: number): string {
  const gap = Math.max(0, now - at);
  if (gap < MINUTE) return "刚刚";
  if (gap < HOUR) return `${Math.floor(gap / MINUTE)} 分钟前`;
  if (gap < DAY) return `${Math.floor(gap / HOUR)} 小时前`;
  if (gap < 2 * DAY) return "昨天";
  if (gap < 7 * DAY) return `${Math.floor(gap / DAY)} 天前`;
  if (gap < 14 * DAY) return "上周";
  return `${Math.floor(gap / (7 * DAY))} 周前`;
}

export function tShortAgo(at: number, now: number): string {
  const gap = Math.max(0, now - at);
  if (gap < MINUTE) return "刚刚";
  if (gap < HOUR) return `${Math.floor(gap / MINUTE)}分`;
  if (gap < DAY) return `${Math.floor(gap / HOUR)}时`;
  if (gap < 7 * DAY) return `${Math.floor(gap / DAY)}天`;
  return `${Math.floor(gap / (7 * DAY))}周`;
}
