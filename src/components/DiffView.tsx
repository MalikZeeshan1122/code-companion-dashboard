import { cn } from "@/lib/utils";

// Lightweight syntax highlighter for TS/JS — keyword/string/comment/number/fn
function highlight(line: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  const regex =
    /(\/\/.*$)|(["'`])((?:\\.|(?!\2).)*)\2|\b(import|from|export|const|let|var|function|return|if|else|async|await|new|class|interface|type|extends|implements|public|private|protected|static|of|in|for|while|do|switch|case|break|continue|default|null|undefined|true|false|throw|try|catch|finally)\b|\b([A-Za-z_$][\w$]*)(?=\()|\b(\d+(?:\.\d+)?)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) tokens.push(line.slice(last, m.index));
    if (m[1]) tokens.push(<span key={i++} className="text-[color:var(--syntax-comment)] italic">{m[1]}</span>);
    else if (m[2]) tokens.push(<span key={i++} className="text-[color:var(--syntax-string)]">{m[0]}</span>);
    else if (m[4]) tokens.push(<span key={i++} className="text-[color:var(--syntax-keyword)]">{m[4]}</span>);
    else if (m[5]) tokens.push(<span key={i++} className="text-[color:var(--syntax-fn)]">{m[5]}</span>);
    else if (m[6]) tokens.push(<span key={i++} className="text-[color:var(--syntax-num)]">{m[6]}</span>);
    last = m.index + m[0].length;
  }
  if (last < line.length) tokens.push(line.slice(last));
  return tokens.length ? tokens : line || " ";
}

function diffLines(before: string, after: string) {
  const a = before.split("\n");
  const b = after.split("\n");
  const setA = new Set(a);
  const setB = new Set(b);
  const out: { kind: "ctx" | "add" | "del"; text: string; ln?: number; rn?: number }[] = [];
  let i = 0, j = 0, ln = 1, rn = 1;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push({ kind: "ctx", text: a[i], ln: ln++, rn: rn++ }); i++; j++;
    } else if (j < b.length && !setA.has(b[j])) {
      out.push({ kind: "add", text: b[j], rn: rn++ }); j++;
    } else if (i < a.length && !setB.has(a[i])) {
      out.push({ kind: "del", text: a[i], ln: ln++ }); i++;
    } else if (i < a.length) {
      out.push({ kind: "del", text: a[i], ln: ln++ }); i++;
    } else if (j < b.length) {
      out.push({ kind: "add", text: b[j], rn: rn++ }); j++;
    }
  }
  return out;
}

export function DiffView({ before, after, split = false }: { before: string; after: string; split?: boolean }) {
  if (split) {
    const a = before.split("\n");
    const b = after.split("\n");
    const max = Math.max(a.length, b.length);
    return (
      <div className="grid grid-cols-2 text-xs mono overflow-x-auto">
        <div className="border-r border-border">
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-card">Before</div>
          {Array.from({ length: max }).map((_, k) => (
            <div key={k} className={cn("flex", a[k] === undefined && "opacity-30")}>
              <span className="w-10 shrink-0 select-none px-2 text-right text-muted-foreground/50 border-r border-border">{a[k] !== undefined ? k + 1 : ""}</span>
              <span className="px-2 whitespace-pre">{a[k] !== undefined ? highlight(a[k]) : ""}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-card">After</div>
          {Array.from({ length: max }).map((_, k) => (
            <div key={k} className={cn("flex", b[k] === undefined && "opacity-30", b[k] !== undefined && a[k] !== b[k] && "bg-[color:var(--diff-add-bg)]")}>
              <span className="w-10 shrink-0 select-none px-2 text-right text-muted-foreground/50 border-r border-border">{b[k] !== undefined ? k + 1 : ""}</span>
              <span className="px-2 whitespace-pre">{b[k] !== undefined ? highlight(b[k]) : ""}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const lines = diffLines(before, after);
  return (
    <div className="text-xs mono overflow-x-auto">
      {lines.map((l, i) => (
        <div
          key={i}
          className={cn(
            "flex",
            l.kind === "add" && "bg-[color:var(--diff-add-bg)]",
            l.kind === "del" && "bg-[color:var(--diff-del-bg)]",
          )}
        >
          <span className="w-10 shrink-0 select-none px-2 text-right text-muted-foreground/50 border-r border-border">{l.ln ?? ""}</span>
          <span className="w-10 shrink-0 select-none px-2 text-right text-muted-foreground/50 border-r border-border">{l.rn ?? ""}</span>
          <span className={cn(
            "w-5 shrink-0 select-none text-center",
            l.kind === "add" && "text-[color:var(--diff-add-fg)]",
            l.kind === "del" && "text-[color:var(--diff-del-fg)]",
          )}>
            {l.kind === "add" ? "+" : l.kind === "del" ? "-" : " "}
          </span>
          <span className="px-2 whitespace-pre flex-1">{highlight(l.text)}</span>
        </div>
      ))}
    </div>
  );
}
