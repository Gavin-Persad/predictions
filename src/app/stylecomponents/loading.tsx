type LoadingSpinnerProps = {
  size?: number;
  className?: string;
  label?: string;
};

export default function LoadingSpinner({
  size = 32,
  className = '',
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div
        className="relative"
        style={{ width: size, height: size }}
        aria-label={label || 'Loading'}
        role="status"
      >
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent"
          style={{
            borderTopColor: 'rgba(182, 242, 60, 0.9)',
            borderRightColor: 'rgba(182, 242, 60, 0.35)',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        <div
          className="absolute inset-[7px] rounded-full border-[2px] border-transparent"
          style={{
            borderColor: 'rgba(138, 151, 166, 0.35)',
          }}
        />
      </div>

      {label && (
        <span className="ml-3 text-sm font-medium text-[var(--color-muted)]">{label}</span>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

