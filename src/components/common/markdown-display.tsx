import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarkdownDisplayProps {
  title?: string;
  content: string;
}

export default function MarkdownDisplay({ title = "Generated Output", content }: MarkdownDisplayProps) {
  // Basic handling for markdown-like text. For complex markdown, a dedicated library would be needed.
  const sections = content.split(/\n## |\n### /).map(section => {
    if (section.startsWith("#")) { // Handle potential leading hash from split
        const match = section.match(/^(#+)\s*(.*)/);
        if (match) {
            return `#${match[1]} ${match[2]}`; // Re-add one hash
        }
    }
    return section;
  });


  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert">
        {sections.map((section, index) => {
          const lines = section.split('\n');
          const firstLine = lines[0].trim();
          
          if (firstLine.startsWith('#')) { // Heuristic for headings
            const headingLevel = firstLine.match(/^#+/)?.[0].length || 0;
            const headingText = firstLine.substring(headingLevel).trim();
            const restOfSection = lines.slice(1).join('\n');
            return (
              <div key={index} className="mb-4">
                {headingLevel === 1 && <h1 className="text-2xl font-semibold mb-2">{headingText}</h1>}
                {headingLevel === 2 && <h2 className="text-xl font-semibold mb-2 border-b pb-1">{headingText}</h2>}
                {headingLevel === 3 && <h3 className="text-lg font-semibold mb-1">{headingText}</h3>}
                {headingLevel >= 4 && <h4 className="text-md font-semibold mb-1">{headingText}</h4>}
                <div className="whitespace-pre-wrap text-foreground/90" dangerouslySetInnerHTML={{ __html: restOfSection.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/^- (.*)/gm, '<ul class="list-disc list-inside ml-4"><li>$1</li></ul>') }} />
              </div>
            );
          }
          return <div key={index} className="whitespace-pre-wrap mb-3 text-foreground/90" dangerouslySetInnerHTML={{ __html: section.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/^- (.*)/gm, '<ul class="list-disc list-inside ml-4"><li>$1</li></ul>') }} />;
        })}
      </CardContent>
    </Card>
  );
}
