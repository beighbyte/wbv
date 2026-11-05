import React from "react";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Renders text with highlighted search matches.
 * Uses simple string splitting — no regex, no dangerouslySetInnerHTML, no DOM mutation.
 * Zero overhead when query is empty (returns plain text).
 */
export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  query,
  className = "",
}) => {
  if (!query || query.length < 2) {
    return <span className={className}>{text}</span>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: { text: string; highlighted: boolean }[] = [];
  let lastIndex = 0;

  let searchFrom = 0;
  while (searchFrom < lowerText.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, searchFrom);
    if (matchIndex === -1) break;

    // Push non-matching text before this match
    if (matchIndex > lastIndex) {
      parts.push({ text: text.slice(lastIndex, matchIndex), highlighted: false });
    }

    // Push the matching text (preserving original case)
    parts.push({
      text: text.slice(matchIndex, matchIndex + query.length),
      highlighted: true,
    });

    lastIndex = matchIndex + query.length;
    searchFrom = lastIndex;
  }

  // Push remaining text after last match
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlighted: false });
  }

  // No matches found — return plain text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.highlighted ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-500/40 text-inherit rounded-[2px] px-[1px]"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
};

