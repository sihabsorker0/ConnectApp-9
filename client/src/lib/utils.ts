import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toUndefinedFromNull<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}
