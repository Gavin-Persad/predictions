// src/app/stylecomponents/logo.tsx

type LogoProps = {
	className?: string;
};

export default function Logo({ className = '' }: LogoProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7.5l3.5 2.5-1.3 4h-4.4l-1.3-4z" />
			<path d="M12 3v4.5M15.5 10l4.2-1.3M14.2 14l2.6 3.6M9.8 14l-2.6 3.6M8.5 10L4.3 8.7" />
		</svg>
	);
}

