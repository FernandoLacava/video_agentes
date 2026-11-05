#!/usr/bin/env node
// Barra de status: % do contexto usado, barrinha colorida e modelo em uso.
const fs = require("fs");
let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let j = {};
  try { j = JSON.parse(raw || "{}"); } catch {}
  const model = (j.model && (j.model.display_name || j.model.id)) || "?";
  const cw = j.context_window || {};
  let pct = typeof cw.used_percentage === "number" ? cw.used_percentage : null;
  const size = cw.context_window_size || 200000;

  const tokensFrom = (u) =>
    u ? (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) : null;

  if (pct === null && cw.current_usage) {
    const t = tokensFrom(cw.current_usage);
    if (t !== null) pct = (t / size) * 100;
  }
  if (pct === null && j.transcript_path) {
    try {
      const lines = fs.readFileSync(j.transcript_path, "utf8").trim().split("\n");
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const e = JSON.parse(lines[i]);
          const u = e.message && e.message.usage;
          if (u && !e.isSidechain) { pct = (tokensFrom(u) / size) * 100; break; }
        } catch {}
      }
    } catch {}
  }
  if (pct === null) pct = 0;
  pct = Math.max(0, Math.min(100, pct));

  const color = pct > 70 ? "\x1b[31m" : pct >= 50 ? "\x1b[33m" : "\x1b[32m";
  const reset = "\x1b[0m";
  const width = 10;
  const filled = Math.round((pct / 100) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const warn = pct > 70 ? ` ${"\x1b[1;31m"}COMPACTA${reset}` : "";
  process.stdout.write(`${color}${bar} ${Math.round(pct)}%${reset}${warn} | ${model}`);
});
