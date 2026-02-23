import React from 'react';

/**
 * Converts plain text with URLs, emails, and phone numbers into rich JSX
 * with clickable links styled with the design system.
 */
export function formatTextWithLinks(text: string): React.ReactNode[] {
  // Match URLs, emails, phone numbers
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const phoneRegex = /(\+?\d[\d\s\-().]{7,}\d)/g;

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
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const [full, url, email, phone] = match;

    if (url) {
      // Trim trailing punctuation that's likely not part of the URL
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

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Renders a block of text as formatted paragraphs with auto-linked URLs.
 */
export function FormattedText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  // Split by double newlines for paragraphs, single newlines for line breaks
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
