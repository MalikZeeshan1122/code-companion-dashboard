import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/lib/mockData";

interface Props {
  node: FileNode;
  level?: number;
  highlight?: boolean;
  onSelect?: (path: string) => void;
  selected?: string;
}

export function FileTree({ node, level = 0, highlight, onSelect, selected }: Props) {
  const [open, setOpen] = useState(level < 2);

  if (node.type === "file") {
    const rel = node.relevance ?? 0;
    const isHot = highlight && rel >= 0.7;
    const isWarm = highlight && rel >= 0.4 && rel < 0.7;
    return (
      <button
        onClick={() => onSelect?.(node.path)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-xs mono",
          selected === node.path ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
          isHot && "text-[color:var(--syntax-fn)]",
          isWarm && "text-[color:var(--syntax-string)]",
        )}
        style={{ paddingLeft: 6 + level * 12 }}
      >
        <File className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className="truncate">{node.name}</span>
        {highlight && rel >= 0.4 && (
          <span className="ml-auto text-[9px] opacity-70">{Math.round(rel * 100)}%</span>
        )}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-xs mono hover:bg-accent/50"
        style={{ paddingLeft: 6 + level * 12 }}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {open ? (
          <FolderOpen className="h-3.5 w-3.5 text-[color:var(--syntax-string)]" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-[color:var(--syntax-string)]" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              level={level + 1}
              highlight={highlight}
              onSelect={onSelect}
              selected={selected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
