
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarkdownDisplayProps {
  title?: string; // Title for the card, if used as a standalone card
  content: string;
  className?: string; // Allow passing additional class names for the content div
  asCard?: boolean; // If true, wraps content in a Card component
}

// Basic regex for markdown lists, bold, and italics
const processMarkdown = (text: string): string => {
  if (!text) return "";
  let html = text;
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
  // Unordered lists: - item or * item or + item
  html = html.replace(/^\s*[-*+]\s+(.*)/gm, '<ul class="list-disc list-inside ml-4"><li>$1</li></ul>');
  // Collapse multiple  ULs into one if they are contiguous
  html = html.replace(/<\/ul>\s*<ul class="list-disc list-inside ml-4">/g, '');
  // Paragraphs (basic handling for newlines)
  html = html.split('\n').map(line => line.trim() === '' ? '<br/>' : `<p>${line}</p>`).join('');
  html = html.replace(/<p><ul class="list-disc list-inside ml-4"><li>(.*?)<\/li><\/ul><\/p>/g, '<ul class="list-disc list-inside ml-4"><li>$1</li></ul>'); // Fix p tags around ul
  html = html.replace(/(<br\/>\s*)+/g, '<br/>'); // Consolidate multiple brs
  html = html.replace(/<p>\s*<\/p>/g, ''); // Remove empty p tags

  return html;
};


export default function MarkdownDisplay({ title = "Generated Output", content, className, asCard = true }: MarkdownDisplayProps) {
  const processedContent = processMarkdown(content);

  const contentDiv = (
    <div
      className={cn("prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert whitespace-pre-wrap", className)}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );

  if (asCard) {
    return (
      <Card className="shadow-sm">
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          {contentDiv}
        </CardContent>
      </Card>
    );
  }

  return contentDiv;
}
