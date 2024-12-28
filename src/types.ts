export interface FrontmatterData {
  icon?: string;
  subcards?: string[];
  parent?: string;
  [key: string]: any;
}

export interface GrayMatterFile {
  content: string;
  data: FrontmatterData;
  isEmpty?: boolean;
  excerpt?: string;
}

export enum NodeType {
  Card = "card",
  Deck = "deck",
}

export interface BaseTreeNode {
  type: NodeType;
  name: string;
  path: string;
  icon: string;
}

export interface DeckTreeNode extends BaseTreeNode {
  type: NodeType.Deck;
  children: PlannerTreeNode[];
}

export interface CardTreeNode extends BaseTreeNode {
  type: NodeType.Card;
  children: CardTreeNode[];
  parentPath: string | undefined;
}

export type PlannerTreeNode = CardTreeNode | DeckTreeNode;

export interface CommandConfig {
  errorMessage: string;
  successMessage?: string;
  refreshOnSuccess?: boolean;
}

export interface PlannerCommand {
  id: string;
  config: CommandConfig;
  execute: (...args: unknown[]) => Promise<void>;
}

export enum OperationStrategy {
  Simple = "simple",
  Cascade = "cascade",
  Preserve = "preserve",
  Cancel = "cancel",
}
