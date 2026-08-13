import { Category } from '../types';

export interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}

/**
 * Builds a hierarchical category tree from a flat list of categories.
 */
export const buildCategoryTree = (flatCats: Category[]): CategoryNode[] => {
  const map: Record<string, CategoryNode> = {};
  const roots: CategoryNode[] = [];

  flatCats.forEach((cat) => {
    map[cat.id] = { category: cat, children: [] };
  });

  flatCats.forEach((cat) => {
    const node = map[cat.id];
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

/**
 * Resolves the full hierarchical path of a category (e.g. "Work > Projects > Marketing").
 */
export const getCategoryPath = (catId: string, flatCats: Category[]): string => {
  const parts: string[] = [];
  let curr = flatCats.find((c) => c.id === catId);
  while (curr) {
    parts.unshift(curr.name);
    curr = curr.parentId ? flatCats.find((c) => c.id === curr!.parentId) : undefined;
  }
  return parts.length > 0 ? parts.join(' > ') : 'General';
};

/**
 * Traverses descendants recursively to collect all child category IDs and names (for robust item filtering).
 */
export const getDescendantCategoryIdsAndNames = (
  catId: string,
  flatCats: Category[]
): { ids: string[]; names: string[] } => {
  const ids: string[] = [catId];
  const names: string[] = [];

  const targetCat = flatCats.find((c) => c.id === catId);
  if (targetCat) names.push(targetCat.name);

  const recurse = (parentId: string) => {
    flatCats.forEach((c) => {
      if (c.parentId === parentId) {
        ids.push(c.id);
        names.push(c.name);
        recurse(c.id);
      }
    });
  };

  recurse(catId);
  return { ids, names };
};
