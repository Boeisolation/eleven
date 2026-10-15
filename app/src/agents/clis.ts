/** The agent's own command-line tool, for the agents that ship one. Eleven runs these through their ACP adapter. */
export const AGENT_CLI: Readonly<Record<string, string>> = {
  "claude-acp": "claude",
  "codex-acp": "codex",
  "grok-build": "grok",
  "antigravity-acp": "agy",
  gemini: "gemini",
  opencode: "opencode",
  goose: "goose",
  cursor: "cursor",
  "crow-cli": "crow",
  cline: "cline",
};
