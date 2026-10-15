type EnterScoresProps = {
  gameWeek?: {
    week_number: number;
  } | null;
};

export default function EnterScores({ gameWeek }: EnterScoresProps) {
  return (
    <div
      className="mt-4 rounded-[18px] border p-5"
      style={{
        backgroundColor: '#141B24',
        borderColor: '#243040',
      }}
    >
      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Scores</p>
      <h3 className="text-2xl font-semibold text-[var(--color-text)]">Enter Scores</h3>
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        Current game week: <span className="font-semibold text-[var(--color-text)]">Game Week {gameWeek?.week_number ?? 'N/A'}</span>
      </p>
    </div>
  );
}
