# DreamSpace - Netsurit Dreams Program

A clean and professional internal web app for Netsurit's Dreams Program, helping team members document their personal dreams, track progress, and connect with colleagues.

## Features

### 🏠 **Dashboard (Home Page)**
- Welcome message with user's name
- Quick stats: Dreams created, Connects completed, Scorecard points
- CTA buttons: "Start My Dream Book", "View My Progress", "Find a Dream Connect"
- Recent activity feed
- Current dreams progress overview

### 📖 **Dream Book Editor**
- Create/edit up to 10 dream entries
- Each entry includes:
  - Title (short)
  - Category (Health, Travel, Career, Learning, etc.)
  - Description (long form)
  - Optional image upload
  - Progress tracker (0–100%)
- Auto-save functionality
- Beautiful card-based layout

### 🤝 **Dream Connect**
- Suggested employees to connect with based on shared dream categories
- Each suggestion shows:
  - Name and location
  - Shared dream categories
  - Connection statistics
- Modal for requesting Dream Connects with:
  - Optional message
  - Schedule link (Teams integration placeholder)
  - Selfie upload confirmation
- View previous connects with photos and notes

### 🏆 **Scorecard Page**
- Point tracking system:
  - Dreams completed (+10 pts)
  - Dream Connects (+5 pts)
  - Group attendance (+3 pts)
- Achievement levels and progress visualization
- Summary and detailed history views
- Total points and level badges

### 👨‍💼 **Admin Dashboard**
- List of all employees with filtering by office/location
- Key metrics:
  - % of employees with Dream Books
  - Popular dream categories
  - Most active connectors
  - Low-engagement users identification
- Anonymization toggle for demos
- Overview and detailed user views

### 🎨 **Global UI Features**
- Responsive sidebar navigation
- Modern Tailwind CSS styling with custom dream-themed colors
- Mobile-friendly responsive design
- Clean card-based layout
- Smooth transitions and hover effects
- Professional typography with Inter font

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React hooks (useState, useEffect)
- **Data**: Mock data structure (ready for Firebase/Supabase integration)

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository or extract the project files
2. Navigate to the project directory:
   ```bash
   cd dreamspace
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

To build the app for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Project Structure

```
dreamspace/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   └── Layout.jsx     # Main layout with sidebar
│   ├── data/              # Mock data and helpers
│   │   └── mockData.js    # User data, categories, etc.
│   ├── pages/             # Page components
│   │   ├── Dashboard.jsx
│   │   ├── DreamBook.jsx
│   │   ├── DreamConnect.jsx
│   │   ├── Scorecard.jsx
│   │   └── AdminDashboard.jsx
│   ├── App.jsx            # Main app with routing
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles with Tailwind
├── index.html             # HTML template
├── package.json
├── tailwind.config.js     # Tailwind configuration
├── vite.config.js         # Vite configuration
└── README.md
```

## Data Structure

The app uses a mock data structure that can easily be replaced with a real backend:

```javascript
User: {
  id: number,
  name: string,
  email: string,
  office: string,
  avatar: string,
  dreamBook: Dream[],
  score: number,
  connects: Connect[]
}

Dream: {
  id: number,
  title: string,
  category: string,
  description: string,
  progress: number (0-100),
  image: string
}

Connect: {
  id: number,
  withWhom: string,
  date: string,
  notes: string,
  selfieUrl: string
}
```

## Customization

### Colors
The app uses a custom color palette defined in `tailwind.config.js`:
- `dream-blue`: #6366f1
- `dream-purple`: #8b5cf6
- `dream-teal`: #14b8a6
- `dream-pink`: #ec4899

### Adding New Dream Categories
Edit the `dreamCategories` array in `src/data/mockData.js`:

```javascript
export const dreamCategories = [
  "Health", "Travel", "Career", "Learning", 
  "Creative", "Financial", "Relationships", 
  "Adventure", "Spiritual", "Community"
  // Add new categories here
];
```

### Backend Integration
The app is designed to easily integrate with Firebase, Supabase, or any REST API. Replace the mock data imports with actual API calls in each component.

## Future Enhancements

- [ ] Real backend integration (Firebase/Supabase)
- [ ] Push notifications for connect requests
- [ ] Advanced filtering and search
- [ ] Team challenges and group goals
- [ ] Photo gallery for dream inspiration
- [ ] Progress analytics and insights
- [ ] Mobile app version
- [ ] Integration with calendar systems
- [ ] Automated reminder system

## License

This project is proprietary software for Netsurit's internal use.

## Support

For questions or support, please contact the development team.