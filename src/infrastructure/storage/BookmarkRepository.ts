/**
 * Bookmark Storage Repository Abstraction & IndexedDB Adapter
 */

import { Bookmark } from '../../types';
import { getBookmarks, saveAllBookmarks, saveBookmark, deleteBookmarkDB } from '../../lib/db';

export interface IBookmarkRepository {
  getAll(): Promise<Bookmark[]>;
  saveAll(bookmarks: Bookmark[]): Promise<void>;
  save(bookmark: Bookmark): Promise<void>;
  delete(id: string): Promise<void>;
}

export class IndexedDBBookmarkRepository implements IBookmarkRepository {
  async getAll(): Promise<Bookmark[]> {
    return await getBookmarks();
  }

  async saveAll(bookmarks: Bookmark[]): Promise<void> {
    await saveAllBookmarks(bookmarks);
  }

  async save(bookmark: Bookmark): Promise<void> {
    await saveBookmark(bookmark);
  }

  async delete(id: string): Promise<void> {
    await deleteBookmarkDB(id);
  }
}

export const defaultBookmarkRepository: IBookmarkRepository = new IndexedDBBookmarkRepository();
