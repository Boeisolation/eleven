import type { ReactElement, ReactNode } from "react";

import { useTheme } from "../theme";
import { appIcon, Icon, Row } from "../components/ui";
import { t } from "../i18n";

function suggestions(file: string | null, model: boolean): readonly { readonly kind: string; readonly icon: string; readonly text: string; readonly ask: string }[] {
  const binary = file ?? "/bin/ls";
  const first = model && file
    ? { kind: t("Model"), icon: "model", text: t(`What is in ${file}, and is it safe to load?`, `${file} 中包含什么内容，加载它是否安全？`), ask: t(`What is in ${file}, and is it safe to load?`, `${file} 中包含什么内容，加载它是否安全？`) }
    : { kind: t("Binary"), icon: "binary", text: t(`What does ${binary} do when it starts?`, `${binary} 启动时执行了什么操作？`), ask: t(`What does ${binary} do when it starts, and where does it print its usage?`, `${binary} 启动时执行了什么操作，它在何处打印用法说明？`) };
  return [
    first,
    { kind: t("App"), icon: "app", text: t("How does Notes save attachments?"), ask: t("How does Notes save attachments?") },
    ...(model ? [{ kind: t("Binary"), icon: "binary", text: t("What does /bin/ls do when it starts?"), ask: t("What does /bin/ls do when it starts, and where does it print its usage?") }] : [{ kind: t("Model"), icon: "model", text: t("Is this .pt file safe to load?"), ask: t("Is this .pt file safe to load?") }]),
    { kind: t("Shader"), icon: "gpu", text: t("Why is this blur shader slow?"), ask: t("Why is this blur shader slow?") },
  ];
}

function Suggestion({ kind, icon, text, ask, onPick }: {
  readonly kind: string;
  readonly icon: string;
  readonly text: string;
  readonly ask: string;
  readonly onPick: (text: string) => void;
}): ReactElement {
  const { p } = useTheme();
  return (
    <div onClick={() => onPick(ask)} style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14, borderWidth: 1, borderColor: p.fill2, borderRadius: 14, cursor: "pointer", hover: { opacity: 0.72 } }}>
      <Row gap={6} style={{ fontSize: 11.5, color: p.muted }}>
        <Icon name={icon} size={14} />
        <div>{kind}</div>
      </Row>
      <div style={{ color: p.text }}>{text}</div>
    </div>
  );
}

/** The first screen: one question, one composer, four ways in. */
export function Landing({ composer, file, model = false, onSuggest, showSuggestions = true }: { readonly composer: ReactNode; readonly file: string | null; readonly model?: boolean; readonly onSuggest: (text: string) => void; readonly showSuggestions?: boolean }): ReactElement {
  const { p } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, alignItems: "center", justifyContent: "center", paddingTop: 32, paddingLeft: 24, paddingRight: 24, paddingBottom: 64 }}>
      <img src={appIcon(p.icon)} style={{ width: 56, height: 56, marginBottom: 14 }} />
      <div style={{ fontSize: 28, fontWeight: 500, marginBottom: 22, color: p.text }}>{t("What should we take apart?")}</div>
      {composer}
      {showSuggestions && (
        <div style={{ display: "grid", gridTemplateColumns: 2, gap: 10, marginTop: 16, width: "100%", maxWidth: 700 }}>
          {suggestions(file, model).map((s) => (
            <Suggestion key={s.kind} kind={s.kind} icon={s.icon} text={s.text} ask={s.ask} onPick={onSuggest} />
          ))}
        </div>
      )}
    </div>
  );
}
