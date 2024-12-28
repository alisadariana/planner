import { FrontmatterData, GrayMatterFile } from "./types";

export interface FileHandler {
  isFSDirectory(filePath: string): Promise<boolean>;
  readFSDirectory(dirPath: string): Promise<string[]>;
  deleteFSFile(filePath: string): Promise<void>;
  deleteFSDirectory(dirPath: string): Promise<void>;
  createFSFile(
    filePath: string,
    frontmatter: FrontmatterData,
    content?: string
  ): Promise<void>;

  getGrayMatterFile(filePath: string): Promise<GrayMatterFile>;
  getFrontmatter(filePath: string): Promise<FrontmatterData>;
  applyFrontmatterUpdates(
    current: FrontmatterData,
    updates: Partial<FrontmatterData>
  ): FrontmatterData;
  updateFrontmatter(
    filePath: string,
    updates: Partial<FrontmatterData>
  ): Promise<void>;
  addSubcardToFrontmatter(
    parentPath: string,
    subcardPath: string
  ): Promise<void>;
  removeSubcardFromFrontmatter(
    parentPath: string,
    subcardPath: string
  ): Promise<void>;

  generateUniqueFilename(directory: string, baseName: string): Promise<string>;
}
