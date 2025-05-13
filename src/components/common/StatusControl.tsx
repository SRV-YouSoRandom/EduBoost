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
import { CheckCircle, Circle, XCircle, Settings2Icon } from 'lucide-react'; 

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
  pending: 'text-muted-foreground', // Use a neutral color for pending in trigger
  inProgress: 'text-blue-500',
  done: 'text-green-500',
  rejected: 'text-red-500',
};

// Specific colors for items in the dropdown, can be same or different
const dropdownItemColorMap: Record<Status, string> = {
  pending: 'text-muted-foreground',
  inProgress: 'text-blue-500',
  done: 'text-green-500',
  rejected: 'text-red-500',
};


export default function StatusControl({ currentStatus, onStatusChange, size = 'default' }: StatusControlProps) {
  const triggerWidthClass = size === 'sm' ? "min-w-[110px] max-w-[150px]" : "min-w-[130px] max-w-[180px]";
  const SelectedIcon = statusIconMap[currentStatus];
  const selectedOption = STATUS_OPTIONS.find(option => option.value === currentStatus);

  return (
    <Select value={currentStatus} onValueChange={(value) => onStatusChange(value as Status)}>
      <SelectTrigger 
        className={cn(
          triggerWidthClass,
          size === 'sm' ? "h-8 text-xs px-2 py-1" : "h-10",
          statusColorMap[currentStatus] // Apply color to the trigger
        )}
        aria-label={`Current status: ${currentStatus}`}
      >
        <SelectValue placeholder="Set status">
           {/* Custom rendering for the selected value display */}
           <div className="flex items-center gap-2">
            <SelectedIcon className={cn("h-4 w-4")} /> {/* Icon inherits color from trigger */}
            {selectedOption?.label}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => {
          const OptionIcon = statusIconMap[option.value];
          return (
            <SelectItem 
              key={option.value} 
              value={option.value}
              // Apply specific color for dropdown item, not necessarily the trigger's displayed color base
              className={cn(dropdownItemColorMap[option.value])} 
            >
              <div className="flex items-center gap-2">
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

