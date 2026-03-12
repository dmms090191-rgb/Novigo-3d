import React from 'react';

const TechBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(8, 47, 73, 0.95) 50%, rgba(15, 23, 42, 1) 100%)' }} />

      <svg className="absolute w-full h-full opacity-20">
        <defs>
          <pattern id="techGridBg" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="0.5"/>
            <circle cx="0" cy="0" r="1.5" fill="rgba(6, 182, 212, 0.5)" />
            <circle cx="50" cy="0" r="1.5" fill="rgba(6, 182, 212, 0.5)" />
            <circle cx="0" cy="50" r="1.5" fill="rgba(6, 182, 212, 0.5)" />
            <circle cx="50" cy="50" r="1.5" fill="rgba(6, 182, 212, 0.5)" />
          </pattern>
          <linearGradient id="techGradientBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.08)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.04)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.08)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#techGridBg)" />
        <rect width="100%" height="100%" fill="url(#techGradientBg)" />
      </svg>

      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-500/10 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/10 to-transparent" />

      <div className="absolute top-20 left-20 w-64 h-64 border border-cyan-500/10 rounded-full" />
      <div className="absolute top-16 left-16 w-72 h-72 border border-cyan-500/5 rounded-full" />
      <div className="absolute bottom-20 right-20 w-48 h-48 border border-blue-500/10 rounded-full" />
      <div className="absolute bottom-16 right-16 w-56 h-56 border border-blue-500/5 rounded-full" />

      <div className="absolute top-1/4 right-12 w-1 h-24 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />
      <div className="absolute bottom-1/4 left-12 w-1 h-24 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent" />
      <div className="absolute top-12 left-1/4 w-24 h-1 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <div className="absolute bottom-12 right-1/4 w-24 h-1 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />

      <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse" />
      <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
};

export default TechBackground;
