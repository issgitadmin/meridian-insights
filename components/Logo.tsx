export function Logo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 5l8 7-8 7zM21 5l-8 7 8 7z" fill="currentColor" />
    </svg>
  );
}
