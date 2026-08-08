import React, { useState } from 'react';
import { X, Plus, Trash2, Folder, Edit2, Check } from 'lucide-react';
import { Category } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
}

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim(), selectedColor);
    setNewCatName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-popover border border-border rounded-2xl p-6 shadow-2xl text-popover-foreground relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Category Manager</h3>
            <p className="text-xs text-muted-foreground">Organize bookmarks & passwords into custom groups.</p>
          </div>
        </div>

        {/* Add new category form */}
        <form onSubmit={handleAdd} className="space-y-3 mb-6 bg-muted p-3.5 rounded-xl border border-border">
          <span className="text-xs font-semibold text-foreground block">Create New Category</span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Category Name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-popover border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Add
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">Badge Color:</span>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    selectedColor === color ? 'scale-125 ring-2 ring-primary' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </form>

        {/* Categories List */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-muted border border-border text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#3b82f6' }} />
                <span className="font-medium text-foreground">{cat.name}</span>
                {cat.isDefault && (
                  <span className="text-[10px] text-muted-foreground bg-popover px-1.5 py-0.5 rounded border border-border">
                    System
                  </span>
                )}
              </div>

              {!cat.isDefault && (
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
