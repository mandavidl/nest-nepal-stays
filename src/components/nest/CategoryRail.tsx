import { categories, type CategoryId } from "@/lib/nest-data";

export function CategoryRail({
  selected,
  onSelect,
  includeAll = false,
}: {
  selected: CategoryId | "all";
  onSelect: (id: CategoryId | "all") => void;
  includeAll?: boolean;
}) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
      {includeAll && (
        <button
          onClick={() => onSelect("all")}
          className={`flex shrink-0 flex-col items-start gap-2 rounded-2xl border-2 bg-surface px-3.5 py-3 text-left transition-all ${
            selected === "all" ? "border-brand shadow-sm" : "border-sand hover:border-brand/40"
          }`}
        >
          <span className="text-xl">✦</span>
          <span className="text-xs font-bold leading-tight">All types</span>
        </button>
      )}
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          aria-pressed={selected === c.id}
          className={`flex shrink-0 flex-col items-start gap-2 rounded-2xl border-2 bg-surface px-3.5 py-3 text-left transition-all ${
            selected === c.id ? "border-brand shadow-sm" : "border-sand hover:border-brand/40"
          }`}
        >
          <span className="text-xl">{c.emoji}</span>
          <span className="block text-xs font-bold leading-tight">
            {c.label.split(" & ").map((part, i, arr) => (
              <span key={part} className="block">
                {part}
                {i < arr.length - 1 ? " &" : ""}
              </span>
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}
