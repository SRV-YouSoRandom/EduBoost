// src/components/common/StatusControl.tsx
"use client";

import type { Status } from '@/types/common';
import { STATUS_OPTIONS } from '@/types/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, XCircle, Settings2Icon } from 'lucide-react'; // Using Settings2Icon for In Progress

interface StatusControlProps {
  currentStatus: Status;
  onStatusChange: (newStatus: Status) => void;
  size?: 'sm' | 'default';
}

const statusIconMap: Record<Status, React.ElementType> = {
  pending: Circle,
  inProgress: Settings2Icon,
  done: CheckCircle,
  rejected: XCircle,
};

const statusColorMap: Record<Status, string> = {
  pending: 'text-muted-foreground',
  inProgress: 'text-blue-500',
  done: 'text-green-500',
  rejected: 'text-red-500',
};


export default function StatusControl({ currentStatus, onStatusChange, size = 'default' }: StatusControlProps) {
  const triggerWidthClass = size === 'sm' ? "min-w-[110px] max-w-[150px]" : "min-w-[130px] max-w-[180px]";

  return (
    <Select value={currentStatus} onValueChange={(value) => onStatusChange(value as Status)}>
      <SelectTrigger 
        className={cn(
          triggerWidthClass,
          size === 'sm' ? "h-8 text-xs px-2 py-1" : "h-10"
          // Color is now applied to SelectItem, and SelectValue will inherit it via selected item's content
        )}
        aria-label={`Current status: ${currentStatus}`}
      >
        {/* SelectValue will render the selected SelectItem's content, which includes its icon and text styling */}
        <SelectValue placeholder="Set status" />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => {
          const OptionIcon = statusIconMap[option.value];
          return (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className={cn(statusColorMap[option.value])} // Apply color to the SelectItem itself
            >
              <div className="flex items-center gap-2">
                {/* Icon color will be inherited from parent SelectItem's text color */}
                <OptionIcon className={cn("h-4 w-4")} /> 
                {option.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
