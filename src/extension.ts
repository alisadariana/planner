import * as vscode from "vscode";
import { PlannerTreeDataProviderImpl } from "./plannerTreeDataProviderImpl";
import { FileHandlerImpl } from "./fileHandlerImpl";
import { VSCodeEditorAdapterImpl } from "./vscode/vscodeEditorAdapterImpl";
import { VSCodeTreeItemAdapterImpl } from "./vscode/vscodeTreeItemAdapterImpl";
import { commandHandlerImpl } from "./commandHandlerImpl";
import { TreeHandlerImpl } from "./treeHandlerImpl";

function getWorkspaceRoot(): string {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    throw new Error("No workspace is open. Please open a workspace first.");
  }
  return workspaceFolder.uri.fsPath;
}

export function activate(context: vscode.ExtensionContext) {
  console.log("Planner extension is now active!");

  try {
    const workspaceRoot = getWorkspaceRoot();
    const editorAdapter = new VSCodeEditorAdapterImpl();
    const treeItemAdapter = new VSCodeTreeItemAdapterImpl();
    const fileHandler = new FileHandlerImpl();
    const treeHandler = new TreeHandlerImpl(workspaceRoot, fileHandler);
    const plannerTreeDataProvider = new PlannerTreeDataProviderImpl(
      treeHandler,
      treeItemAdapter
    );

    const treeView = vscode.window.createTreeView("plannerFiles", {
      treeDataProvider: plannerTreeDataProvider,
      showCollapseAll: true,
    });

    const commandHandler = new commandHandlerImpl(
      treeHandler,
      plannerTreeDataProvider,
      editorAdapter
    );
    const commandDisposables = commandHandler.registerCommands();

    context.subscriptions.push(treeView, commandHandler, ...commandDisposables);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    vscode.window.showErrorMessage(
      `Failed to activate Planner extension: ${message}`
    );
    throw error;
  }
}

export function deactivate() {}
