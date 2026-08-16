/**
 * Bookmark Domain Entity
 */

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  tags?: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  customIcon?: string;
}
