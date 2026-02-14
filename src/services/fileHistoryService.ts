import { ProjectFile } from '@/types';

export interface FileSnapshot {
  fileId: string;
  path: string;
  content: string;
  timestamp: number;
}

export interface ChangeSet {
  id: string;
  messageId: string;
  projectId: string;
  timestamp: number;
  snapshots: FileSnapshot[];
  description?: string;
}

class FileHistoryService {
  private static MAX_HISTORY_SIZE = 50;
  private changeHistory: Map<string, ChangeSet[]> = new Map(); // projectId -> ChangeSet[]

  createSnapshot(file: ProjectFile): FileSnapshot {
    return {
      fileId: file.id,
      path: file.path,
      content: file.content,
      timestamp: Date.now()
    };
  }

  saveChangeSet(projectId: string, messageId: string, files: ProjectFile[], description?: string): ChangeSet {
    const changeSet: ChangeSet = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      projectId,
      timestamp: Date.now(),
      snapshots: files.map(file => this.createSnapshot(file)),
      description
    };

    // Get or create history for project
    if (!this.changeHistory.has(projectId)) {
      this.changeHistory.set(projectId, []);
    }

    const projectHistory = this.changeHistory.get(projectId)!;
    projectHistory.push(changeSet);

    // Keep only last MAX_HISTORY_SIZE changes
    if (projectHistory.length > FileHistoryService.MAX_HISTORY_SIZE) {
      projectHistory.shift();
    }

    // Also save to localStorage for persistence
    this.saveToLocalStorage(projectId);

    return changeSet;
  }

  getChangeHistory(projectId: string): ChangeSet[] {
    // Try to load from localStorage if not in memory
    if (!this.changeHistory.has(projectId)) {
      this.loadFromLocalStorage(projectId);
    }
    return this.changeHistory.get(projectId) || [];
  }

  getChangeSetByMessageId(projectId: string, messageId: string): ChangeSet | undefined {
    const history = this.getChangeHistory(projectId);
    return history.find(cs => cs.messageId === messageId);
  }

  getLatestChangeSet(projectId: string): ChangeSet | undefined {
    const history = this.getChangeHistory(projectId);
    return history[history.length - 1];
  }

  clearHistory(projectId: string): void {
    this.changeHistory.delete(projectId);
    localStorage.removeItem(`file_history_${projectId}`);
  }

  private saveToLocalStorage(projectId: string): void {
    const history = this.changeHistory.get(projectId);
    if (history) {
      try {
        localStorage.setItem(`file_history_${projectId}`, JSON.stringify(history));
      } catch (e) {
        console.error('Failed to save file history to localStorage:', e);
        // If localStorage is full, remove oldest entries
        if (history.length > 10) {
          const recentHistory = history.slice(-10);
          this.changeHistory.set(projectId, recentHistory);
          localStorage.setItem(`file_history_${projectId}`, JSON.stringify(recentHistory));
        }
      }
    }
  }

  private loadFromLocalStorage(projectId: string): void {
    try {
      const stored = localStorage.getItem(`file_history_${projectId}`);
      if (stored) {
        const history = JSON.parse(stored) as ChangeSet[];
        this.changeHistory.set(projectId, history);
      }
    } catch (e) {
      console.error('Failed to load file history from localStorage:', e);
    }
  }
}

export const fileHistoryService = new FileHistoryService();