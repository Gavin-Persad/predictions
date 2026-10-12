//src/app/about/page.tsx

"use client";

import React from 'react';
import Link from 'next/link';
import PitchBackground from '../stylecomponents/background';
import Logo from '../stylecomponents/logo';
import { colors } from '../stylecomponents/colors';

export default function About() {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-[var(--color-text)]"
      style={{
        backgroundColor: colors.background,
        ['--color-text' as never]: colors.text,
        ['--color-pitch-line' as never]: colors.pitchLine,
        ['--color-muted' as never]: colors.muted,
        ['--color-field' as never]: colors.field,
        ['--color-border' as never]: colors.border,
        ['--color-border-strong' as never]: colors.borderStrong,
        ['--color-lime' as never]: colors.lime,
        ['--color-lime-hover' as never]: colors.limeHover,
        ['--color-background' as never]: colors.background,
        ['--color-placeholder' as never]: colors.placeholder,
        ['--color-success-background' as never]: colors.successBackground,
        ['--color-success-border' as never]: colors.successBorder,
        ['--color-success-text' as never]: colors.successText,
        ['--color-error-background' as never]: colors.errorBackground,
        ['--color-error-border' as never]: colors.errorBorder,
        ['--color-error-text' as never]: colors.errorText,
        ['--color-panel' as never]: colors.panel,
      }}
    >
      <PitchBackground className="pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="absolute right-6 top-6 z-20">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-sm font-medium text-[var(--color-text)] shadow-[0_0_0_1px_rgba(36,48,64,0.7)] transition hover:border-[var(--color-lime)] hover:text-[var(--color-lime)]"
            aria-label="Back to dashboard"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="absolute left-6 top-6 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 shadow-[0_0_0_1px_rgba(36,48,64,0.7)] transition hover:border-[var(--color-lime)] hover:text-[var(--color-lime)]"
            aria-label="Back to app home"
          >
            <Logo className="h-5 w-5 text-[var(--color-lime)]" />
            <span className="text-sm font-medium text-[var(--color-text)]">The George Predictions League</span>
          </Link>
        </div>

        <div className="w-full max-w-5xl rounded-[14px] border border-[var(--color-border)] bg-[var(--color-panel)] p-7 shadow-[0_0_0_1px_rgba(36,48,64,0.7)] md:p-10">
          <h1 className="mb-8 text-center text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text)] md:text-4xl">
            About The Project
          </h1>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">History</h2>
            <p className="mb-4 text-[var(--color-text)]/90">
              This football predictions competition was originally created by Chris Guyatt for the community of the George pub in South Woodford. For many years, Chris manually managed the competition, handling predictions, calculating points, and maintaining league tables.
            </p>
            <p className="text-[var(--color-text)]/90">
              The 2025/26 season marks the first full season using this web application, developed by Gavin Persad to automate the process and allow Chris to enjoy the competition without the administrative burden.
            </p>
          </section>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">Technology</h2>
            <p className="mb-4 text-[var(--color-text)]/90">
              This application was built using modern web technologies to ensure reliability, performance, and a great user experience:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-[var(--color-text)]/90">
              <li><span className="font-semibold">React & Next.js</span> - For building a fast, responsive, and component-based interface with server-side rendering capabilities</li>
              <li><span className="font-semibold">TypeScript</span> - For type safety and improved developer experience, reducing bugs and enhancing code quality</li>
              <li><span className="font-semibold">Tailwind CSS</span> - For a utility-first approach to styling that allows for rapid UI development and consistent design</li>
              <li><span className="font-semibold">Supabase</span> - For backend database, authentication, and real-time functionality without managing server infrastructure</li>
              <li><span className="font-semibold">Vercel</span> - For seamless deployment and hosting with excellent performance</li>
              <li><span className="font-semibold">Husky</span> - For Git hooks to enforce code quality and prevent bad commits</li>
            </ul>
            <p className="text-[var(--color-text)]/90">
              The application was designed with a focus on user experience, accessibility, and performance - ensuring that players can easily submit predictions and track their progress throughout the season.
            </p>
          </section>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">Open Source</h2>
            <p className="mb-4 text-[var(--color-text)]/90">
              This project is open source and available on GitHub. Feel free to explore the code, report issues, or suggest improvements.
            </p>
            <div className="flex">
              <Link
                href="https://github.com/Gavin-Persad/predictions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-[var(--color-text)] transition hover:border-[var(--color-lime)] hover:text-[var(--color-lime)]"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span>View on GitHub</span>
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">About the Developer</h2>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="md:w-2/3">
                <p className="mb-4 text-[var(--color-text)]/90">
                  Gavin Persad is a software developer with expertise in JavaScript/TypeScript, React, and modern web technologies. With a background in bartending and hospitality management, Gavin brings a unique perspective to software development - combining technical skills with a deep understanding of user experience and community needs.
                </p>
                <p className="mb-4 text-[var(--color-text)]/90">
                  Gavin has built multiple web applications, from e-commerce platforms to specialised tools like this football predictions app. His technical skills include:
                </p>
                <ul className="mb-4 list-disc space-y-1 pl-6 text-[var(--color-text)]/90">
                  <li>React, Next.js, TypeScript, JavaScript</li>
                  <li>Tailwind CSS, HTML5, CSS3</li>
                  <li>Node.js, Express, API development</li>
                  <li>Supabase, Firebase, PostgreSQL</li>
                  <li>Vercel, AWS, CI/CD pipelines</li>
                  <li>Automated testing and QA</li>
                </ul>
                <p className="text-[var(--color-text)]/90">
                  This application is one example of Gavin&apos;s commitment to building tools that serve real community needs and improve people&apos;s daily experiences.
                </p>
              </div>
              <div className="flex flex-col gap-4 md:w-1/3">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                  <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Contact</h3>
                  <p className="text-[var(--color-text)]/90">
                    <a href="mailto:gavinapersad@gmail.com" className="text-[var(--color-lime)] hover:underline">gavinapersad@gmail.com</a>
                  </p>
                  <p className="text-[var(--color-text)]/90">
                    <a href="https://github.com/Gavin-Persad" target="_blank" rel="noopener noreferrer" className="text-[var(--color-lime)] hover:underline">GitHub Profile</a>
                  </p>
                  <p className="text-[var(--color-text)]/90">
                    <a href="https://linkedin.com/in/gavin-persad" target="_blank" rel="noopener noreferrer" className="text-[var(--color-lime)] hover:underline">LinkedIn Profile</a>
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                  <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Other Projects</h3>
                  <ul className="space-y-1 text-[var(--color-text)]/90">
                    <li>
                      <a href="https://github.com/Gavin-Persad/beauty-by-cole" target="_blank" rel="noopener noreferrer" className="text-[var(--color-lime)] hover:underline">Beauty By Cole</a> - Booking system
                    </li>
                    <li>
                      <a href="https://github.com/Gavin-Persad/GJTopTrumps" target="_blank" rel="noopener noreferrer" className="text-[var(--color-lime)] hover:underline">GJ Top Trumps</a> - Card game
                    </li>
                    <li>
                      <a href="https://github.com/INFINITYX00/eslando" target="_blank" rel="noopener noreferrer" className="text-[var(--color-lime)] hover:underline">Eslando</a> - E-commerce platform
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}