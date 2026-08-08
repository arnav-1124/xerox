import React, { useState } from 'react';
import { ExternalLink, Star, Trash2, Edit3, Globe, Folder, Search } from 'lucide-react';
import { Bookmark } from '../types';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  selectedCategory: string | null;
  searchQuery: string;
  onToggleFavorite: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  selectedCategory,
  searchQuery,
  onToggleFavorite,
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const filteredBookmarks = bookmarks.filter((bm) => {
    const matchesCategory = selectedCategory ? bm.category === selectedCategory : true;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      bm.title.toLowerCase().includes(q) ||
      bm.url.toLowerCase().includes(q) ||
      bm.category.toLowerCase().includes(q) ||
      (bm.description && bm.description.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const getFaviconUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return '';
    }
  };

  const getDomainName = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            {selectedCategory ? `${selectedCategory} Bookmarks` : 'All Bookmarks'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Showing {filteredBookmarks.length} {filteredBookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
          </p>
        </div>
      </div>

      {/* Grid or Empty state */}
      {filteredBookmarks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto text-xl">
            🔖
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No bookmarks found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No items matching "${searchQuery}".`
                : 'Get started by creating your first bookmark in this category.'}
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all inline-flex items-center gap-2"
          >
            <span>+ Add Bookmark</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookmarks.map((bm) => {
            const favicon = getFaviconUrl(bm.url);
            const domain = getDomainName(bm.url);
            const hasImgError = imgErrors[bm.id];

            return (
              <div
                key={bm.id}
                className="group relative bg-card hover:bg-accent/40 border border-border hover:border-ring rounded-xl p-4 transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Favicon / Icon Badge */}
                      <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {favicon && !hasImgError ? (
                          <img
                            src={favicon}
                            alt={bm.title}
                            className="w-5 h-5 object-contain"
                            onError={() => setImgErrors((prev) => ({ ...prev, [bm.id]: true }))}
                          />
                        ) : (
                          <Globe className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <a
                          href={bm.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm text-foreground hover:text-blue-500 dark:hover:text-blue-400 transition-colors truncate block flex items-center gap-1 group-hover:underline"
                        >
                          <span className="truncate">{bm.title}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <span className="text-[11px] text-muted-foreground font-mono block truncate">{domain}</span>
                      </div>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => onToggleFavorite(bm.id)}
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                        bm.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={bm.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-4 h-4 ${bm.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {bm.description && (
                    <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">{bm.description}</p>
                  )}
                </div>

                {/* Footer Meta & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border text-[11px] text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-muted border border-border text-foreground font-medium">
                    {bm.category}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(bm)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit Bookmark"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(bm.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
