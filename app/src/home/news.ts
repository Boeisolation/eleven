import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { isRecord } from "../lib/guards";
import { supportPath } from "../lib/support";
import type { Page } from "../settings/pages";

/** The picture at the top of a card: logos (paths under assets), or a screenshot from assets/news. */
export type NewsArt =
  | { readonly kind: "logos"; readonly files: readonly string[] }
  | { readonly kind: "shot"; readonly file: string };

/** What the card's button does: open a Settings page, or nothing. */
export type NewsAction =
  | { readonly kind: "settings"; readonly label: string; readonly page: Page }
  | { readonly kind: "none" };

export type News = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly art: NewsArt;
  readonly action: NewsAction;
};

/** Newest first; the card opens on the first one. */
export const NEWS: readonly News[] = [
  {
    id: "ask-about-lines",
    title: "行级针对性提问",
    body: "在任何代码视图中点击行号，然后点击提问或解释。分析结果直接在行下方展开，并支持一键采纳重命名建议。",
    art: { kind: "shot", file: "ask.png" },
    action: { kind: "settings", label: "选择回答模型", page: "agents" },
  },
  {
    id: "source-files",
    title: "源码级还原重构",
    body: "应用构建所用的源文件均可作为标签页打开。您的智能体可以重构整个源文件，每个函数均与二进制代码精准关联。",
    art: { kind: "logos", files: ["icons/lang-swift.svg", "icons/lang-objc.svg", "icons/lang-java.svg", "icons/lang-kotlin.svg"] },
    action: { kind: "none" },
  },
  {
    id: "android-apps",
    title: "完整安卓应用逆向",
    body: "支持直接打开 APK，解析 smali、资源文件与字符串表。支持 .xapk 与 .apks 分包应用无缝合并查看。",
    art: { kind: "logos", files: ["formats/android.svg"] },
    action: { kind: "none" },
  },
  {
    id: "binary-diffs",
    title: "双版本二进制差异对比",
    body: "在 ⌘K 中选择与另一二进制对比，直观查看新增、删除或变动的函数，如代码审查般清晰。",
    art: { kind: "logos", files: ["icons/binary.svg", "icons/split.svg"] },
    action: { kind: "none" },
  },
  {
    id: "gpu-kernels",
    title: "CUDA 与 HIP 内核分析",
    body: "高亮阅读 PTX 汇编并在关键部分旁批注，或让智能体将内核重写为 CUDA C++、HIP 或 Metal 着色器。",
    art: { kind: "logos", files: ["formats/nvidia.svg", "formats/amd.svg"] },
    action: { kind: "none" },
  },
  {
    id: "model-files",
    title: "解析机器学习模型",
    body: "直接在工作台中打开 GGUF、ONNX、PyTorch、safetensors 与 Core ML 模型，网络层与张量结构尽收眼底。",
    art: { kind: "logos", files: ["formats/llama-cpp.svg", "formats/onnx.svg", "formats/pytorch.svg", "formats/huggingface.svg"] },
    action: { kind: "none" },
  },
  {
    id: "window-glass",
    title: "窗口磨砂与透明度调节",
    body: "自由调节窗口的桌面透光度与背景模糊度。调至最低即可切换为超流畅的高性能纯色模式。",
    art: { kind: "shot", file: "glass.png" },
    action: { kind: "settings", label: "调整窗口样式", page: "appearance" },
  },
];

export const LATEST_NEWS: News = NEWS[0] ?? {
  id: "none",
  title: "",
  body: "",
  art: { kind: "logos", files: [] },
  action: { kind: "none" },
};

function dismissed(): readonly string[] {
  try {
    const json: unknown = JSON.parse(readFileSync(supportPath("news.json"), "utf8"));
    if (!isRecord(json) || !Array.isArray(json.dismissed)) return [];
    return json.dismissed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function isNewsDismissed(id: string): boolean {
  return dismissed().includes(id);
}

export function dismissNews(id: string): void {
  try {
    const file = supportPath("news.json");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify({ dismissed: [...dismissed().filter((seen) => seen !== id), id] }, null, 2)}\n`);
  } catch {
    return;
  }
}
