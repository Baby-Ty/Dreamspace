/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Netsurit-inspired primary palette
        'netsurit': {
          'red': '#EC4B5C',
          'coral': '#F56565',
          'orange': '#FF8A50',
          'warm-orange': '#FFA726',
          'light-coral': '#FEB2B2',
        },
        // Legacy dream colors updated to align with Netsurit
        'dream-blue': '#4A90E2', // More professional blue
        'dream-purple': '#7B68EE', // Softer purple
        'dream-teal': '#20B2AA', // Professional teal
        'dream-pink': '#EC4B5C', // Now matches Netsurit red
        // Additional professional colors
        'professional': {
          'gray': {
            '50': '#F9FAFB',
            '100': '#F3F4F6',
            '200': '#E5E7EB',
            '300': '#D1D5DB',
            '400': '#9CA3AF',
            '500': '#6B7280',
            '600': '#4B5563',
            '700': '#374151',
            '800': '#1F2937',
            '900': '#111827',
          }
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}