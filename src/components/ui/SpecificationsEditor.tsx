import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { PlusCircle, Trash, Edit, Check, X, ListPlus } from 'lucide-react';

type SpecificationItem = {
  key: string;
  value: string;
};

interface SpecificationsEditorProps {
  initialSpecifications?: Record<string, string> | null;
  onChange: (specifications: Record<string, string>) => void;
}

// Common specification suggestions
const COMMON_SPECS = [
  { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g., 1080x1080px, 1920x1080px' },
  { key: 'format', label: 'Format', placeholder: 'e.g., PDF, JPG, MP4' },
  { key: 'target_audience', label: 'Target Audience', placeholder: 'e.g., 25-34 age, professionals' },
  { key: 'color_mode', label: 'Color Mode', placeholder: 'e.g., RGB, CMYK' },
  { key: 'resolution', label: 'Resolution', placeholder: 'e.g., 300dpi, 72dpi' },
  { key: 'font', label: 'Font', placeholder: 'e.g., Arial, Helvetica, Brand font' },
  { key: 'duration', label: 'Duration', placeholder: 'e.g., 30 seconds, 2 minutes' },
  { key: 'word_count', label: 'Word Count', placeholder: 'e.g., 250-300 words, max 150 words' },
  { key: 'platform', label: 'Platform', placeholder: 'e.g., Instagram, LinkedIn, Website' },
];

export const SpecificationsEditor: React.FC<SpecificationsEditorProps> = ({
  initialSpecifications = {},
  onChange,
}) => {
  const [items, setItems] = useState<SpecificationItem[]>(() => {
    if (!initialSpecifications) return [];
    return Object.entries(initialSpecifications).map(([key, value]) => ({
      key,
      value: value?.toString() || '',
    }));
  });
  
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Convert items to the format expected by the parent component
  const updateParent = (newItems: SpecificationItem[]) => {
    const specifications: Record<string, string> = {};
    newItems.forEach((item) => {
      if (item.key.trim()) {
        specifications[item.key.trim()] = item.value;
      }
    });
    onChange(specifications);
  };

  const handleAddItem = () => {
    if (!newKey.trim()) return;
    
    // Check for duplicate key
    if (items.some((item) => item.key.toLowerCase() === newKey.trim().toLowerCase())) {
      alert('A specification with this key already exists.');
      return;
    }
    
    const updatedItems = [...items, { key: newKey.trim(), value: newValue }];
    setItems(updatedItems);
    updateParent(updatedItems);
    
    // Reset form
    setNewKey('');
    setNewValue('');
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditKey(items[index].key);
    setEditValue(items[index].value);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    if (!editKey.trim()) {
      alert('Key cannot be empty');
      return;
    }
    
    // Check for duplicate key, excluding the current one
    const duplicateKey = items.some(
      (item, index) => 
        index !== editingIndex && 
        item.key.toLowerCase() === editKey.trim().toLowerCase()
    );
    
    if (duplicateKey) {
      alert('A specification with this key already exists.');
      return;
    }
    
    const updatedItems = [...items];
    updatedItems[editingIndex] = { key: editKey.trim(), value: editValue };
    setItems(updatedItems);
    updateParent(updatedItems);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    updateParent(updatedItems);
  };

  const handleAddSuggestion = (suggestion: { key: string; placeholder: string }) => {
    // Check if this key already exists
    if (items.some((item) => item.key.toLowerCase() === suggestion.key.toLowerCase())) {
      // If it exists, highlight it somehow or focus on it
      alert(`A specification for "${suggestion.key}" already exists.`);
      return;
    }
    
    // Add a new empty specification with this key
    setNewKey(suggestion.key);
    setNewValue('');
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      {/* List existing specifications */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-md"
            >
              {editingIndex === index ? (
                // Edit mode
                <>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      value={editKey}
                      onChange={(e) => setEditKey(e.target.value)}
                      placeholder="Key"
                      className="text-sm"
                    />
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Value"
                      className="text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveEdit}
                    className="h-8 w-8 text-green-600"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelEdit}
                    className="h-8 w-8 text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                // View mode
                <>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="font-medium text-gray-700 truncate">{item.key}:</div>
                    <div className="text-gray-600 truncate">{item.value}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartEdit(index)}
                    className="h-8 w-8 text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="h-8 w-8 text-red-600"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Common specification suggestions */}
      {showSuggestions && (
        <div className="bg-gray-50 p-3 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Common Specifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {COMMON_SPECS.map((spec) => (
              <button
                key={spec.key}
                type="button"
                onClick={() => handleAddSuggestion(spec)}
                className="flex items-center text-left text-sm p-2 hover:bg-gray-100 rounded-md"
              >
                <PlusCircle className="h-3 w-3 text-blue-500 mr-1 flex-shrink-0" />
                <div>
                  <span className="font-medium">{spec.label}</span>
                  <span className="text-xs text-gray-500 block">
                    {spec.placeholder}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add new specification */}
      <div className="grid grid-cols-1 gap-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Add Specification</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -mr-1"
          >
            <ListPlus className="h-4 w-4 mr-1" />
            {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key (e.g., dimensions, format)"
            className="text-sm"
          />
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value (e.g., 1080x1080px, PDF)"
            className="text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={!newKey.trim()}
          className="w-full"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Specification
        </Button>
      </div>
    </div>
  );
}; 