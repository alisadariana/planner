import * as vscode from "vscode";
import { PlannerTreeNode } from "./types";

export interface TreeItemAdapter {
  mapToTreeItem(node: PlannerTreeNode): vscode.TreeItem;
}
