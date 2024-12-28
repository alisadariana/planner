import * as vscode from "vscode";
import { TreeItemAdapter } from "../treeItemAdapter";
import {
  DeckTreeNode,
  CardTreeNode,
  NodeType,
  PlannerTreeNode,
} from "../types";

export class VSCodeTreeItemAdapterImpl implements TreeItemAdapter {
  private formatLabel(node: PlannerTreeNode): string {
    return `${node.icon} ${node.name}`;
  }

  private getCollapsibleState(
    node: PlannerTreeNode
  ): vscode.TreeItemCollapsibleState {
    return node.children.length > 0
      ? vscode.TreeItemCollapsibleState.Expanded
      : vscode.TreeItemCollapsibleState.None;
  }

  private createCardTreeItem(node: CardTreeNode): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      this.formatLabel(node),
      this.getCollapsibleState(node)
    );

    treeItem.command = {
      command: "vscode.open",
      title: "Open Card",
      arguments: [vscode.Uri.file(node.path)],
    };

    treeItem.contextValue = "card";
    return treeItem;
  }

  private createDeckTreeItem(node: DeckTreeNode): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      this.formatLabel(node),
      this.getCollapsibleState(node)
    );

    treeItem.contextValue = "deck";
    return treeItem;
  }

  public mapToTreeItem(node: PlannerTreeNode): vscode.TreeItem {
    switch (node.type) {
      case NodeType.Card:
        return this.createCardTreeItem(node);
      case NodeType.Deck:
        return this.createDeckTreeItem(node);
    }
  }
}
