import React from 'react';

/**
 * AnimatedBackground component that provides a subtle, immersive background
 * with rolling hills, slow-moving clouds, and a gentle sky gradient.
 * Designed to be non-distracting but visually appealing.
 */
const Bird = ({ size = 20, delay = '0s', className = '', speed = '4s' }) => (
  <div className={`relative animate-bird-soar ${className}`} style={{ width: size, height: size / 2, animationDelay: delay }}>
    <svg 
      viewBox="0 0 24 12" 
      className="w-full h-full text-slate-400/50"
    >
      {/* Left Wing - Simplified more graceful shape */}
      <path 
        className="animate-wing-l"
        style={{ animationDelay: delay, animationDuration: speed }}
        d="M12 6C10 6 6 7 2 10C5 8 9 8 12 6Z" 
        fill="currentColor" 
      />
      {/* Right Wing */}
      <path 
        className="animate-wing-r"
        style={{ animationDelay: delay, animationDuration: speed }}
        d="M12 6C14 6 18 7 22 10C19 8 15 8 12 6Z" 
        fill="currentColor" 
      />
      {/* Body - Slightly more tapered */}
      <path 
        d="M10 6c1 0 3 0 4 0c0.5 0 1 0.5 0 1c-1 0.5-3 0.5-4 0c-1-0.5-0.5-1 0-1z" 
        fill="currentColor" 
      />
    </svg>
  </div>
);

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#f0f9ff]">
      {/* Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100/40 via-white to-white" />
      
      {/* Warm Sun Glow */}
      <div className="absolute top-[-10%] right-[10%] w-[40vw] h-[40vw] bg-orange-100/15 blur-[100px] rounded-full" />
      
      {/* Flock 1 - High and slow (Left to Right) */}
      <div className="absolute top-[10%] left-0 w-full animate-bird-fly" style={{ animationDelay: '-2s', animationDuration: '48s' }}>
        <div className="flex space-x-8 items-end ml-[10%]">
          <Bird size={16} delay="0s" speed="5.5s" />
          <Bird size={12} delay="0.6s" speed="5.8s" className="mb-8" />
          <Bird size={14} delay="0.3s" speed="5.2s" className="mb-3" />
        </div>
      </div>
      
      {/* Flock 2 - Mid-High (Right to Left) */}
      <div className="absolute top-[18%] left-0 w-full animate-bird-fly-rtl" style={{ animationDelay: '-15s', animationDuration: '42s' }}>
        <div className="flex space-x-12 items-start mr-[15%]">
          <Bird size={20} delay="0.4s" speed="4s" className="mt-6" />
          <Bird size={16} delay="0.1s" speed="4.2s" />
        </div>
      </div>

      {/* Flock 3 - Mid-Low (Left to Right) */}
      <div className="absolute top-[28%] left-0 w-full animate-bird-fly" style={{ animationDelay: '-25s', animationDuration: '35s' }}>
        <div className="flex space-x-10 items-center ml-[35%]">
          <Bird size={18} delay="0.8s" speed="3.8s" />
          <Bird size={14} delay="0.2s" speed="4.1s" className="-mt-10" />
          <Bird size={15} delay="1.2s" speed="3.6s" className="mt-4" />
        </div>
      </div>

      {/* Flock 4 - Lower (Right to Left) */}
      <div className="absolute top-[38%] left-0 w-full animate-bird-fly-rtl" style={{ animationDelay: '-8s', animationDuration: '30s' }}>
        <div className="flex space-x-14 items-center mr-[25%]">
          <Bird size={14} delay="0.5s" speed="4.5s" />
          <Bird size={12} delay="0.2s" speed="4.8s" className="mt-8" />
        </div>
      </div>

      {/* Clouds - More defined but still soft */}
      <div className="absolute top-[12%] left-[-5%] w-64 h-20 bg-white/70 blur-2xl rounded-full animate-cloud-slow" />
      <div className="absolute top-[22%] left-[25%] w-48 h-16 bg-white/50 blur-xl rounded-full animate-cloud-medium" style={{ animationDelay: '-15s' }} />
      <div className="absolute top-[10%] left-[65%] w-80 h-24 bg-white/40 blur-2xl rounded-full animate-cloud-slow" style={{ animationDelay: '-30s' }} />
      
      {/* Rolling Hills */}
      <div className="absolute bottom-0 left-0 w-full h-[40vh] opacity-40">
        <svg
          className="absolute bottom-0 w-[120%] h-full left-[-10%] animate-hill-sway"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          {/* Back Hill */}
          <path
            fill="#d1fae5"
            d="M0,192L60,181.3C120,171,240,149,360,165.3C480,181,600,235,720,234.7C840,235,960,181,1080,149.3C1200,117,1320,107,1380,101.3L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
          {/* Middle Hill */}
          <path
            fill="#bbf7d0"
            fillOpacity="0.8"
            d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,250.7C1120,256,1280,224,1360,208L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          />
          {/* Front Hill */}
          <path
            fill="#86efac"
            fillOpacity="0.6"
            d="M0,288L120,282.7C240,277,480,267,720,261.3C960,256,1200,256,1320,256L1440,256L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"
          />
        </svg>

        {/* Tree on the middle hill */}
        <div className="absolute bottom-[18%] left-[15%] animate-tree-sway opacity-60">
          <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
            {/* Trunk */}
            <path d="M18 60L22 60L21 40L19 40L18 60Z" fill="#713f12" />
            {/* Leaves */}
            <circle cx="20" cy="35" r="15" fill="#15803d" />
            <circle cx="12" cy="28" r="10" fill="#16a34a" />
            <circle cx="28" cy="28" r="10" fill="#16a34a" />
            <circle cx="20" cy="20" r="12" fill="#22c55e" />
          </svg>
        </div>

        {/* Another smaller tree further back */}
        <div className="absolute bottom-[25%] right-[20%] animate-tree-sway opacity-40 scale-75" style={{ animationDelay: '-2s' }}>
          <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
            <path d="M18 60L22 60L21 40L19 40L18 60Z" fill="#713f12" />
            <circle cx="20" cy="35" r="15" fill="#15803d" />
            <circle cx="12" cy="28" r="10" fill="#16a34a" />
            <circle cx="28" cy="28" r="10" fill="#16a34a" />
            <circle cx="20" cy="20" r="12" fill="#22c55e" />
          </svg>
        </div>
      </div>

      {/* Bottom fade for readability */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/70 to-transparent" />
    </div>
  );
};

export default AnimatedBackground;

