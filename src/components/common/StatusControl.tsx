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
import { CheckCircle, Circle, XCircle, Loader2, Settings2Icon } from 'lucide-react'; // Using Settings2Icon for In Progress

interface StatusControlProps {
  currentStatus: Status;
  onStatusChange: (newStatus: Status) => void;
  size?: 'sm' | 'default';
}

const statusIconMap: Record<Status, React.ElementType> = {
  pending: Circle,
  inProgress: Settings2Icon, // Changed from Loader2 to avoid confusion with loading spinners
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
  const Icon = statusIconMap[currentStatus];

  return (
    <Select value={currentStatus} onValueChange={(value) => onStatusChange(value as Status)}>
      <SelectTrigger 
        className={cn(
          "w-[150px]",
          size === 'sm' ? "h-8 text-xs px-2 py-1" : "h-10",
          statusColorMap[currentStatus]
        )}
        aria-label={`Current status: ${currentStatus}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", statusColorMap[currentStatus])} />
          <SelectValue placeholder="Set status" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => {
          const OptionIcon = statusIconMap[option.value];
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <OptionIcon className={cn("h-4 w-4", statusColorMap[option.value])} />
                {option.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
