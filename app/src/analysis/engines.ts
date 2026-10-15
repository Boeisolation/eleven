import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";

import { supportPath } from "../lib/support";
import { currentSettings } from "../settings/store";

export type ProviderId = "ghidra" | "hopper" | "ida";

export type EngineId = ProviderId | "rizin" | "r2ghidra" | "libghidra" | "ghidra-rs" | "ghidrust" | "sleigh";

export type EngineStatus = "ready" | "experimental";

/** How Eleven reads a binary with this engine: through REA's providers, or the native rizin backend. */
export type BackendId = "rea" | "rizin";

export type Engine = {
  readonly id: EngineId;
  readonly name: string;
  readonly blurb: string;
  readonly repo: string;
  /** ready = Eleven can read with it today; experimental = installable, not wired yet. */
  readonly status: EngineStatus;
  readonly backend: BackendId;
  /** The REA provider this maps to (REA backend only), else null. */
  readonly provider: ProviderId | null;
  readonly getHint: string;
  readonly installed: () => boolean;
};

function hopperInstalled(): boolean {
  const chosen = currentSettings().hopperPath;
  if (chosen) return existsSync(chosen);
  return [join(homedir(), "Applications"), "/Applications"].some((dir) => existsSync(join(dir, "Hopper Disassembler.app", "Contents", "MacOS", "hopper")));
}

function rizinInstalled(): boolean {
  const chosen = currentSettings().rizinPath || process.env.ELEVEN_RIZIN;
  return chosen ? existsSync(chosen) : onPath("rizin");
}

function onPath(bin: string): boolean {
  const dirs = (process.env.PATH ?? "").split(delimiter).concat("/opt/homebrew/bin", "/usr/local/bin");
  return dirs.some((dir) => dir && existsSync(join(dir, bin)));
}

/** The engine store: backends Eleven can read binaries with. Each is a separate download; turn the ones you want on. */
export const ENGINES: readonly Engine[] = [
  { id: "ghidra", name: "Ghidra", blurb: "开源、全架构、深度反编译器。运行在 JVM 之上，反编译分析深度最强。", repo: "https://ghidra-sre.org", status: "ready", backend: "rea", provider: "ghidra", getHint: "下载 Ghidra 并将 GHIDRA_INSTALL_DIR 指向其目录。", installed: () => !!process.env.GHIDRA_INSTALL_DIR && existsSync(process.env.GHIDRA_INSTALL_DIR) },
  { id: "rizin", name: "Rizin", blurb: "原生轻量架构，无需 JVM。一秒内极速打开：函数、字符串、段、字节码与反汇编。", repo: "https://rizin.re", status: "ready", backend: "rizin", provider: null, getHint: "Eleven 已内置轻量 Rizin 引擎。", installed: rizinInstalled },
  { id: "hopper", name: "Hopper", blurb: "macOS 原生逆向利器，分析 Mach-O 文件极其迅速。", repo: "https://www.hopperapp.com", status: "ready", backend: "rea", provider: "hopper", getHint: "安装 Hopper Disassembler 到 Applications。", installed: hopperInstalled },
  { id: "ida", name: "IDA", blurb: "逆向工程业界标杆，提供顶级的深度分析能力。需提供许可证。", repo: "https://hex-rays.com/ida-pro", status: "ready", backend: "rea", provider: "ida", getHint: "将 REA_IDA_MCP_CONFIG 指向您的 IDA MCP 注册配置。", installed: () => !!process.env.REA_IDA_MCP_CONFIG || (!!currentSettings().idaPath && existsSync(currentSettings().idaPath)) },
  { id: "r2ghidra", name: "r2ghidra", blurb: "为 Rizin 补充 Ghidra 原生反编译器 (pdg)，无需 JVM 即可获得高质量伪代码。", repo: "https://github.com/rizinorg/rz-ghidra", status: "experimental", backend: "rizin", provider: null, getHint: "从 rizinorg tap 编译 rz-ghidra。", installed: () => false },
  { id: "libghidra", name: "libghidra", blurb: "原生嵌入 Ghidra 的 SLEIGH 和反编译器。无 Java，无网络依赖。", repo: "https://github.com/0xeb/libghidra", status: "experimental", backend: "rizin", provider: null, getHint: "从源码编译 libghidra。", installed: () => false },
  { id: "ghidra-rs", name: "Ghidra (Rust 移植版)", blurb: "koute 纯 Rust 移植的 Ghidra 反编译器。", repo: "https://github.com/koute/ghidra-decompiler", status: "experimental", backend: "rizin", provider: null, getHint: "克隆并通过 cargo build 编译。", installed: () => false },
  { id: "ghidrust", name: "Ghidrust", blurb: "从零构建的 Rust 逆向引擎：IR 到 SSA 到类型化 C，无需 JVM。", repo: "https://github.com/oofz/Ghidrust", status: "experimental", backend: "rizin", provider: null, getHint: "克隆并通过 cargo build 编译 Ghidrust。", installed: () => false },
  { id: "sleigh", name: "SLEIGH (Rust)", blurb: "通过 jingle_sleigh/libsla 实现的 Rust 版 SLEIGH：反汇编与 P-code。", repo: "https://crates.io/crates/jingle_sleigh", status: "experimental", backend: "rizin", provider: null, getHint: "cargo add jingle_sleigh 或 libsla。", installed: () => false },
];

const ENGINE_IDS = new Set<string>(ENGINES.map((e) => e.id));

function enabledFile(): string {
  return supportPath("engines-enabled.json");
}

function defaultEnabled(): readonly EngineId[] {
  return ENGINES.filter((e) => e.status === "ready" && e.installed()).map((e) => e.id);
}

/** The engines the user has turned on. Defaults to every installed, ready engine until they choose. */
export function enabledEngines(): ReadonlySet<EngineId> {
  try {
    const saved: unknown = JSON.parse(readFileSync(enabledFile(), "utf8"));
    if (Array.isArray(saved)) return new Set(saved.filter((id): id is EngineId => typeof id === "string" && ENGINE_IDS.has(id)));
  } catch {
    // nothing saved yet
  }
  return new Set(defaultEnabled());
}

export function isEnabled(id: EngineId): boolean {
  return enabledEngines().has(id);
}

export function setEnabled(id: EngineId, on: boolean): void {
  const next = new Set(enabledEngines());
  if (on) next.add(id);
  else next.delete(id);
  mkdirSync(dirname(enabledFile()), { recursive: true });
  writeFileSync(enabledFile(), `${JSON.stringify([...next])}\n`);
}

function preferredFile(): string {
  return supportPath("engine-preferred.json");
}

function preferredEngine(): EngineId | null {
  try {
    const saved: unknown = JSON.parse(readFileSync(preferredFile(), "utf8"));
    return typeof saved === "string" && ENGINE_IDS.has(saved) ? ENGINES.find((e) => e.id === saved)?.id ?? null : null;
  } catch {
    return null;
  }
}

const engineListeners = new Set<() => void>();

/** Makes an engine the one Eleven reads with, turning it on, and tells open views to re-read. */
export function chooseEngine(id: EngineId): void {
  setEnabled(id, true);
  mkdirSync(dirname(preferredFile()), { recursive: true });
  writeFileSync(preferredFile(), `${JSON.stringify(id)}\n`);
  for (const listener of engineListeners) listener();
}

/** An engine Eleven just downloaded: turn it on and let open views read with it, unless you picked one yourself. */
export function engineArrived(id: EngineId): void {
  setEnabled(id, true);
  if (preferredEngine() !== null) return;
  for (const listener of engineListeners) listener();
}

export function onEngineChange(listener: () => void): () => void {
  engineListeners.add(listener);
  return () => {
    engineListeners.delete(listener);
  };
}

/** The engine Eleven reads with right now: the one you chose if it's usable, else the first turned-on, ready, installed one. */
export function activeEngine(): Engine | null {
  const on = enabledEngines();
  const usable = (e: Engine): boolean => e.status === "ready" && e.installed() && on.has(e.id);
  const chosen = ENGINES.find((e) => e.id === preferredEngine());
  return chosen && usable(chosen) ? chosen : (ENGINES.find(usable) ?? null);
}

export function activeProvider(): ProviderId | null {
  return activeEngine()?.provider ?? null;
}

export function activeBackend(): BackendId | null {
  return activeEngine()?.backend ?? null;
}
