//src/app/admin/components/ReadyForScores.tsx

"use client";

type ReadyForScoresProps = {
  seasonId: string;
  onClose: () => void;
};

export default function ReadyForScores({ seasonId, onClose }: ReadyForScoresProps) {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: '#0B0F14' }}
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 py-5 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#8A97A6', letterSpacing: '0.06em' }}
            >
              Enter scores
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border"
            style={{ 
              color: '#B6F23C',
              borderColor: '#3A4A5E',
              backgroundColor: 'transparent'
            }}
          >
            Back
          </button>
        </div>

        {/* Content Placeholder */}
        <div
          className="rounded-[14px] border p-4 md:p-5"
          style={{ 
            backgroundColor: '#141B24', 
            borderColor: '#243040'
          }}
        >
          <div
            className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed text-sm"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: '#3A4A5E',
              color: '#8A97A6'
            }}
          >
            Enter scores content - Coming soon
          </div>
        </div>
      </div>
    </main>
  );
}