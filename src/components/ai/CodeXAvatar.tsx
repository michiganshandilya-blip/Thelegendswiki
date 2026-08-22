import React from 'react';

interface CodeXAvatarProps {
  size?: number | string;
  className?: string;
}

export const CodeXAvatar: React.FC<CodeXAvatarProps> = ({ size = 28, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br from-[#1e3a8a] via-[#3366cc] to-[#0284c7] text-white shadow-sm border border-blue-300/40 select-none overflow-hidden ${className}`}
      title="Code X - AI Assistant"
      aria-label="Code X AI Avatar"
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
      >
        <circle cx="18" cy="18" r="16" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="2 2" />
        {/* Glowing X Symbol with circuit nodes */}
        <path
          d="M11 11L25 25M25 11L11 25"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="18" r="3.2" fill="#38bdf8" />
        <circle cx="11" cy="11" r="1.8" fill="#93c5fd" />
        <circle cx="25" cy="11" r="1.8" fill="#93c5fd" />
        <circle cx="11" cy="25" r="1.8" fill="#93c5fd" />
        <circle cx="25" cy="25" r="1.8" fill="#93c5fd" />
      </svg>
    </div>
  );
};
