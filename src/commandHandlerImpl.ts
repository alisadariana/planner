import { PlannerTreeDataProvider } from "./plannerTreeDataProviderImpl";
import { EditorAdapter } from "./editorAdapter";
import { CommandHandler } from "./commandHandler";
import {
  CommandConfig,
  OperationStrategy,
  PlannerCommand,
  PlannerTreeNode,
} from "./types";
import { Disposable } from "./commandHandler";
import { PLANNER_COMMANDS } from "./constant";
import path from "path";
import { TreeHandler } from "./treeHandler";

export class commandHandlerImpl implements CommandHandler {
  constructor(
    private readonly treeHandler: TreeHandler,
    private readonly treeDataProvider: PlannerTreeDataProvider,
    private readonly editorAdapter: EditorAdapter
  ) {}

  private readonly disposables: Disposable[] = [];

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }

  async executeCommand(
    action: () => Promise<boolean | void>,
    config: CommandConfig
  ): Promise<void> {
    try {
      const result = await action();
      if (result !== false) {
        this.editorAdapter.handleCommandSuccess(
          config.successMessage,
          config.refreshOnSuccess
            ? () => this.treeDataProvider.refresh()
            : undefined
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : config.errorMessage;
      this.editorAdapter.handleCommandError(message);
    }
  }

  private async executeRefreshExplorer(): Promise<void> {
    this.treeDataProvider.refresh();
  }

  private async getSelectedNode(
    node: unknown
  ): Promise<PlannerTreeNode | undefined> {
    if (this.treeHandler.isPlannerTreeNode(node)) {
      return node;
    }

    const filePath = this.editorAdapter.getActiveFilePath();
    return await this.treeHandler.findNodeByPath(filePath);
  }

  private async executeCreateCard(node?: unknown): Promise<void> {
    const selectedNode = await this.getSelectedNode(node);

    if (!selectedNode) {
      return;
    }

    try {
      const cardName = await this.editorAdapter.promptForCardName(
        this.treeHandler.isCardNode(selectedNode)
      );
      if (!cardName) {
        return;
      }

      const cardPath = await this.treeHandler.createCard(
        selectedNode,
        cardName
      );
      if (cardPath) {
        this.editorAdapter.showSuccess(
          `Created ${
            this.treeHandler.isDeckNode(selectedNode) ? "card" : "subcard"
          }: ${path.basename(cardPath)}`
        );
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error occurred";
      this.editorAdapter.showError(
        `Failed to create ${
          this.treeHandler.isDeckNode(selectedNode) ? "card" : "subcard"
        }: ${errorMessage}`
      );
      throw error;
    }
  }

  private async executeDeleteNode(node?: unknown): Promise<void> {
    const selectedNode = await this.getSelectedNode(node);

    if (!selectedNode) {
      return;
    }

    const confirmation = await this.editorAdapter.confirmDeletion(
      selectedNode.name,
      this.treeHandler.isDeckNode(selectedNode)
    );

    if (!confirmation) {
      return;
    }

    try {
      if (this.treeHandler.isDeckNode(selectedNode)) {
        await this.treeHandler.deleteDeck(selectedNode);
        return;
      }

      if (this.treeHandler.hasChildren(selectedNode)) {
        const choice: OperationStrategy =
          await this.editorAdapter.promptDeleteWithSubcards(
            selectedNode.name,
            selectedNode.children.length
          );

        if (choice === OperationStrategy.Cancel) {
          return;
        }

        await this.treeHandler.deleteCard(selectedNode, choice);
        return;
      }

      await this.treeHandler.deleteCard(selectedNode);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error occurred";
      this.editorAdapter.showError(
        `Failed to delete ${selectedNode.type}: ${errorMessage}`
      );
      throw error;
    }
  }

  private getCommands(): PlannerCommand[] {
    return [
      {
        id: PLANNER_COMMANDS.REFRESH_EXPLORER,
        execute: () => this.executeRefreshExplorer(),
        config: {
          errorMessage: "Failed to refresh explorer",
          successMessage: "Planner Explorer refreshed!",
        },
      },
      {
        id: PLANNER_COMMANDS.CREATE_SUBCARD,
        execute: (node?: unknown) => this.executeCreateCard(node),
        config: {
          errorMessage: "Failed to add subcard",
          refreshOnSuccess: true,
        },
      },
      {
        id: PLANNER_COMMANDS.CREATE_CARD,
        execute: (node?: unknown) => this.executeCreateCard(node),
        config: {
          errorMessage: "Failed to add card",
          refreshOnSuccess: true,
        },
      },
      {
        id: PLANNER_COMMANDS.DELETE_NODE,
        execute: (node?: unknown) => this.executeDeleteNode(node),
        config: {
          errorMessage: "Failed to delete node",
          refreshOnSuccess: true,
        },
      },
    ];
  }

  registerCommands(): Disposable[] {
    const commands = this.getCommands();

    commands.forEach((command) => {
      const disposable = this.editorAdapter.registerCommand(
        command.id,
        async (...args: unknown[]) => {
          await this.executeCommand(
            () => command.execute(...args),
            command.config
          );
        }
      );
      this.disposables.push(disposable);
    });

    return this.disposables;
  }
}
