import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Save, X, Upload, Search, Image, BookOpen, Trash } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DreamTrackerModal from '../components/DreamTrackerModal';
import StockPhotoSearch from '../components/StockPhotoSearch';
import HelpTooltip from '../components/HelpTooltip';

const DreamBook = () => {
  const { currentUser, dreamCategories, addDream, updateDream, deleteDream, reorderDreams } = useApp();
  const [editingDream, setEditingDream] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingDream, setViewingDream] = useState(null);
  const [showStockPhotoSearch, setShowStockPhotoSearch] = useState(false);
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirationCategory, setInspirationCategory] = useState('All');
  const [currentFormData, setCurrentFormData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    isPublic: false,
    image: ''
  });
  const editTitleRef = useRef(null);

  const maxDreams = 10;
  const dreams = currentUser?.dreamBook || [];
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggingIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      reorderDreams(sourceIndex, targetIndex);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  // Mock inspiration data (images intentionally left blank)
  const mockDreams = [
    { id: 1, title: 'Backpack Through Patagonia', category: 'Travel & Adventure', owner: 'Maya', status: 'Active', image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1200&q=60&auto=format&fit=crop' },
    { id: 2, title: 'Read a Book a Month', category: 'Learning & Education', owner: 'James', status: 'Active', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=60&auto=format&fit=crop' },
    { id: 3, title: 'Get Fit — Gym 3x a Week', category: 'Health & Fitness', owner: 'Alex', status: 'Active', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=60&auto=format&fit=crop' },
    { id: 4, title: 'Launch a Photography Portfolio', category: 'Creative Projects', owner: 'Sofia', status: 'Active', image: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=1200&q=60&auto=format&fit=crop' },
    { id: 5, title: 'Finish My Degree', category: 'Career Growth', owner: 'Ethan', status: 'Active', image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=60&auto=format&fit=crop' },
    { id: 6, title: 'Cycle Across a Country', category: 'Travel & Adventure', owner: 'Aiden', status: 'Active', image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&q=60&auto=format&fit=crop' },
    { id: 7, title: 'Master Public Speaking', category: 'Personal Development', owner: 'Olivia', status: 'Active', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&q=60&auto=format&fit=crop' },
    { id: 8, title: 'Learn to Cook 10 Signature Dishes', category: 'Lifestyle & Skills', owner: 'Lucas', status: 'Active', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=60&auto=format&fit=crop' },
    { id: 9, title: 'Volunteer for a Community Project', category: 'Community & Giving', owner: 'Aisha', status: 'Completed', image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200&q=60&auto=format&fit=crop' },
    { id: 10, title: 'Run a Half Marathon', category: 'Health & Fitness', owner: 'David', status: 'Completed', image: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=1200&q=60&auto=format&fit=crop' },
    { id: 11, title: 'Learn a New Language', category: 'Learning & Education', owner: 'Kenji', status: 'Active', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=60&auto=format&fit=crop' },
    { id: 12, title: 'Spend a Month Working from a New Country', category: 'Travel & Adventure', owner: 'Rachel', status: 'Active', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=60&auto=format&fit=crop' }
  ];

  const inspirationCategories = [
    'All',
    'Health & Fitness',
    'Travel & Adventure',
    'Learning & Education',
    'Creative Projects',
    'Community & Giving'
  ];

  // Map inspiration categories to valid app categories
  const mapInspirationCategory = (category) => {
    switch (category) {
      case 'Travel & Adventure':
        return 'Travel';
      case 'Learning & Education':
        return 'Learning';
      case 'Health & Fitness':
        return 'Health';
      case 'Creative Projects':
        return 'Creative';
      case 'Community & Giving':
        return 'Community';
      case 'Personal Development':
        return 'Learning';
      default:
        return category;
    }
  };

  // Build a starter template for a dream added from inspiration
  const buildTemplateFromInspiration = (item) => {
    const category = mapInspirationCategory(item.category);
    const nowIso = new Date().toISOString();

    // Generic template
    let description = `${item.title} — starter template. Customize goals, dates, and scope to fit your plan.`;
    
    // Create coach-managed consistency milestone (12 weeks by default)
    let milestones = [
      { 
        id: Date.now() + 1, 
        text: item.title, 
        completed: false, 
        createdAt: nowIso,
        coachManaged: true,
        type: 'consistency',
        targetWeeks: 12,
        startDate: nowIso,
        endOnDreamComplete: false,
        streakWeeks: 0
      }
    ];
    let notes = [
      { id: Date.now() + 4, text: 'You can change locations and details in this template.', timestamp: nowIso },
    ];

    // Specific richer template for Patagonia
    if (item.title === 'Backpack Through Patagonia') {
      description = 'Backpack through Patagonia (Chile & Argentina). Suggested route: Torres del Paine → El Calafate / Perito Moreno → El Chaltén → Bariloche. Tweak locations, dates, and budget to suit you.';
      milestones = [
        { id: Date.now() + 10, text: 'Pick travel window and budget', completed: false, createdAt: nowIso },
        { id: Date.now() + 11, text: 'Plan high-level route (Chile ↔ Argentina)', completed: false, createdAt: nowIso },
        { id: Date.now() + 12, text: 'Book flights (e.g., Punta Arenas / El Calafate)', completed: false, createdAt: nowIso },
        { id: Date.now() + 13, text: 'Reserve camps/hostels (Torres del Paine, etc.)', completed: false, createdAt: nowIso },
        { id: Date.now() + 14, text: 'Gear checklist (backpack, layers, boots, rain gear)', completed: false, createdAt: nowIso },
        { id: Date.now() + 15, text: 'Create packing list and emergency contacts', completed: false, createdAt: nowIso },
        { 
          id: Date.now() + 16, 
          text: 'Physical prep - consistent cardio for 10 weeks', 
          completed: false, 
          createdAt: nowIso,
          coachManaged: true,
          type: 'consistency',
          targetWeeks: 10,
          startDate: nowIso,
          endOnDreamComplete: false,
          streakWeeks: 0
        },
      ];
      notes = [
        { id: Date.now() + 17, text: 'Swap locations freely (e.g., add Ushuaia).', timestamp: nowIso },
        { id: Date.now() + 18, text: 'Coach tip: Build endurance gradually. Start with 2-3 cardio sessions per week.', timestamp: nowIso, isCoachNote: true },
      ];
    }

    return { category, description, milestones, notes };
  };

  // Inspiration items state with images populated via API on demand
  const [inspirationItems, setInspirationItems] = useState(mockDreams);
  const [loadingInspiration, setLoadingInspiration] = useState(false);
  const [inspirationError, setInspirationError] = useState('');

  const fetchUnsplashForTitle = async (title, fallbackCategory) => {
    // Disabled remote fetching for demo reliability on Pages. We ship static images above.
    return '';
  };

  const loadInspirationImages = async () => {
    setLoadingInspiration(true);
    setInspirationError('');
    try {
      const updated = await Promise.all(
        mockDreams.map(async (d) => {
          if (d.image) return d;
          const url = await fetchUnsplashForTitle(d.title, d.category);
          return { ...d, image: url };
        })
      );
      setInspirationItems(updated);
    } catch (err) {
      setInspirationError('Failed to load inspiration images.');
      setInspirationItems(mockDreams);
    } finally {
      setLoadingInspiration(false);
    }
  };

  // Load images when opening the modal (once per open)
  useEffect(() => {
    if (showInspiration) {
      setInspirationCategory('All');
      loadInspirationImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInspiration]);

  const filteredInspiration = inspirationItems.filter((d) => {
    const matchesCategory =
      inspirationCategory === 'All' ? true : d.category === inspirationCategory;
    return matchesCategory;
  });

  // Early return if data is not loaded yet
  if (!currentUser || !dreamCategories) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dream Book...</p>
        </div>
      </div>
    );
  }

  const handleEdit = (dream) => {
    setEditingDream(dream.id);
    setFormData({
      title: dream.title,
      category: dream.category,
      description: dream.description,
      isPublic: dream.isPublic || false,
      image: dream.image
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      title: '',
      category: dreamCategories?.[0] || 'Health',
      description: '',
      isPublic: false,
      image: ''
    });
  };

  const handleSave = () => {
    if (isCreating) {
      const newDream = {
        id: Date.now(),
        ...formData,
        progress: 0,
        milestones: [],
        notes: [],
        history: []
      };
      addDream(newDream);
      setIsCreating(false);
    } else {
      const updatedDream = dreams.find(d => d.id === editingDream);
      if (updatedDream) {
        updateDream({ ...updatedDream, ...formData });
      }
      setEditingDream(null);
    }
    
    setFormData({
      title: '',
      category: '',
      description: '',
      isPublic: false,
      image: ''
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingDream(null);
    setFormData({
      title: '',
      category: '',
      description: '',
      isPublic: false,
      image: ''
    });
  };

  const handleDelete = (dreamId) => {
    if (window.confirm('Are you sure you want to delete this dream?')) {
      deleteDream(dreamId);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload to a server and get back a URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewDream = (dream) => {
    setViewingDream(dream);
  };

  const handleCloseDreamModal = () => {
    setViewingDream(null);
  };

  const handleUpdateDream = (updatedDream) => {
    updateDream(updatedDream);
    setViewingDream(null);
  };

  const handleOpenStockPhotoSearch = (formData) => {
    setCurrentFormData(formData);
    setShowStockPhotoSearch(true);
  };

  const handleSelectStockPhoto = (imageUrl) => {
    if (currentFormData && currentFormData.setFormData) {
      currentFormData.setFormData({ 
        ...currentFormData.formData, 
        image: imageUrl 
      });
    }
    setShowStockPhotoSearch(false);
    setCurrentFormData(null);
  };

  const handleCloseStockPhotoSearch = () => {
    setShowStockPhotoSearch(false);
    setCurrentFormData(null);
  };

  // Focus title input and scroll the editing card into view when editing starts
  useEffect(() => {
    if (!editingDream) return;
    const el = document.getElementById(`dream-card-${editingDream}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // slight delay to ensure input mounted
    setTimeout(() => {
      if (editTitleRef.current) {
        editTitleRef.current.focus({ preventScroll: true });
      }
    }, 50);
  }, [editingDream]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-4 sm:space-y-4">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-2xl sm:text-3xl font-bold text-professional-gray-900">My Dream Book</h1>
              <HelpTooltip 
                title="Dream Book Guide"
                content="Create up to 10 personal or professional dreams. Add titles, categories, descriptions, and images. Track progress from 0-100%. Click on any dream to view details and update progress. Drag to reorder your dreams."
              />
            </div>
          <p className="text-professional-gray-600">
            Document and track your personal dreams ({dreams.length}/{maxDreams} dreams)
          </p>
          </div>

          <div className="flex items-center gap-3">
            {dreams.length < maxDreams && !isCreating && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Dream</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowInspiration(true)}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white rounded-xl hover:from-professional-gray-700 hover:to-professional-gray-800 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Find Inspiration
            </button>
          </div>
        </div>
      </div>

      {/* Dreams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

        {/* Existing Dreams */}
        {dreams.map((dream, index) => (
          <div
            key={dream.id}
            id={`dream-card-${dream.id}`}
            className={`relative h-full ${dragOverIndex === index && draggingIndex !== null ? 'ring-4 ring-netsurit-red ring-opacity-50' : ''}`}
            draggable={editingDream === null}
            onDragStart={(e) => { if (editingDream === null) handleDragStart(e, index); }}
            onDragOver={(e) => { if (editingDream === null) handleDragOver(e, index); }}
            onDrop={(e) => { if (editingDream === null) handleDrop(e, index); }}
            onDragEnd={() => { if (editingDream === null) handleDragEnd(); }}
            aria-grabbed={editingDream === null && draggingIndex === index}
            aria-dropeffect={editingDream === null ? 'move' : undefined}
          >
            {/* Reorder controls - hidden while editing to allow text selection */}
            {editingDream === null && (
            <div className="absolute -top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={() => { if (index > 0) reorderDreams(index, index - 1); }}
                title="Move left"
                className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl text-professional-gray-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 hover:scale-110"
              >
                <span className="text-sm font-bold">◀</span>
              </button>
              <button
                type="button"
                onClick={() => { if (index < dreams.length - 1) reorderDreams(index, index + 1); }}
                title="Move right"
                className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl text-professional-gray-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 hover:scale-110"
              >
                <span className="text-sm font-bold">▶</span>
              </button>
            </div>
            )}
            {editingDream === dream.id ? (
              <DreamForm
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={handleCancel}
                onImageUpload={handleImageUpload}
                onOpenStockPhotoSearch={handleOpenStockPhotoSearch}
                dreamCategories={dreamCategories}
                isEditing={true}
                inputRef={editTitleRef}
              />
            ) : (
              <DreamCard
                dream={dream}
                onEdit={() => handleEdit(dream)}
                onDelete={() => handleDelete(dream.id)}
                onView={() => handleViewDream(dream)}
              />
            )}
          </div>
        ))}

        {/* Quick Add Dream Card (opens modal) */}
        {dreams.length < maxDreams && (
          <button
            type="button"
            onClick={handleCreate}
            className="group bg-white rounded-2xl border-2 border-dashed border-netsurit-red/30 hover:border-netsurit-red/60 hover:bg-gradient-to-br hover:from-netsurit-red/5 hover:to-netsurit-coral/5 shadow-lg hover:shadow-2xl p-8 flex items-center justify-center h-full transition-all duration-300 hover:scale-[1.02] min-h-[400px]"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-netsurit-red/10 group-hover:bg-netsurit-red/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Plus className="w-8 h-8 text-netsurit-red group-hover:text-netsurit-coral transition-colors duration-300" />
              </div>
              <p className="text-xl font-bold text-netsurit-red group-hover:text-netsurit-coral transition-colors duration-300 mb-2">Add Dream</p>
              <p className="text-sm text-professional-gray-600 group-hover:text-professional-gray-700 transition-colors duration-300">Create a new dream entry</p>
            </div>
          </button>
        )}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, maxDreams - dreams.length - (dreams.length < maxDreams ? 1 : 0)) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-gradient-to-br from-professional-gray-50 to-professional-gray-100 rounded-2xl border-2 border-dashed border-professional-gray-300 flex items-center justify-center min-h-[400px] hover:border-professional-gray-400 hover:from-professional-gray-100 hover:to-professional-gray-150 transition-all duration-300"
          >
            <div className="text-center text-professional-gray-400">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-professional-gray-200 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">Dream slot {dreams.length + index + 2}</p>
              <p className="text-xs text-professional-gray-400 mt-1">Available</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dream Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-professional-gray-200">
              <h3 className="text-xl font-semibold text-professional-gray-900">Add New Dream</h3>
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <DreamForm
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={handleCancel}
                onImageUpload={handleImageUpload}
                onOpenStockPhotoSearch={handleOpenStockPhotoSearch}
                dreamCategories={dreamCategories}
                isEditing={false}
                inputRef={editTitleRef}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dream Tracker Modal */}
      {viewingDream && (
        <DreamTrackerModal
          dream={viewingDream}
          onClose={handleCloseDreamModal}
          onUpdate={handleUpdateDream}
        />
      )}

      {/* Stock Photo Search Modal */}
      {showStockPhotoSearch && (
        <StockPhotoSearch
          searchTerm=""
          onSelectImage={handleSelectStockPhoto}
          onClose={handleCloseStockPhotoSearch}
        />
      )}

      {/* Find Inspiration Modal */}
      {showInspiration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden">
            {/* Modal Header with horizontally scrollable category pills */}
            <div className="flex items-center gap-3 p-5 border-b border-professional-gray-200">
              <h3 className="text-xl font-semibold text-professional-gray-900 shrink-0">Find Inspiration</h3>
              <div className="flex-1 overflow-x-auto horizontal-scroll pb-2 -mb-2">
                <div className="flex items-center gap-2 whitespace-nowrap pr-2">
                  {inspirationCategories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setInspirationCategory(c)}
                      className={`rounded-full px-4 py-1 text-sm transition-colors ${
                        inspirationCategory === c
                          ? 'bg-netsurit-red/10 text-netsurit-red font-semibold'
                          : 'bg-professional-gray-100 text-professional-gray-700 hover:bg-professional-gray-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInspiration(false)}
                className="p-2 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded-lg shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto overscroll-contain scrollbar-clean">

              {loadingInspiration && (
                <div className="text-center text-professional-gray-600 py-6">Loading images…</div>
              )}
              {inspirationError && (
                <div className="text-center text-red-600 py-4 text-sm">{inspirationError}</div>
              )}
              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredInspiration.map((item) => (
                  <div key={item.id} className="rounded-xl border border-professional-gray-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full">
                    <div className="relative">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 bg-professional-gray-200 flex items-center justify-center text-professional-gray-500 text-sm">No image</div>
                      )}
                      <span className="absolute top-2 left-2 bg-white px-2 py-1 rounded-full text-xs font-medium">
                        {item.category}
                      </span>
                    </div>
                      <div className="p-4 flex flex-col gap-2 h-full">
                      <h4 className="font-semibold text-professional-gray-900 truncate text-center">{item.title}</h4>
                      {/* Removed author line for cleaner inspiration cards */}
                      <button
                        type="button"
                        onClick={() => {
                          if (dreams.length >= maxDreams) return;
                          const tpl = buildTemplateFromInspiration(item);
                          const newDream = {
                            id: Date.now(),
                            title: item.title,
                            category: tpl.category,
                            description: tpl.description,
                            progress: 0,
                            image: item.image,
                            milestones: tpl.milestones,
                            notes: tpl.notes,
                            history: []
                          };
                          addDream(newDream);
                          // Close inspiration and open edit for the newly added dream
                          setShowInspiration(false);
                          setEditingDream(newDream.id);
                          setFormData({
                            title: newDream.title,
                            category: newDream.category,
                            description: newDream.description,
                            progress: newDream.progress,
                            image: newDream.image
                          });
                        }}
                        className="mt-auto w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 text-sm"
                        disabled={dreams.length >= maxDreams}
                      >
                        Add to My Dream Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DreamForm = ({ formData, setFormData, onSave, onCancel, onImageUpload, onOpenStockPhotoSearch, dreamCategories, isEditing, inputRef }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim() && formData.description.trim()) {
      onSave();
    }
  };

  const handleStockPhotoSearch = () => {
    onOpenStockPhotoSearch({ formData, setFormData });
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload */}
      <div className="space-y-3">
        <div className="relative">
          {formData.image ? (
            <img
              src={formData.image}
              alt="Dream preview"
              className="w-full h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-32 bg-professional-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Image className="w-8 h-8 text-professional-gray-400 mb-2" />
              <p className="text-sm text-professional-gray-500">No image selected</p>
            </div>
          )}
          
          {formData.image && (
            <button
              type="button"
              onClick={onCancel}
              title="Close"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-netsurit-red"
            >
              <X className="w-4 h-4 text-professional-gray-700" />
            </button>
          )}
        </div>

        {/* Image Upload Options */}
        <div className="grid grid-cols-2 gap-2">
          <label className="btn-secondary cursor-pointer flex items-center justify-center space-x-2 py-2">
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload File</span>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </label>
          
          <button
            type="button"
            onClick={handleStockPhotoSearch}
            className="btn-secondary flex items-center justify-center space-x-2 py-2"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Stock Photos</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Dream title..."
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="input-field"
        ref={inputRef}
        required
      />

      {/* Category */}
      <select
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        className="input-field"
        required
      >
        <option value="">Select a category...</option>
        {dreamCategories?.map(category => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>

      {/* Description */}
      <textarea
        placeholder="Describe your dream in detail..."
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="input-field h-24 resize-none"
        required
      />


      {/* Visibility Toggle */}
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-professional-gray-700">Visibility:</label>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isPublic: false })}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              !formData.isPublic 
                ? 'bg-professional-gray-600 text-white' 
                : 'bg-professional-gray-100 text-professional-gray-600 hover:bg-professional-gray-200'
            }`}
          >
            Private
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isPublic: true })}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              formData.isPublic 
                ? 'bg-netsurit-red text-white' 
                : 'bg-professional-gray-100 text-professional-gray-600 hover:bg-professional-gray-200'
            }`}
          >
            Public
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isEditing ? 'Update' : 'Save'}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center px-4 py-3 bg-white text-professional-gray-700 border border-professional-gray-300 rounded-xl hover:bg-professional-gray-50 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

const DreamCard = ({ dream, onEdit, onDelete, onView }) => {
  const handleCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView();
    }
  };

  return (
    <div
      className="group relative flex flex-col h-full cursor-pointer select-none overflow-hidden rounded-2xl bg-white border border-professional-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-netsurit-red/20"
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKey}
    >
      {/* Top-right icon buttons */}
      <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200"
        >
          <Pencil className="w-4 h-4 text-professional-gray-700" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
        >
          <Trash className="w-4 h-4 text-red-600" />
        </button>
      </div>

      {/* Image */}
      <div className="relative flex-shrink-0 overflow-hidden">
        {dream.image ? (
          <img 
            src={dream.image} 
            alt={dream.title} 
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
            draggable={false} 
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-professional-gray-100 to-professional-gray-200 flex items-center justify-center">
            <Image className="w-12 h-12 text-professional-gray-400" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-professional-gray-800 shadow-md border border-white/20">
            {dream.category}
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full p-5">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-professional-gray-900 mb-3 line-clamp-2 group-hover:text-netsurit-red transition-colors duration-200">
            {dream.title}
          </h3>
          <p className="text-sm text-professional-gray-600 line-clamp-3 leading-relaxed mb-4">
            {dream.description}
          </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-professional-gray-700">Progress</span>
            <span className="text-sm font-bold text-netsurit-red">{dream.progress}%</span>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="relative">
            <div className="w-full bg-professional-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-netsurit-red via-netsurit-coral to-netsurit-orange h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${dream.progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
            </div>
            
            {/* Progress milestone indicators */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-between px-1">
              {[25, 50, 75].map((milestone) => (
                <div
                  key={milestone}
                  className={`w-1 h-4 rounded-full transition-colors duration-300 ${
                    dream.progress >= milestone 
                      ? 'bg-white shadow-sm' 
                      : 'bg-professional-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5">
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="w-full py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl font-semibold text-sm hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default DreamBook;