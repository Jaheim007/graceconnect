import React from 'react';
import DOMPurify from 'dompurify';

/**
 * Converts plain text with URLs, emails, and phone numbers into rich JSX
 * with clickable links styled with the design system.
 */
export function formatTextWithLinks(text: string): React.ReactNode[] {
  // Combined regex
  const combined = new RegExp(
    `(https?:\\/\\/[^\\s<>"']+)|([a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})|(\\+?\\d[\\d\\s\\-().]{7,}\\d)`,
    'gi'
  );

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const [full, url, email, phone] = match;

    if (url) {
      let cleanUrl = url.replace(/[.,;:!?)]+$/, '');
      const trailing = url.slice(cleanUrl.length);
      parts.push(
        <a
          key={key++}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary/70 transition-colors break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {cleanUrl}
        </a>
      );
      if (trailing) parts.push(trailing);
    } else if (email) {
      parts.push(
        <a
          key={key++}
          href={`mailto:${email}`}
          className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary/70 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {email}
        </a>
      );
    } else if (phone) {
      const cleanPhone = phone.replace(/[\s\-().]/g, '');
      parts.push(
        <a
          key={key++}
          href={`tel:${cleanPhone}`}
          className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary/70 transition-colors whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {phone}
        </a>
      );
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/** Detect if a string contains HTML tags */
function containsHTML(text: string): boolean {
  return /<[a-z][\s\S]*?>/i.test(text);
}

/**
 * Renders a block of text as formatted content.
 * If the text contains HTML (from rich text editor), renders it safely with DOMPurify.
 * If plain text, auto-links URLs/emails/phones and formats paragraphs.
 */
export function FormattedText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  // If the text contains HTML tags, render as sanitized HTML
  if (containsHTML(text)) {
    const clean = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'img', 'span', 'div', 'hr', 'sub', 'sup', 'mark', 's', 'del', 'iframe', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'colgroup', 'col'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow', 'colspan', 'rowspan', 'data-language'],
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow'],
    });
    return (
      <div
        className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  // Plain text: split by paragraphs and auto-link
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className={className}>
      {paragraphs.map((para, i) => {
        const lines = para.split(/\n/);
        return (
          <p key={i} className={i > 0 ? 'mt-3' : ''}>
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                {formatTextWithLinks(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
