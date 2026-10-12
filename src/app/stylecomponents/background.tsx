// src/app/stylecomponents/background.tsx

type BackgroundProps = {
	className?: string;
};

export default function PitchBackground({ className = '' }: BackgroundProps) {
	return (
		<div className={className} aria-hidden="true">
			<div className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-pitch-line)]" />
			<div className="absolute left-1/2 top-1/2 h-[min(80vw,640px)] w-[min(80vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-pitch-line)]" />
		</div>
	);
}

