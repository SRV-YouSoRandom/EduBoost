// src/types/common.ts

export type Status = 'pending' | 'inProgress' | 'done' | 'rejected';

export const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'inProgress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'rejected', label: 'Rejected' },
];

export interface ItemWithIdAndStatus<T = string> {
  id: string;
  text: T;
  status: Status;
}
