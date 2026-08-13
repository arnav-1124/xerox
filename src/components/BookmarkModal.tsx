import React, { useState, useEffect } from 'react';
import { X, Bookmark as BookmarkIcon } from 'lucide-react';
import { Bookmark, Category } from '../types';
import { getCategoryPath } from '../lib/categoryHelper';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: Bookmark) => void;
  initialBookmark?: Bookmark | null;
  categories: Category[];
  defaultCategoryId?: string;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBookmark,
  categories,
  defaultCategoryId,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (initialBookmark) {
      setTitle(initialBookmark.title);
      setUrl(initialBookmark.url);
      const matched = categories.find(c => c.id === initialBookmark.category || c.name === initialBookmark.category);
      setCategory(matched ? matched.id : (categories[0]?.id || ''));
      setDescription(initialBookmark.description || '');
      setIsFavorite(initialBookmark.isFavorite);
    } else {
      setTitle('');
      setUrl('');
      setCategory(defaultCategoryId || categories[0]?.id || '');
      setDescription('');
      setIsFavorite(false);
    }
  }, [initialBookmark, isOpen, categories, defaultCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const bookmark: Bookmark = {
      id: initialBookmark?.id || 'bm-' + Date.now(),
      title: title.trim(),
      url: formattedUrl,
      category,
      description: description.trim(),
      isFavorite,
      createdAt: initialBookmark?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(bookmark);
    onClose();
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
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
            <BookmarkIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {initialBookmark ? 'Edit Bookmark' : 'Add New Bookmark'}
            </h3>
            <p className="text-xs text-muted-foreground">Save website links for quick offline access.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-foreground font-medium mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. GitHub Dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
            />
          </div>

          <div>
            <label className="block text-foreground font-medium mb-1">Website URL</label>
            <input
              type="text"
              required
              placeholder="https://github.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-foreground font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground outline-none focus:border-ring transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">
                    {getCategoryPath(c.id, categories)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-foreground select-none">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="rounded bg-muted border-border text-blue-600 focus:ring-0"
                />
                <span>Favorite ★</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-foreground font-medium mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief notes about this bookmark..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs transition-all"
            >
              {initialBookmark ? 'Save Changes' : 'Create Bookmark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
