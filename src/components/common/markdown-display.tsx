import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MarkdownDisplayProps {
  title?: string; 
  content: string;
  className?: string; 
  asCard?: boolean; 
}

// Improved regex for markdown processing
const processMarkdown = (text: string): string => {
  if (!text) return "";
  let html = text;

  // Headers (h1-h6)
  html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');

  // Unordered lists: - item or * item or + item
  // Process line by line to build lists correctly
  const lines = html.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (ulMatch) {
      const indent = ulMatch[1].length; // Basic indentation handling
      let listItem = `<li style="margin-left: ${indent * 10}px;">${ulMatch[2]}</li>`;
      if (!inList) {
        inList = true;
        return `<ul class="list-disc pl-5 space-y-1">${listItem}`;
      }
      return listItem;
    } else {
      if (inList) {
        inList = false;
        return `</ul>${line ? `<p>${line}</p>` : ''}`;
      }
      return line ? `<p>${line}</p>` : '<br/>';
    }
  });

  if (inList) { // Close any open list at the end
    processedLines.push('</ul>');
  }
  html = processedLines.join('');
  
  // Remove <p> tags around <ul>
  html = html.replace(/<p><ul class="list-disc pl-5 space-y-1">/g, '<ul class="list-disc pl-5 space-y-1">');
  html = html.replace(/<\/ul><\/p>/g, '</ul>');
  
  // Collapse multiple <br/> tags and remove empty <p> tags
  html = html.replace(/(<br\s*\/?>\s*)+/g, '<br/>');
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p><br\/><\/p>/g, '<br/>'); // Handle <p><br/></p> by itself

  return html;
};


export default function MarkdownDisplay({ title, content, className, asCard = true }: MarkdownDisplayProps) {
  const processedContent = processMarkdown(content);

  const contentDiv = (
    <div
      className={cn(
        "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert",
        // Removed whitespace-pre-wrap as specific paragraph/list handling should manage spacing
        className
      )}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );

  if (asCard) {
    return (
      <Card className="shadow-sm">
        {title && ( // Only render CardHeader if title is provided
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
