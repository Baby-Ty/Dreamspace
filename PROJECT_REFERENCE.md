# DreamSpace Project Reference

## Overview
DreamSpace is a personal and professional development platform that helps users track their dreams, set weekly goals, connect with colleagues, and monitor their progress through gamification.

## Design System

### Color Palette

#### Primary Brand Colors (Netsurit-inspired)
- **Red**: `#EC4B5C` (`netsurit-red`)
- **Coral**: `#F56565` (`netsurit-coral`) 
- **Orange**: `#FF8A50` (`netsurit-orange`)
- **Warm Orange**: `#FFA726` (`netsurit-warm-orange`)
- **Light Coral**: `#FEB2B2` (`netsurit-light-coral`)

#### Professional Gray Scale
- **Gray 50**: `#F9FAFB` (`professional-gray-50`)
- **Gray 100**: `#F3F4F6` (`professional-gray-100`)
- **Gray 200**: `#E5E7EB` (`professional-gray-200`)
- **Gray 300**: `#D1D5DB` (`professional-gray-300`)
- **Gray 400**: `#9CA3AF` (`professional-gray-400`)
- **Gray 500**: `#6B7280` (`professional-gray-500`)
- **Gray 600**: `#4B5563` (`professional-gray-600`)
- **Gray 700**: `#374151` (`professional-gray-700`)
- **Gray 800**: `#1F2937` (`professional-gray-800`)
- **Gray 900**: `#111827` (`professional-gray-900`)

#### Legacy Colors (Updated)
- **Dream Blue**: `#4A90E2` (professional blue)
- **Dream Purple**: `#7B68EE` (softer purple)
- **Dream Teal**: `#20B2AA` (professional teal)
- **Dream Pink**: `#EC4B5C` (matches Netsurit red)

### Color Usage Guidelines

#### Primary Actions & CTAs
- Use `netsurit-red` to `netsurit-coral` gradients
- Hover states: `netsurit-coral` to `netsurit-orange`
- Focus rings: `netsurit-red`

#### Backgrounds & Containers
- Main backgrounds: `white` or `professional-gray-50`
- Card backgrounds: `white` with `professional-gray-200` borders
- Section backgrounds: `professional-gray-50`

#### Text Hierarchy
- Primary headings: `professional-gray-900`
- Secondary headings: `professional-gray-800`
- Body text: `professional-gray-700`
- Secondary text: `professional-gray-600`
- Muted text: `professional-gray-500`

#### Progress Indicators
- Progress bars: `netsurit-red` to `netsurit-coral` gradient
- Success states: `professional-gray-600` (neutral, not green)
- Incomplete states: `professional-gray-400`

### Typography

#### Font Stack
```css
font-family: 'Inter', 'system-ui', 'sans-serif'
```

#### Size Scale
- **Hero**: `text-3xl` (30px) on mobile, `text-4xl` (36px) on desktop
- **H1**: `text-2xl` (24px) on mobile, `text-3xl` (30px) on desktop  
- **H2**: `text-xl` (20px) on mobile, `text-2xl` (24px) on desktop
- **H3**: `text-lg` (18px)
- **Body**: `text-base` (16px)
- **Small**: `text-sm` (14px)
- **Extra Small**: `text-xs` (12px)

### Spacing System

#### Container Spacing
- Page padding: `py-3 sm:py-4` (12px/16px vertical)
- Section spacing: `space-y-4 sm:space-y-5` (16px/20px between sections)
- Card padding: `p-4 sm:p-5` (16px/20px internal padding)

#### Component Spacing
- Card gaps: `gap-5 lg:gap-6` (20px/24px between cards)
- Button padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Icon spacing: `space-x-3` (12px between icon and text)

### Border Radius
- **Small**: `rounded-lg` (8px) - buttons, small cards
- **Medium**: `rounded-xl` (12px) - form inputs, medium cards  
- **Large**: `rounded-2xl` (16px) - main content cards
- **Extra Large**: `rounded-3xl` (24px) - hero sections (legacy, prefer 2xl)

### Shadow System
- **Small**: `shadow-md` - subtle elevation
- **Medium**: `shadow-lg` - standard cards
- **Large**: `shadow-xl` - prominent cards
- **Extra Large**: `shadow-2xl` - modal/overlay content

## Component Patterns

### Cards
```jsx
<div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
  <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
    <h2 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Title</h2>
  </div>
  <div className="p-4 sm:p-5">
    Content
  </div>
</div>
```

### Buttons
```jsx
// Primary CTA
<button className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg">
  Primary Action
</button>

// Secondary Button  
<button className="bg-professional-gray-200 text-professional-gray-700 px-4 py-2 rounded-xl hover:bg-professional-gray-300 transition-all duration-200 font-semibold shadow-md hover:shadow-lg">
  Secondary Action
</button>
```

### Progress Bars
```jsx
<div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
  <div 
    className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
    style={{ width: `${progress}%` }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
  </div>
</div>
```

### Page Headers
```jsx
// Standard dashboard page header pattern - use contextually appropriate icons
<div className="flex items-center space-x-3 mb-2">
  <IconName className="h-8 w-8 text-netsurit-red" />
  <h1 className="text-2xl sm:text-3xl font-bold text-professional-gray-900">Page Title</h1>
</div>
<p className="text-professional-gray-600">Page description or subtitle</p>

// Icon examples by page type:
// People Dashboard: <Users2 className="h-8 w-8 text-netsurit-red" />
// Dream Book: <BookOpen className="h-8 w-8 text-netsurit-red" />
// Dreams Week Ahead: <Calendar className="h-8 w-8 text-netsurit-red" />
// Dream Connect: <Network className="h-8 w-8 text-netsurit-red" />
// Career Book: <Briefcase className="h-8 w-8 text-netsurit-red" />
// Dream Coach: <UserCheck className="h-8 w-8 text-netsurit-red" />
// Admin Dashboard: <Shield className="h-8 w-8 text-netsurit-red" />
```

## User Experience Guidelines

### New User Experience
- Users start with completely blank profiles (no pre-loaded data)
- Empty states provide clear guidance and action buttons
- Onboarding focuses on creating first dream/goal

### Data Persistence
- User data is saved to localStorage with user-specific keys
- Format: `dreamspace_user_{userId}_data`
- Includes: user profile, dreams, weekly goals, scoring history

### Responsive Design
- Mobile-first approach with `sm:`, `lg:`, `xl:` breakpoints
- Compact spacing on mobile, more generous on desktop
- Grid layouts: single column on mobile, 2-column on xl screens

### Accessibility
- Focus rings on all interactive elements
- Semantic HTML structure
- ARIA labels for complex interactions
- Color contrast meets WCAG guidelines

## Technical Decisions

### Framework & Tools
- **React 18** with functional components and hooks
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling with custom color extensions
- **Lucide React** for consistent iconography
- **React Router** for client-side routing

### State Management
- **React Context** for global app state
- **useReducer** for complex state logic
- **localStorage** for data persistence
- User-specific data isolation

### File Structure
```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
├── data/               # Mock data and constants
├── pages/              # Route-level components
├── auth/               # Authentication configuration
└── config/             # External service configs
```

### Key Features
1. **Dream Tracking** - Personal goal management with progress tracking
2. **Weekly Goals** - Short-term milestone setting
3. **Dream Connect** - Social networking with colleagues
4. **Scorecard** - Gamified progress tracking
5. **Career Development** - Professional goal management
6. **Dream Coaching** - Manager/team member interaction tools

## Brand Guidelines

### Logo & Assets
- Main logo: `logo.png` (used for both tray icon and window logo)
- Fallback tray icon: `tray_icon.png`

### Tone & Voice
- Professional but approachable
- Encouraging and motivational
- Clear and concise (user prefers minimal fluff)
- Action-oriented language

### UI Preferences
- Clean, minimal design
- No auto-playing videos
- Compact layouts that fit above the fold
- Professional color scheme (moved away from bright blues/greens)
- Consistent iconography using Lucide React icons with contextually appropriate icons for each page

## Development Notes

### Performance Considerations
- Debounced localStorage saves (300ms)
- Optimized re-renders with proper dependency arrays
- Image optimization for user avatars and dream images

### Browser Support
- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- localStorage support required for persistence

### Future Considerations
- Real backend integration (currently uses mock data)
- Real-time collaboration features
- Mobile app development
- Advanced analytics and reporting

---

*Last updated: September 2024*
*This document should be updated as the project evolves*
