import {
  CardTreeNode,
  DeckTreeNode,
  FrontmatterData,
  NodeType,
  OperationStrategy,
  PlannerTreeNode,
} from "./types";
import { FileHandler } from "./fileHandler";
import { TreeHandler } from "./treeHandler";
import path from "path";
import {
  DEFAULT_CARD_ICON,
  DEFAULT_DECK_ICON,
  MARKDOWN_EXTENSION,
} from "./constant";

export class TreeHandlerImpl implements TreeHandler {
  private rootNodesCache: PlannerTreeNode[] | null = null;
  private nodePathMap: Map<string, PlannerTreeNode> = new Map();

  constructor(
    private workspaceRoot: string | undefined,
    private readonly fileHandler: FileHandler
  ) {}

  private buildNodePathMap(nodes: PlannerTreeNode[]): void {
    for (const node of nodes) {
      this.nodePathMap.set(node.path, node);
      if (node.children.length > 0) {
        this.buildNodePathMap(node.children);
      }
    }
  }

  public async getRootNodes(): Promise<PlannerTreeNode[]> {
    if (!this.workspaceRoot) {
      return [];
    }

    if (!this.rootNodesCache) {
      this.rootNodesCache = await this.buildDeckTree(this.workspaceRoot);
      this.buildNodePathMap(this.rootNodesCache);
    }
    return this.rootNodesCache;
  }

  public async findNodeByPath(
    filePath: string
  ): Promise<PlannerTreeNode | undefined> {
    await this.getRootNodes();
    return this.nodePathMap.get(filePath);
  }

  public clearCache(): void {
    this.rootNodesCache = null;
    this.nodePathMap.clear();
  }

  private async buildCardNode(filePath: string): Promise<CardTreeNode> {
    const frontmatter = await this.fileHandler.getFrontmatter(filePath);
    const children = await this.buildCardTree(filePath);
    const dirPath = path.dirname(filePath) + "/";
    const parentPath = frontmatter.parent
      ? dirPath + frontmatter.parent
      : undefined;

    return {
      type: NodeType.Card,
      name: path.basename(filePath),
      path: filePath,
      icon: frontmatter?.icon || DEFAULT_CARD_ICON,
      children,
      parentPath: parentPath,
    };
  }

  private async buildDeckNode(dirPath: string): Promise<DeckTreeNode> {
    const children = await this.buildDeckTree(dirPath);
    return {
      type: NodeType.Deck,
      name: path.basename(dirPath),
      path: dirPath,
      icon: DEFAULT_DECK_ICON,
      children,
    };
  }

  private async buildCardTree(filePath: string): Promise<CardTreeNode[]> {
    const frontmatter = await this.fileHandler.getFrontmatter(filePath);

    if (!frontmatter?.subcards) {
      return [];
    }

    const dirPath = path.dirname(filePath);
    const nodes: CardTreeNode[] = [];

    for (const subcard of frontmatter.subcards) {
      const fullPath = path.join(dirPath, subcard);
      nodes.push(await this.buildCardNode(fullPath));
    }
    return nodes;
  }

  public async buildDeckTree(dirPath: string): Promise<PlannerTreeNode[]> {
    const entries = await this.fileHandler.readFSDirectory(dirPath);
    const nodes: PlannerTreeNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);

      if (await this.fileHandler.isFSDirectory(fullPath)) {
        nodes.push(await this.buildDeckNode(fullPath));
      } else if (path.extname(entry) === MARKDOWN_EXTENSION) {
        const frontmatter = await this.fileHandler.getFrontmatter(fullPath);
        if (!frontmatter?.parent) {
          nodes.push(await this.buildCardNode(fullPath));
        }
      }
    }

    return nodes;
  }

  public async createCard(
    parentNode: PlannerTreeNode,
    cardName: string
  ): Promise<string | undefined> {
    const selectedDir = this.isDeckNode(parentNode)
      ? parentNode.path
      : path.dirname(parentNode.path);

    const filename = await this.fileHandler.generateUniqueFilename(
      selectedDir,
      cardName
    );
    const cardPath = path.join(selectedDir, filename);

    const frontmatter: FrontmatterData = {};

    if (this.isCardNode(parentNode)) {
      const relativePath = path.relative(selectedDir, parentNode.path);
      frontmatter.parent = relativePath;
      await this.fileHandler.addSubcardToFrontmatter(parentNode.path, cardPath);
    }

    await this.fileHandler.createFSFile(cardPath, frontmatter, `# ${cardName}`);

    return cardPath;
  }

  public async deleteDeck(node: DeckTreeNode): Promise<void> {
    await this.fileHandler.deleteFSDirectory(node.path);
    return;
  }

  public async deleteCard(
    node: CardTreeNode,
    deleteStrategy?: OperationStrategy
  ): Promise<void> {
    if (this.hasChildren(node) && deleteStrategy) {
      if (deleteStrategy === OperationStrategy.Cascade) {
        for (const subcard of node.children) {
          await this.deleteCard(subcard, deleteStrategy);
        }
      } else if (deleteStrategy === OperationStrategy.Preserve) {
        for (const subcard of node.children) {
          await this.fileHandler.updateFrontmatter(subcard.path, {
            parent: undefined,
          });
        }
      }
    }

    await this.fileHandler.deleteFSFile(node.path);

    if (node.parentPath) {
      await this.fileHandler.removeSubcardFromFrontmatter(
        node.parentPath,
        node.path
      );
    }
  }

  public isPlannerTreeNode(node: unknown): node is PlannerTreeNode {
    return (
      node !== null &&
      typeof node === "object" &&
      "type" in node &&
      Object.values(NodeType).includes((node as any).type) &&
      typeof (node as any).name === "string" &&
      typeof (node as any).path === "string" &&
      typeof (node as any).icon === "string" &&
      Array.isArray((node as any).children)
    );
  }

  public isCardNode(node: PlannerTreeNode): node is CardTreeNode {
    return (
      node.type === NodeType.Card &&
      node.children.every((child) => child.type === NodeType.Card)
    );
  }

  public isDeckNode(node: PlannerTreeNode): node is DeckTreeNode {
    return node.type === NodeType.Deck;
  }

  public countChildren(node: PlannerTreeNode): number {
    return node.children.length;
  }

  public hasChildren(node: PlannerTreeNode): boolean {
    return this.countChildren(node) > 0;
  }

  public getNodeChildren(node: PlannerTreeNode): PlannerTreeNode[] {
    return node.children;
  }
}
