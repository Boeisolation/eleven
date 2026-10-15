import type { ReactElement } from "react";

import { activeEngine } from "../analysis/engines";
import { Tooltip } from "../components/kit";
import { explainArch } from "../lib/explain";
import { useLoaded } from "../lib/useLoaded";
import { useTheme } from "../theme";
import { Dot, Icon, Spacer } from "../components/ui";
import { fileOffset } from "./patch";
import { HOVER, isGpuBench, isModelBench, MONO_STYLE, useBench } from "./parts";
import { currentAddr, placeIn } from "./where";

function analysis(total: number, opening: boolean): string {
  if (opening) return "正在分析…";
  return total === 1 ? "已完成分析，共 1 个函数" : `已完成分析，共 ${total.toLocaleString("zh-CN")} 个函数`;
}

/** The status bar: analysis state, engine and arch, then exactly where you are and the details toggle. */
/** A model has no engine or addresses: just what was read from its headers. */
function ModelStatus(): ReactElement {
  const { p } = useTheme();
  const { gpuData } = useBench();
  const model = gpuData.kind === "ready" ? gpuData.value.models[0] : undefined;
  const read = gpuData.kind === "loading" ? "正在读取文件头…" : model ? `已读取文件头，共 ${model.tensors.length.toLocaleString("zh-CN")} 个张量` : "Eleven 暂不支持解析此类模型";
  return (
    <div role="contentinfo" aria-label="状态" style={{ display: "flex", alignItems: "center", gap: 14, height: 28, flexShrink: 0, paddingLeft: 10, paddingRight: 10, borderTopWidth: 1, borderColor: p.fill, fontSize: 11.5, color: p.muted, whiteSpace: "nowrap", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Dot color={gpuData.kind === "loading" ? p.data : p.string} size={6} />
        <div>{read}</div>
      </div>
      {model && <div>{model.format.split(" · ")[0] ?? model.format}</div>}
      <Spacer />
      <div>未加载或执行外部代码</div>
    </div>
  );
}

/** Shader and kernel files: how many functions were read, and from which GPU APIs. */
function GpuStatus(): ReactElement {
  const { p } = useTheme();
  const { gpuData } = useBench();
  const libraries = gpuData.kind === "ready" ? gpuData.value.libraries : [];
  const count = libraries.reduce((sum, lib) => sum + lib.functions.length, 0);
  const read = gpuData.kind === "loading" ? "正在读取 GPU 代码…" : libraries.length > 0 ? `已解析 ${count.toLocaleString("zh-CN")} 个内核` : "此文件中无 Eleven 可读取的 GPU 代码";
  return (
    <div role="contentinfo" aria-label="状态" style={{ display: "flex", alignItems: "center", gap: 14, height: 28, flexShrink: 0, paddingLeft: 10, paddingRight: 10, borderTopWidth: 1, borderColor: p.fill, fontSize: 11.5, color: p.muted, whiteSpace: "nowrap", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Dot color={gpuData.kind === "loading" ? p.data : p.string} size={6} />
        <div>{read}</div>
      </div>
      {libraries.map((lib) => <div key={lib.name}>{lib.api === "cuda" ? "CUDA" : lib.api === "hip" ? "HIP" : "Metal"}</div>)}
      <Spacer />
      <div>未执行任何指令</div>
    </div>
  );
}

export function StatusBar(): ReactElement {
  const bench = useBench();
  if (isModelBench(bench)) return <ModelStatus />;
  return isGpuBench(bench) ? <GpuStatus /> : <CodeStatus />;
}

function CodeStatus(): ReactElement {
  const { p } = useTheme();
  const bench = useBench();
  const { wb, focusAddr, program, nameOf } = bench;
  const at = currentAddr(bench);
  const opening = program.id === "";
  const offset = useLoaded<number | null>(() => (program.dossier ? fileOffset(program.path, at) : Promise.resolve(null)), `${program.path}:${at}:offset`);
  return (
    <div role="contentinfo" aria-label="状态" style={{ display: "flex", alignItems: "center", gap: 14, height: 28, flexShrink: 0, paddingLeft: 10, paddingRight: 10, borderTopWidth: 1, borderColor: p.fill, fontSize: 11.5, color: p.muted, whiteSpace: "nowrap", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Dot color={opening ? p.data : p.string} size={6} />
        <div>{analysis(program.total || program.functions.length, opening)}</div>
      </div>
      <Tooltip label="将机器码解析为结构化语义代码的后端反编译分析引擎" side="top">
        <div>{activeEngine()?.name ?? "未检测到引擎"}</div>
      </Tooltip>
      <Tooltip label={explainArch(program.arch)} side="top">
        <div>{program.arch}</div>
      </Tooltip>
      <Spacer />
      <div style={MONO_STYLE}>{placeIn(nameOf(focusAddr), focusAddr, at)}</div>
      <div style={MONO_STYLE}>{at}</div>
      {offset.kind === "ready" && offset.value !== null && <div style={MONO_STYLE}>{`文件偏移 0x${offset.value.toString(16)}`}</div>}
      <div onClick={() => wb.patch({ bottomOpen: !wb.s.bottomOpen })} role="button" aria-label="切换详情面板" aria-selected={wb.s.bottomOpen} style={{ display: "flex", alignItems: "center", cursor: "pointer", hover: HOVER }}>
        <Icon name="panel" size={14} color={wb.s.bottomOpen ? p.text : p.faint} on={wb.s.bottomOpen} />
      </div>
    </div>
  );
}
