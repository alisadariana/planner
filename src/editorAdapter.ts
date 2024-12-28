import { OperationStrategy, PlannerTreeNode } from "./types";
import { Disposable } from "./commandHandler";

export interface EditorAdapter {
  getActiveFilePath(): string;
  promptForCardName(isSubcard: boolean): Promise<string | undefined>;
  promptDeleteWithSubcards(
    nodeName: string,
    subcardCount: number
  ): Promise<OperationStrategy>;
  confirmDeletion(nodeName: string, isDeck: boolean): Promise<boolean>;
  showError(message: string): void;
  showSuccess(message: string): void;
  registerCommand(
    id: string,
    callback: (...args: unknown[]) => Promise<void>
  ): Disposable;
  handleCommandError(message: string): void;
  handleCommandSuccess(message?: string, refresh?: () => void): void;
}
