/**
 * Import/Export Application Service
 * Multi-format parser for Chrome, Bitwarden, 1Password, Firefox CSV, and Xerox JSON imports.
 * Provides pre-import preview metadata and duplicate detection.
 */

import { PasswordEntry, Bookmark } from '../../types';

export interface ImportPreviewResult {
  totalLogins: number;
  totalNotes: number;
  totalCards: number;
  totalBookmarks: number;
  duplicateCount: number;
  invalidCount: number;
  loginsToImport: PasswordEntry[];
  bookmarksToImport: Bookmark[];
  duplicates: PasswordEntry[];
}

export class ImportExportService {
  /**
   * Parses CSV or JSON file and returns a pre-import preview result.
   */
  async parseImportFile(
    file: File,
    existingLogins: PasswordEntry[] = []
  ): Promise<ImportPreviewResult> {
    const text = await file.text();

    if (file.name.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      return this.parseJSONImport(text, existingLogins);
    }

    return this.parseCSVImport(text, existingLogins);
  }

  private parseJSONImport(text: string, existingLogins: PasswordEntry[]): ImportPreviewResult {
    try {
      const data = JSON.parse(text);
      const rawLogins = Array.isArray(data) ? data : data.passwords || data.items || data.encryptedVault || [];
      const rawBookmarks = data.bookmarks || [];

      const existingMap = new Set(
        existingLogins.map((e) => `${this.normalizeHost(e.websiteUrl)}:${e.username.toLowerCase()}`)
      );

      const loginsToImport: PasswordEntry[] = [];
      const duplicates: PasswordEntry[] = [];
      let invalidCount = 0;
      let notesCount = 0;
      let cardsCount = 0;

      rawLogins.forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') {
          invalidCount++;
          return;
        }

        const entry: PasswordEntry = {
          id: item.id || `import_${Date.now()}_${idx}`,
          websiteName: item.websiteName || item.title || item.name || 'Imported Entry',
          websiteUrl: item.websiteUrl || item.url || item.login?.uris?.[0]?.uri || '',
          username: item.username || item.login?.username || item.email || '',
          password: item.password || item.login?.password || '',
          notes: item.notes || item.notesPlain || '',
          category: item.category || 'Imported',
          tags: item.tags || [],
          isFavorite: !!item.isFavorite,
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
          totpSecret: item.totpSecret || item.login?.totp || '',
          entryType: item.entryType || (item.cardDetails ? 'card' : item.notes && !item.password ? 'note' : 'login'),
        };

        if (entry.entryType === 'note') notesCount++;
        if (entry.entryType === 'card') cardsCount++;

        const key = `${this.normalizeHost(entry.websiteUrl)}:${entry.username.toLowerCase()}`;
        if (existingMap.has(key)) {
          duplicates.push(entry);
        } else {
          loginsToImport.push(entry);
        }
      });

      return {
        totalLogins: loginsToImport.length + duplicates.length - notesCount - cardsCount,
        totalNotes: notesCount,
        totalCards: cardsCount,
        totalBookmarks: rawBookmarks.length,
        duplicateCount: duplicates.length,
        invalidCount,
        loginsToImport,
        bookmarksToImport: rawBookmarks,
        duplicates,
      };
    } catch {
      return {
        totalLogins: 0,
        totalNotes: 0,
        totalCards: 0,
        totalBookmarks: 0,
        duplicateCount: 0,
        invalidCount: 1,
        loginsToImport: [],
        bookmarksToImport: [],
        duplicates: [],
      };
    }
  }

  private parseCSVImport(text: string, existingLogins: PasswordEntry[]): ImportPreviewResult {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length <= 1) {
      return {
        totalLogins: 0,
        totalNotes: 0,
        totalCards: 0,
        totalBookmarks: 0,
        duplicateCount: 0,
        invalidCount: 0,
        loginsToImport: [],
        bookmarksToImport: [],
        duplicates: [],
      };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    const urlIdx = headers.findIndex((h) => h.includes('url') || h.includes('location'));
    const userIdx = headers.findIndex((h) => h.includes('user') || h.includes('login') || h.includes('email'));
    const passIdx = headers.findIndex((h) => h.includes('pass') || h.includes('secret'));
    const titleIdx = headers.findIndex((h) => h.includes('title') || h.includes('name'));
    const notesIdx = headers.findIndex((h) => h.includes('note'));

    const existingMap = new Set(
      existingLogins.map((e) => `${this.normalizeHost(e.websiteUrl)}:${e.username.toLowerCase()}`)
    );

    const loginsToImport: PasswordEntry[] = [];
    const duplicates: PasswordEntry[] = [];
    let invalidCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCSVLine(lines[i]);
      if (cols.length < 2) {
        invalidCount++;
        continue;
      }

      const url = urlIdx >= 0 ? cols[urlIdx] || '' : '';
      const username = userIdx >= 0 ? cols[userIdx] || '' : '';
      const password = passIdx >= 0 ? cols[passIdx] || '' : '';
      const title = titleIdx >= 0 ? cols[titleIdx] || '' : this.normalizeHost(url) || 'Imported Entry';
      const notes = notesIdx >= 0 ? cols[notesIdx] || '' : '';

      if (!password && !username && !url) {
        invalidCount++;
        continue;
      }

      const entry: PasswordEntry = {
        id: `csv_${Date.now()}_${i}`,
        websiteName: title,
        websiteUrl: url,
        username: username,
        password: password,
        notes: notes,
        category: 'Imported',
        tags: [],
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        entryType: 'login',
      };

      const key = `${this.normalizeHost(url)}:${username.toLowerCase()}`;
      if (existingMap.has(key)) {
        duplicates.push(entry);
      } else {
        loginsToImport.push(entry);
      }
    }

    return {
      totalLogins: loginsToImport.length + duplicates.length,
      totalNotes: 0,
      totalCards: 0,
      totalBookmarks: 0,
      duplicateCount: duplicates.length,
      invalidCount,
      loginsToImport,
      bookmarksToImport: [],
      duplicates,
    };
  }

  private normalizeHost(url: string): string {
    if (!url) return '';
    try {
      const u = url.startsWith('http') ? url : `https://${url}`;
      return new URL(u).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return url.toLowerCase().replace(/^www\./, '');
    }
  }

  private parseCSVLine(line: string): string[] {
    const res: string[] = [];
    let curr = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        res.push(curr.trim().replace(/^"/, '').replace(/"$/, ''));
        curr = '';
      } else {
        curr += char;
      }
    }
    res.push(curr.trim().replace(/^"/, '').replace(/"$/, ''));
    return res;
  }
}

export const defaultImportExportService = new ImportExportService();
