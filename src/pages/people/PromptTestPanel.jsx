// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { Play, Loader2, X, Image as ImageIcon, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import promptService from '../../services/promptService';

/**
 * Image Generation Test Panel
 */
export function ImageTestPanel({ promptType, prompts, styleModifiers }) {
  const [testInput, setTestInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const isDreamPrompt = promptType === 'dream';

  const handleTest = async () => {
    if (!testInput.trim()) {
      setError('Please enter a test search term');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await promptService.testImageGeneration(
        testInput.trim(),
        isDreamPrompt ? 'dream' : 'background_card',
        selectedStyle || null
      );

      if (result.success) {
        setResult(result.data);
      } else {
        setError(result.error || 'Failed to generate image');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="mt-2 flex items-center gap-2 text-sm text-netsurit-red hover:text-netsurit-coral transition-colors"
        data-testid={`test-${promptType}-button`}
      >
        <Play className="h-4 w-4" />
        Test {isDreamPrompt ? 'Dream Image' : 'Background Card'} Prompt
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 border border-netsurit-red/30 rounded-lg bg-netsurit-red/5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-professional-gray-900 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-netsurit-red" />
          Test {isDreamPrompt ? 'Dream Image' : 'Background Card'} Generation
        </h4>
        <button
          onClick={() => {
            setShowPanel(false);
            setResult(null);
            setError(null);
          }}
          className="text-professional-gray-400 hover:text-professional-gray-600"
          aria-label="Close test panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-professional-gray-700 mb-1">
            Test Search Term
          </label>
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="e.g., becoming a successful entrepreneur"
            className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleTest()}
          />
        </div>

        {isDreamPrompt && styleModifiers && Object.keys(styleModifiers).length > 0 && (
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">
              Style Modifier (Optional)
            </label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red text-sm"
            >
              <option value="">None</option>
              {Object.entries(styleModifiers).map(([id, style]) => (
                <option key={id} value={id}>
                  {style.label || id}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleTest}
          disabled={loading || !testInput.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-netsurit-red text-white rounded-lg hover:bg-netsurit-coral disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Generate Test Image
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 mb-1">Image Generated Successfully!</p>
                {result.revisedPrompt && (
                  <p className="text-xs text-green-700 italic">Revised Prompt: {result.revisedPrompt}</p>
                )}
              </div>
            </div>
            <div className="border border-professional-gray-200 rounded-lg overflow-hidden">
              <img
                src={result.url}
                alt="Generated test image"
                className="w-full h-auto"
                data-testid="test-image-result"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Vision Generation Test Panel
 */
export function VisionTestPanel({ promptType, prompts }) {
  const [testInput, setTestInput] = useState('');
  const [testDreams, setTestDreams] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const isGenerate = promptType === 'generate';

  const handleTest = async () => {
    if (!testInput.trim()) {
      setError('Please enter test input');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse dreams from text input (one per line)
      const dreams = testDreams
        .split('\n')
        .filter(line => line.trim())
        .map(line => ({ title: line.trim(), category: 'general' }));

      const result = await promptService.testVisionGeneration(
        testInput.trim(),
        isGenerate ? 'generate' : 'polish',
        dreams
      );

      if (result.success) {
        setResult(result.data);
      } else {
        setError(result.error || 'Failed to generate vision');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate vision');
    } finally {
      setLoading(false);
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="mt-2 flex items-center gap-2 text-sm text-netsurit-coral hover:text-netsurit-red transition-colors"
        data-testid={`test-${promptType}-vision-button`}
      >
        <Play className="h-4 w-4" />
        Test {isGenerate ? 'Generate' : 'Polish'} Vision Prompt
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 border border-netsurit-coral/30 rounded-lg bg-netsurit-coral/5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-professional-gray-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-netsurit-coral" />
          Test {isGenerate ? 'Generate' : 'Polish'} Vision Statement
        </h4>
        <button
          onClick={() => {
            setShowPanel(false);
            setResult(null);
            setError(null);
          }}
          className="text-professional-gray-400 hover:text-professional-gray-600"
          aria-label="Close test panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-professional-gray-700 mb-1">
            {isGenerate ? 'User Input (Goals, Hopes, Mindset)' : 'Existing Vision Statement'}
          </label>
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder={isGenerate 
              ? "e.g., I want to grow my career, build meaningful relationships, and achieve financial freedom..."
              : "e.g., I am building a life filled with purpose, connection, and growth..."
            }
            className="w-full h-24 px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-coral text-sm"
          />
        </div>

        {isGenerate && (
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">
              Test Dreams (one per line, optional)
            </label>
            <textarea
              value={testDreams}
              onChange={(e) => setTestDreams(e.target.value)}
              placeholder="e.g., Start my own business&#10;Travel to 10 countries&#10;Learn a new language"
              className="w-full h-20 px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-coral text-sm"
            />
            <p className="mt-1 text-xs text-professional-gray-500">Enter one dream per line</p>
          </div>
        )}

        <button
          onClick={handleTest}
          disabled={loading || !testInput.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-netsurit-coral text-white rounded-lg hover:bg-netsurit-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {isGenerate ? 'Generate' : 'Polish'} Test Vision
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-800">Vision Generated Successfully!</p>
            </div>
            <div className="mt-2 p-3 bg-white rounded border border-green-200">
              <p className="text-sm text-professional-gray-800 whitespace-pre-wrap leading-relaxed">
                {result.text}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
