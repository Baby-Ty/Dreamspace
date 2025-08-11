import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Save, X, Upload, Trash, Search, Image } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DreamTrackerModal from '../components/DreamTrackerModal';
import StockPhotoSearch from '../components/StockPhotoSearch';

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
    progress: 0,
    image: '',
    milestonesDraft: []
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
    { id: 1, title: 'Backpack Through Patagonia', category: 'Travel & Adventure', owner: 'Maya', status: 'Active', image: '' },
    { id: 2, title: 'Read a Book a Month', category: 'Learning & Education', owner: 'James', status: 'Active', image: '' },
    { id: 3, title: 'Get Fit — Gym 3x a Week', category: 'Health & Fitness', owner: 'Alex', status: 'Active', image: '' },
    { id: 4, title: 'Launch a Photography Portfolio', category: 'Creative Projects', owner: 'Sofia', status: 'Active', image: '' },
    { id: 5, title: 'Finish My Degree', category: 'Career Growth', owner: 'Ethan', status: 'Active', image: '' },
    { id: 6, title: 'Cycle Across a Country', category: 'Travel & Adventure', owner: 'Aiden', status: 'Active', image: '' },
    { id: 7, title: 'Master Public Speaking', category: 'Personal Development', owner: 'Olivia', status: 'Active', image: '' },
    { id: 8, title: 'Learn to Cook 10 Signature Dishes', category: 'Lifestyle & Skills', owner: 'Lucas', status: 'Active', image: '' },
    { id: 9, title: 'Volunteer for a Community Project', category: 'Community & Giving', owner: 'Aisha', status: 'Completed', image: '' },
    { id: 10, title: 'Run a Half Marathon', category: 'Health & Fitness', owner: 'David', status: 'Completed', image: '' },
    { id: 11, title: 'Learn a New Language', category: 'Learning & Education', owner: 'Kenji', status: 'Active', image: '' },
    { id: 12, title: 'Spend a Month Working from a New Country', category: 'Travel & Adventure', owner: 'Rachel', status: 'Active', image: '' }
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
    let milestones = [
      { id: Date.now() + 1, text: 'Define what success looks like', completed: false, createdAt: nowIso },
      { id: Date.now() + 2, text: 'Pick timeframe and rough budget (if relevant)', completed: false, createdAt: nowIso },
      { id: Date.now() + 3, text: 'Decide the first small step for this week', completed: false, createdAt: nowIso },
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
      ];
      notes = [
        { id: Date.now() + 16, text: 'Swap locations freely (e.g., add Ushuaia).', timestamp: nowIso },
      ];
    }

    return { category, description, milestones, notes };
  };

  // Inspiration items state with images populated via API on demand
  const [inspirationItems, setInspirationItems] = useState(mockDreams);
  const [loadingInspiration, setLoadingInspiration] = useState(false);
  const [inspirationError, setInspirationError] = useState('');

  const fetchUnsplashForTitle = async (title, fallbackCategory) => {
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    const query = title || fallbackCategory || 'inspiration';
    if (!accessKey) return '';
    try {
      const resp = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${accessKey}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data?.results?.[0]?.urls?.regular || '';
    } catch (e) {
      return '';
    }
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
      progress: dream.progress,
      image: dream.image
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      title: '',
      category: dreamCategories?.[0] || 'Health',
      description: '',
      progress: 0,
      image: '',
      milestonesDraft: []
    });
  };

  const handleSave = () => {
    if (isCreating) {
      const newDream = {
        id: Date.now(),
        ...formData,
        milestones: (formData.milestonesDraft || []).map((text, index) => ({
          id: Date.now() + index + 1,
          text,
          completed: false,
          createdAt: new Date().toISOString()
        })),
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
      progress: 0,
      image: '',
      milestonesDraft: []
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingDream(null);
    setFormData({
      title: '',
      category: '',
      description: '',
      progress: 0,
      image: '',
      milestonesDraft: []
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
      <div className="bg-gradient-to-r from-purple-100 via-blue-50 to-pink-100 rounded-2xl px-4 py-3 shadow-sm border border-white/50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-1">
              My Dream Book 📖
            </h1>
            <p className="text-sm text-gray-500">
              Document and track your personal dreams ({dreams.length}/{maxDreams} dreams)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {dreams.length < maxDreams && !isCreating && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Dream</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowInspiration(true)}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Find Inspiration
            </button>
          </div>
        </div>
      </div>

      {/* Dreams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Existing Dreams */}
        {dreams.map((dream, index) => (
          <div
            key={dream.id}
            id={`dream-card-${dream.id}`}
            className={`bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-4 hover:shadow-lg hover:scale-[1.01] transition relative h-full ${dragOverIndex === index && draggingIndex !== null ? 'ring-2 ring-blue-400' : ''}`}
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
            <div className="absolute -top-3 right-2 flex gap-1">
              <button
                type="button"
                onClick={() => { if (index > 0) reorderDreams(index, index - 1); }}
                title="Move left"
                className="w-6 h-6 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <span className="-mt-0.5">◀</span>
              </button>
              <button
                type="button"
                onClick={() => { if (index < dreams.length - 1) reorderDreams(index, index + 1); }}
                title="Move right"
                className="w-6 h-6 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <span className="-mt-0.5">▶</span>
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
            className="bg-white rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 shadow-sm p-4 flex items-center justify-center h-full group hover:shadow-lg hover:scale-[1.01] transition"
          >
            <div className="text-center">
              <Plus className="w-10 h-10 text-blue-500 group-hover:text-blue-600 mx-auto mb-3" />
              <p className="text-lg font-medium text-blue-600 group-hover:text-blue-700">Add Dream</p>
              <p className="text-sm text-blue-500/70">Create a new dream entry</p>
            </div>
          </button>
        )}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, maxDreams - dreams.length - (dreams.length < maxDreams ? 1 : 0)) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[300px] hover:border-gray-400 transition-all duration-300"
          >
            <div className="text-center text-gray-400">
              <Plus className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Dream slot {dreams.length + index + 1}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dream Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add New Dream</h3>
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
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
            <div className="flex items-center gap-3 p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 shrink-0">Find Inspiration</h3>
              <div className="flex-1 overflow-x-auto horizontal-scroll pb-2 -mb-2">
                <div className="flex items-center gap-2 whitespace-nowrap pr-2">
                  {inspirationCategories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setInspirationCategory(c)}
                      className={`rounded-full px-4 py-1 text-sm transition-colors ${
                        inspirationCategory === c
                          ? 'bg-blue-100 text-blue-800 font-semibold'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto overscroll-contain scrollbar-clean">

              {loadingInspiration && (
                <div className="text-center text-gray-600 py-6">Loading images…</div>
              )}
              {inspirationError && (
                <div className="text-center text-red-600 py-4 text-sm">{inspirationError}</div>
              )}
              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredInspiration.map((item) => (
                  <div key={item.id} className="rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
                    <div className="relative">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">No image</div>
                      )}
                      <span className="absolute top-2 left-2 bg-white px-2 py-1 rounded-full text-xs font-medium">
                        {item.category}
                      </span>
                    </div>
                      <div className="p-4 flex flex-col gap-2 h-full">
                      <h4 className="font-semibold text-gray-900 truncate text-center">{item.title}</h4>
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
                        className="mt-auto w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm"
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

  const [milestoneInput, setMilestoneInput] = React.useState('');

  const addMilestoneDraft = () => {
    const text = milestoneInput.trim();
    if (!text) return;
    const next = [...(formData.milestonesDraft || []), text];
    setFormData({ ...formData, milestonesDraft: next });
    setMilestoneInput('');
  };

  const removeMilestoneDraft = (indexToRemove) => {
    const next = (formData.milestonesDraft || []).filter((_, idx) => idx !== indexToRemove);
    setFormData({ ...formData, milestonesDraft: next });
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
            <div className="w-full h-32 bg-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Image className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No image selected</p>
            </div>
          )}
          
          {formData.image && (
            <button
              type="button"
              onClick={onCancel}
              title="Close"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <X className="w-4 h-4 text-gray-700" />
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

      {/* Milestones (create only) */}
      {!isEditing && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Milestones</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={milestoneInput}
              onChange={(e) => setMilestoneInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMilestoneDraft(); } }}
              placeholder="New milestone..."
              className="flex-1 input-field"
            />
            <button
              type="button"
              onClick={addMilestoneDraft}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={!milestoneInput.trim()}
            >
              Add
            </button>
          </div>
          {(formData.milestonesDraft || []).length > 0 && (
            <ul className="space-y-2">
              {(formData.milestonesDraft || []).map((text, idx) => (
                <li key={`${text}-${idx}`} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-800">{text}</span>
                  <button
                    type="button"
                    onClick={() => removeMilestoneDraft(idx)}
                    className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                    aria-label="Remove milestone"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Progress */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Progress: {formData.progress}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={formData.progress}
          onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isEditing ? 'Update' : 'Save'}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
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
      className="relative flex flex-col h-full cursor-pointer select-none"
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKey}
    >
      {/* Top-right icon buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit"
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <Pencil className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <Trash className="w-4 h-4 text-red-600" />
        </button>
      </div>

      {/* Image */}
      <div className="relative flex-shrink-0">
        {dream.image ? (
          <img src={dream.image} alt={dream.title} className="w-full h-40 object-cover rounded-t-lg" draggable={false} />
        ) : (
          <div className="w-full h-40 bg-gray-200 rounded-t-lg flex items-center justify-center">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-white px-2 py-1 rounded-full text-xs font-medium">
          {dream.category}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full">
        <h3 className="font-semibold text-gray-900 mb-2 mt-3">{dream.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3">
          {dream.description}
        </p>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{dream.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-dream-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${dream.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Footer with primary action */}
        <div className="mt-auto pt-4">
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default DreamBook;