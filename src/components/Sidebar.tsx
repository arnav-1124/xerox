import React, { useState } from 'react';
import { Home, Bookmark, KeyRound, Star, Folder, FolderOpen, Settings, Puzzle, Lock, Shield, ShieldCheck, BookOpen, ChevronLeft, ChevronRight, ChevronDown, Wand2, Database, FileText, Clock } from 'lucide-react';
import { Category, ViewMode } from '../types';
import { CategoryNode, buildCategoryTree } from '../lib/categoryHelper';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (catName: string | null) => void;
  isUnlocked: boolean;
  onOpenCategoryManager: () => void;
  bookmarkCount: number;
  passwordCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  categories,
  selectedCategory,
  onSelectCategory,
  isUnlocked,
  onOpenCategoryManager,
  bookmarkCount,
  passwordCount,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleExpandCat = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const renderCategoryTree = (nodes: CategoryNode[], level: number = 0) => {
    return nodes.map((node) => {
      const cat = node.category;
      const children = node.children;
      const hasChildren = children.length > 0;
      const isExpanded = !!expandedCats[cat.id];
      const isSelected = selectedCategory === cat.id || selectedCategory === cat.name;

      return (
        <div key={cat.id} className="space-y-0.5">
          <button
            onClick={() => {
              if (currentView !== 'bookmarks' && currentView !== 'passwords') {
                onSelectView('bookmarks');
              }
              onSelectCategory(cat.id);
              if (hasChildren) {
                setExpandedCats(prev => ({ ...prev, [cat.id]: !prev[cat.id] }));
              }
              if (onCloseMobile) onCloseMobile();
            }}
            title={isCollapsed ? cat.name : undefined}
            className={`w-full flex items-center justify-between rounded-md text-xs transition-all py-1.5 cursor-pointer ${
              isCollapsed 
                ? 'justify-center px-0' 
                : 'px-2 hover:bg-sidebar-accent/50'
            } ${
              isSelected
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border border-sidebar-border/30 shadow-xs'
                : 'text-muted-foreground hover:text-sidebar-foreground'
            }`}
            style={{ paddingLeft: !isCollapsed ? `${level * 12 + 8}px` : undefined }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Chevron icon for expand/collapse */}
              {!isCollapsed && hasChildren ? (
                <span
                  onClick={(e) => toggleExpandCat(cat.id, e)}
                  className="p-0.5 hover:bg-muted/30 rounded transition-colors text-muted-foreground cursor-pointer shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </span>
              ) : !isCollapsed ? (
                <span className="w-4 h-4 shrink-0" />
              ) : null}

              {/* Folder Icon */}
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color || '#3b82f6' }} />
              ) : (
                <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color || '#3b82f6' }} />
              )}
              
              {!isCollapsed && <span className="truncate">{cat.name}</span>}
            </div>
          </button>

          {/* Children nodes */}
          {!isCollapsed && hasChildren && isExpanded && (
            <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-150">
              {renderCategoryTree(children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const navItems = [
    { id: 'home' as ViewMode, label: 'Home Overview', icon: Home },
    { id: 'blog' as ViewMode, label: 'Feature Guide & Docs', icon: BookOpen },
    { id: 'bookmarks' as ViewMode, label: 'Bookmarks', icon: Bookmark, badge: bookmarkCount },
    { id: 'passwords' as ViewMode, label: 'Password Vault', icon: KeyRound, badge: isUnlocked ? passwordCount : '🔒' },
    { id: 'totp' as ViewMode, label: '2FA TOTP Codes', icon: Clock },
    { id: 'files' as ViewMode, label: 'Encrypted Files', icon: FileText },
    { id: 'generator' as ViewMode, label: 'Password Studio', icon: Wand2 },
    { id: 'import-export' as ViewMode, label: 'Import / Export', icon: Database },
    { id: 'security-audit' as ViewMode, label: 'Security Health', icon: ShieldCheck },
    { id: 'favorites' as ViewMode, label: 'Favorites', icon: Star },
    { id: 'extension' as ViewMode, label: 'Browser Extension', icon: Puzzle, highlight: true },
    { id: 'settings' as ViewMode, label: 'Settings & Storage', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-auto bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col justify-between h-screen shrink-0 select-none transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}
      >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div className="p-3 sm:p-4 border-b border-sidebar-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md font-bold text-lg shrink-0">
              🔐
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-sidebar-foreground tracking-tight leading-none truncate">
                  Xerox
                </h1>
                <p className="text-[11px] text-muted-foreground font-medium mt-1 truncate">
                  Local Vault & Links
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Navigation (2 parts) */}
        <nav className="p-2 sm:p-3 space-y-1 overflow-y-auto flex-[2] min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onSelectCategory(null);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2.5'
                } rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-sidebar-border shadow-xs'
                    : item.highlight
                    ? 'text-blue-500 dark:text-blue-400 hover:bg-sidebar-accent/60'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-muted-foreground'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge !== undefined && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Categories Section (1 part) */}
        <div className="px-2 sm:px-3 pt-3 border-t border-sidebar-border mt-1 flex-[1] min-h-0 flex flex-col">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-3 mb-2 shrink-0">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Categories</span>
              <button
                onClick={onOpenCategoryManager}
                className="text-[11px] text-blue-500 dark:text-blue-400 hover:underline font-medium transition-colors"
              >
                Manage
              </button>
            </div>
          ) : (
            <div className="flex justify-center mb-2 shrink-0">
              <button
                onClick={onOpenCategoryManager}
                className="p-1 rounded text-muted-foreground hover:text-sidebar-foreground"
                title="Manage Categories"
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Clean Scrollable List taking full remaining height */}
          <div className="space-y-0.5 overflow-y-auto flex-1 min-h-0 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => onSelectCategory(null)}
              title={isCollapsed ? 'All Categories' : undefined}
              className={`w-full flex items-center cursor-pointer ${
                isCollapsed ? 'justify-center px-0 py-2' : 'gap-2 px-3 py-1.5'
              } rounded-md text-xs transition-all ${
                selectedCategory === null && (currentView === 'bookmarks' || currentView === 'passwords')
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {!isCollapsed && <span>All Categories</span>}
            </button>

            {renderCategoryTree(buildCategoryTree(categories))}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar/50 shrink-0">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} text-xs text-muted-foreground`}>
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" title={isCollapsed ? 'Local-First Vault' : undefined} />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sidebar-foreground truncate">Local-First Vault</span>
              <span className="text-[10px] text-muted-foreground truncate">Zero Cloud Storage</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  </>
);
};
