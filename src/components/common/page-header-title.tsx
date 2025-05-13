import type { LucideIcon } from 'lucide-react';

interface PageHeaderTitleProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export default function PageHeaderTitle({ title, description, icon: Icon }: PageHeaderTitleProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-8 w-8 text-primary" />}
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
      </div>
      {description && (
        <p className="mt-2 text-lg text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
