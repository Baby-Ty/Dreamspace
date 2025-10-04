// DreamSpace localStorage Cleaner
// Use this if you have corrupted localStorage data

// Paste this in browser console (F12) and hit Enter:
Object.keys(localStorage).filter(k => k.startsWith('dreamspace_')).forEach(k => localStorage.removeItem(k));
console.log('✅ DreamSpace localStorage cleared! Refresh the page.');

