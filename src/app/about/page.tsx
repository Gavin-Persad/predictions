//src/app/about/page.tsx

"use client";

import React from 'react';
import Sidebar from '../../components/Sidebar';
import DarkModeToggle from '../../components/darkModeToggle';
import Link from 'next/link';

export default function About() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl mx-4 my-10">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">About The Project</h1>
          
          {/* History Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">History</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This football predictions competition was originally created by Chris Guyatt for the community of the George pub in South Woodford. For many years, Chris manually managed the competition, handling predictions, calculating points, and maintaining league tables.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              The 2025/26 season marks the first full season using this web application, developed by Gavin Persad to automate the process and allow Chris to enjoy the competition without the administrative burden.
            </p>
          </section>
          
          {/* Technology Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Technology</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This application was built using modern web technologies to ensure reliability, performance, and a great user experience:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li><span className="font-semibold">React & Next.js</span> - For building a fast, responsive, and component-based interface with server-side rendering capabilities</li>
              <li><span className="font-semibold">TypeScript</span> - For type safety and improved developer experience, reducing bugs and enhancing code quality</li>
              <li><span className="font-semibold">Tailwind CSS</span> - For a utility-first approach to styling that allows for rapid UI development and consistent design</li>
              <li><span className="font-semibold">Supabase</span> - For backend database, authentication, and real-time functionality without managing server infrastructure</li>
              <li><span className="font-semibold">Vercel</span> - For seamless deployment and hosting with excellent performance</li>
              <li><span className="font-semibold">Husky</span> - For Git hooks to enforce code quality and prevent bad commits</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              The application was designed with a focus on user experience, accessibility, and performance - ensuring that players can easily submit predictions and track their progress throughout the season.
            </p>
          </section>
          
          {/* GitHub Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Open Source</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This project is open source and available on GitHub. Feel free to explore the code, report issues, or suggest improvements.
            </p>
            <div className="flex">
              <Link 
                href="https://github.com/Gavin-Persad/predictions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span>View on GitHub</span>
              </Link>
            </div>
          </section>
          
          {/* About the Developer */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">About the Developer</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Gavin Persad is a software developer with expertise in JavaScript/TypeScript, React, and modern web technologies. With a background in bartending and hospitality management, Gavin brings a unique perspective to software development - combining technical skills with a deep understanding of user experience and community needs.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Gavin has built multiple web applications, from e-commerce platforms to specialised tools like this football predictions app. His technical skills include:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                  <li>React, Next.js, TypeScript, JavaScript</li>
                  <li>Tailwind CSS, HTML5, CSS3</li>
                  <li>Node.js, Express, API development</li>
                  <li>Supabase, Firebase, PostgreSQL</li>
                  <li>Vercel, AWS, CI/CD pipelines</li>
                  <li>Automated testing and QA</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300">
                  This application is one example of Gavin&apos;s commitment to building tools that serve real community needs and improve people&apos;s daily experiences.
                </p>
              </div>
              <div className="md:w-1/3 flex flex-col gap-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Contact</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    <a href="mailto:gavinapersad@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">gavinapersad@gmail.com</a>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <a href="https://github.com/Gavin-Persad" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">GitHub Profile</a>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <a href="https://linkedin.com/in/gavin-persad" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">LinkedIn Profile</a>
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Other Projects</h3>
                  <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                    <li>
                      <a href="https://github.com/Gavin-Persad/beauty-by-cole" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Beauty By Cole</a> - Booking system
                    </li>
                    <li>
                      <a href="https://github.com/Gavin-Persad/GJTopTrumps" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">GJ Top Trumps</a> - Card game
                    </li>
                    <li>
                      <a href="https://github.com/INFINITYX00/eslando" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Eslando</a> - E-commerce platform
                    </li>
                  </ul>
                </div>
              </div>
            </div>
           </section>
          
          {/* Back to Dashboard Button */}
          <div className="flex justify-center mt-10">
            <Link 
              href="/dashboard" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center space-x-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}