/**
 * Category Domain Entity
 */

export interface Category {
  id: string;
  name: string;
  color?: string;
  isDefault?: boolean;
  parentId?: string;
}

export interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}
