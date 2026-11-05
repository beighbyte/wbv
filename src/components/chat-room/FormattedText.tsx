import React from "react";
import { HighlightText } from "../common/HighlightText";

interface FormattedTextProps {
  text: string;
  searchQuery?: string;
  className?: string;
}

// Regex for URLs: http://, https://, or www.
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[^\s<]+[^<.,:;"')\]\s])/i;

/**
 * Parses inline WhatsApp markdown styles:
 * *bold* -> <strong>
 * _italic_ -> <em>
 * ~strikethrough~ -> <del>
 * `inline code` -> <code>
 */
function parseInlineMarkdown(
  text: string,
  searchQuery: string,
  keyPrefix: string
): React.ReactNode[] {
  if (!text) return [];

  // Combined regex matching inline styles while respecting WhatsApp boundary conditions
  // 1: ```block code```
  // 2: `inline code`
  // 3: *bold*
  // 4: _italic_
  // 5: ~strikethrough~
  const pattern = /(```[\s\S]*?```|`[^`\n]+`|\*[^\s*](?:[\s\S]*?[^\s*])?\*|_[^\s_](?:[\s\S]*?[^\s_])?_|~[^\s~](?:[\s\S]*?[^\s~])?~)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchedStr = match[0];

    // Push text before match
    if (matchIndex > lastIndex) {
      const beforeText = text.substring(lastIndex, matchIndex);
      parts.push(
        <HighlightText
          key={`${keyPrefix}_t_${lastIndex}`}
          text={beforeText}
          query={searchQuery}
        />
      );
    }

    const uniqueKey = `${keyPrefix}_m_${matchIndex}`;

    if (matchedStr.startsWith("```") && matchedStr.endsWith("```")) {
      // Code block
      const content = matchedStr.slice(3, -3);
      parts.push(
        <pre
          key={uniqueKey}
          className="my-1.5 p-2 rounded-lg bg-black/5 dark:bg-white/10 font-mono text-[12.5px] overflow-x-auto select-text whitespace-pre-wrap border border-black/5 dark:border-white/5"
        >
          <HighlightText text={content} query={searchQuery} />
        </pre>
      );
    } else if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      // Inline code
      const content = matchedStr.slice(1, -1);
      parts.push(
        <code
          key={uniqueKey}
          className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[12.5px] text-emerald-800 dark:text-emerald-300 border border-black/5 dark:border-white/5"
        >
          <HighlightText text={content} query={searchQuery} />
        </code>
      );
    } else if (matchedStr.startsWith("*") && matchedStr.endsWith("*")) {
      // Bold
      const content = matchedStr.slice(1, -1);
      parts.push(
        <strong key={uniqueKey} className="font-semibold text-gray-950 dark:text-white">
          <HighlightText text={content} query={searchQuery} />
        </strong>
      );
    } else if (matchedStr.startsWith("_") && matchedStr.endsWith("_")) {
      // Italic
      const content = matchedStr.slice(1, -1);
      parts.push(
        <em key={uniqueKey} className="italic">
          <HighlightText text={content} query={searchQuery} />
        </em>
      );
    } else if (matchedStr.startsWith("~") && matchedStr.endsWith("~")) {
      // Strikethrough
      const content = matchedStr.slice(1, -1);
      parts.push(
        <del key={uniqueKey} className="line-through opacity-75">
          <HighlightText text={content} query={searchQuery} />
        </del>
      );
    }

    lastIndex = matchIndex + matchedStr.length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    parts.push(
      <HighlightText
        key={`${keyPrefix}_t_${lastIndex}`}
        text={remaining}
        query={searchQuery}
      />
    );
  }

  return parts;
}

/**
 * Splits text into URLs and non-URLs, turning URLs into clickable, styled links.
 */
function parseUrlsAndStyles(
  line: string,
  searchQuery: string,
  lineIndex: number
): React.ReactNode[] {
  const parts = line.split(URL_REGEX);
  const rendered: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    const isUrl = URL_REGEX.test(part);
    const key = `l_${lineIndex}_p_${i}`;

    if (isUrl) {
      const href = part.toLowerCase().startsWith("www.") ? `https://${part}` : part;
      rendered.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#027eb5] dark:text-[#53bdeb] hover:underline underline-offset-2 break-all font-normal transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <HighlightText text={part} query={searchQuery} />
        </a>
      );
    } else {
      rendered.push(...parseInlineMarkdown(part, searchQuery, key));
    }
  }

  return rendered;
}

/**
 * Main FormattedText component:
 * Handles multi-line quotes (> quote), lists (- item, 1. item), URLs, and WhatsApp markdown.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  searchQuery = "",
  className = "",
}) => {
  if (!text) return null;

  // Split into lines for blockquote (> quote) and line-level processing
  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Check for WhatsApp Blockquote: lines starting with "> " or ">"
    const quoteMatch = /^>\s?(.*)$/.exec(line);
    if (quoteMatch) {
      const quoteContent = quoteMatch[1];
      elements.push(
        <div
          key={`line_${idx}`}
          className="my-1 pl-2.5 py-0.5 border-l-[3px] border-[#00a884] dark:border-[#00a884] bg-black/[0.03] dark:bg-white/[0.04] rounded-r text-[13.5px] italic text-gray-700 dark:text-gray-300"
        >
          {parseUrlsAndStyles(quoteContent, searchQuery, idx)}
        </div>
      );
      continue;
    }

    // Normal line
    elements.push(
      <React.Fragment key={`line_${idx}`}>
        {parseUrlsAndStyles(line, searchQuery, idx)}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  }

  return <span className={className}>{elements}</span>;
};

