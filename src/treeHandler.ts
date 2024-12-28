import {
  CardTreeNode,
  DeckTreeNode,
  OperationStrategy,
  PlannerTreeNode,
} from "./types";

export interface TreeHandler {
  isPlannerTreeNode(node: unknown): node is PlannerTreeNode;
  isCardNode(node: PlannerTreeNode): node is CardTreeNode;
  isDeckNode(node: PlannerTreeNode): node is DeckTreeNode;
  hasChildren(node: PlannerTreeNode): boolean;
  getNodeChildren(node: PlannerTreeNode): PlannerTreeNode[];

  getRootNodes(): Promise<PlannerTreeNode[]>;
  findNodeByPath(filePath: string): Promise<PlannerTreeNode | undefined>;
  clearCache(): void;

  buildDeckTree(dirPath: string): Promise<PlannerTreeNode[]>;

  createCard(
    parentNode: PlannerTreeNode,
    cardName: string
  ): Promise<string | undefined>;
  deleteDeck(node: DeckTreeNode): Promise<void>;
  deleteCard(
    node: CardTreeNode,
    deleteStrategy?: OperationStrategy
  ): Promise<void>;
}
