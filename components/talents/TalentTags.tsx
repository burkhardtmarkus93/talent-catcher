"use client";

import { useState, useTransition } from "react";
import { addTalentTag, removeTalentTag } from "@/lib/actions/tags";

export function TalentTags({
  talentId,
  tags,
}: {
  talentId: string;
  tags: string[];
}) {
  const [newTag, setNewTag] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-paper px-3 py-1 text-xs text-ink"
          >
            {tag}
            <button
              type="button"
              onClick={() =>
                startTransition(() => removeTalentTag(talentId, tag))
              }
              className="text-muted hover:text-brick"
              aria-label={`Tag ${tag} entfernen`}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-muted">Noch keine Tags vergeben.</span>
        )}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTag.trim()) return;
          startTransition(() => addTalentTag(talentId, newTag.trim()));
          setNewTag("");
        }}
      >
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="z. B. torgefährlich"
          className="field flex-1"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-sm border border-line px-3 py-1.5 text-sm text-ink hover:bg-paper disabled:opacity-50"
        >
          + Tag
        </button>
      </form>
    </div>
  );
}
