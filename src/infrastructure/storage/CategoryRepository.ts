/**
 * Category Storage Repository Abstraction & IndexedDB Adapter
 */

import { Category } from '../../types';
import { getCategories, saveAllCategories, saveCategoryDB, deleteCategoryDB } from '../../lib/db';

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  saveAll(categories: Category[]): Promise<void>;
  save(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
}

export class IndexedDBCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return await getCategories();
  }

  async saveAll(categories: Category[]): Promise<void> {
    await saveAllCategories(categories);
  }

  async save(category: Category): Promise<void> {
    await saveCategoryDB(category);
  }

  async delete(id: string): Promise<void> {
    await deleteCategoryDB(id);
  }
}

export const defaultCategoryRepository: ICategoryRepository = new IndexedDBCategoryRepository();
