import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRootDomain(domain: string): string {
  if (!domain) return "";
  const parts = domain.toLowerCase().split(".");
  if (parts.length <= 2) return domain.toLowerCase();

  const secondLevel = parts[parts.length - 2];
  if (["co", "com", "org", "net", "edu", "gov", "ac"].includes(secondLevel)) {
    if (parts.length >= 3) {
      return parts.slice(-3).join(".");
    }
  }
  return parts.slice(-2).join(".");
}
