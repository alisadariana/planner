import * as vscode from "vscode";
import { PlannerTreeNode } from "./types";
import { TreeItemAdapter } from "./treeItemAdapter";
import { TreeHandler } from "./treeHandler";

export interface PlannerTreeDataProvider
  extends vscode.TreeDataProvider<PlannerTreeNode> {
  refresh(): void;
}

export class PlannerTreeDataProviderImpl implements PlannerTreeDataProvider {
  private _onDidChangeTreeData: vscode.EventEmitter<
    PlannerTreeNode | undefined | null | void
  > = new vscode.EventEmitter<PlannerTreeNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    PlannerTreeNode | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(
    private readonly treeHandler: TreeHandler,
    private readonly treeItemAdapter: TreeItemAdapter
  ) {}

  refresh(): void {
    this.treeHandler.clearCache();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PlannerTreeNode): vscode.TreeItem {
    return this.treeItemAdapter.mapToTreeItem(element);
  }

  async getChildren(element?: PlannerTreeNode): Promise<PlannerTreeNode[]> {
    if (!element) {
      return this.treeHandler.getRootNodes();
    }

    return this.treeHandler.getNodeChildren(element);
  }
}
