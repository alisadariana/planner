import * as vscode from "vscode";
import * as path from "path";
import { OperationStrategy } from "../types";
import { EditorAdapter } from "../editorAdapter";
import { Disposable } from "../commandHandler";

export class VSCodeEditorAdapterImpl implements EditorAdapter {
  public getActiveFilePath(): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error("No file is currently open");
    }

    const filePath = editor.document.fileName;
    if (path.extname(filePath) !== ".md") {
      throw new Error("Only markdown files can have subcards");
    }

    return filePath;
  }

  async promptForCardName(isSubcard: boolean): Promise<string | undefined> {
    return vscode.window.showInputBox({
      prompt: `Enter name for the new ${isSubcard ? "subcard" : "card"}`,
      placeHolder: `${isSubcard ? "Subcard" : "Card"} name`,
      validateInput: (value: string) => {
        if (!value.trim()) {
          return "Name cannot be empty";
        }
        if (value.includes("/") || value.includes("\\")) {
          return "Name cannot contain path separators";
        }
        return null;
      },
    });
  }

  async promptDeleteWithSubcards(
    nodeName: string,
    subcardCount: number
  ): Promise<OperationStrategy> {
    const message = `"${nodeName}" has ${subcardCount} subcard${
      subcardCount > 1 ? "s" : ""
    }. What would you like to do?`;

    const result = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      "Delete All",
      "Keep Subcards"
    );

    switch (result) {
      case "Delete All":
        return OperationStrategy.Cascade;
      case "Keep Subcards":
        return OperationStrategy.Preserve;
      default:
        return OperationStrategy.Cancel;
    }
  }

  async confirmDeletion(nodeName: string, isDeck: boolean): Promise<boolean> {
    const message = isDeck
      ? `Are you sure you want to delete the deck "${nodeName}" and all its contents?`
      : `Are you sure you want to delete the card "${nodeName}"?`;

    const result = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      "Delete"
    );

    return result === "Delete";
  }

  showError(message: string): void {
    vscode.window.showErrorMessage(message);
  }

  showSuccess(message: string): void {
    vscode.window.showInformationMessage(message);
  }

  registerCommand(id: string, callback: () => Promise<void>): Disposable {
    const vscodeDisposable: vscode.Disposable = vscode.commands.registerCommand(
      id,
      callback
    );
    return {
      dispose: () => vscodeDisposable.dispose(),
    };
  }

  handleCommandError(message: string): void {
    this.showError(message);
  }

  handleCommandSuccess(message?: string, refresh?: () => void): void {
    if (message) {
      this.showSuccess(message);
    }
    if (refresh) {
      refresh();
    }
  }
}
