import React from "react"

export type ResourceIconName = "cpu" | "memory" | "disk" | "traffic" | "network" | "location" | "clock" | "upload" | "download"

const paths: Record<ResourceIconName, React.ReactNode> = {
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/></>,
  memory: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h2v4H7zm5 0h2v4h-2zm5 0h2v4h-2zM7 3v3m5-3v3m5-3v3m-10 12v3m5-3v3m5-3v3"/></>,
  disk: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/><path d="M16 18h.01"/></>,
  traffic: <><path d="M12 3v18m0-18 4 4m-4-4L8 7m4 14 4-4m-4 4-4-4"/></>,
  network: <><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="m8.7 10.7 6.6-3.4M8.7 13.3l6.6 3.4"/></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  upload: <><path d="M12 19V5m0 0 6 6m-6-6-6 6"/></>,
  download: <><path d="M12 5v14m0 0 6-6m-6 6-6-6"/></>,
}

export function ResourceIcon({ name, size = 16, className }: { name: ResourceIconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
