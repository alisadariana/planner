import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { FrontmatterData, GrayMatterFile } from "./types";
import { MARKDOWN_EXTENSION } from "./constant";
import { FileHandler } from "./fileHandler";

export class FileHandlerImpl implements FileHandler {
  public async isFSDirectory(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  public async readFSDirectory(dirPath: string): Promise<string[]> {
    return await fs.promises.readdir(dirPath);
  }

  public async deleteFSFile(filePath: string): Promise<void> {
    await fs.promises.unlink(filePath);
  }

  public async deleteFSDirectory(dirPath: string): Promise<void> {
    await fs.promises.rm(dirPath, { recursive: true, force: true });
  }

  public async createFSFile(
    filePath: string,
    frontmatter: FrontmatterData,
    content = ""
  ): Promise<void> {
    const fileContent = matter.stringify(content, frontmatter);
    await fs.promises.writeFile(filePath, fileContent, "utf-8");
  }

  async getGrayMatterFile(filePath: string): Promise<GrayMatterFile> {
    const content = await fs.promises.readFile(filePath, "utf-8");
    return matter(content) as GrayMatterFile;
  }

  public async getFrontmatter(filePath: string): Promise<FrontmatterData> {
    const { data } = await this.getGrayMatterFile(filePath);
    return data;
  }

  applyFrontmatterUpdates(
    current: FrontmatterData,
    updates: Partial<FrontmatterData>
  ): FrontmatterData {
    const result = { ...current };

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) {
        delete result[key];
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  async updateFrontmatter(
    filePath: string,
    updates: Partial<FrontmatterData>
  ): Promise<void> {
    const { data: currentFrontmatter, content } = await this.getGrayMatterFile(
      filePath
    );

    const updatedFrontmatter = this.applyFrontmatterUpdates(
      currentFrontmatter,
      updates
    );

    const fileContent = matter.stringify(content, updatedFrontmatter);

    await fs.promises.writeFile(filePath, fileContent, "utf-8");
  }

  async addSubcardToFrontmatter(
    parentPath: string,
    subcardPath: string
  ): Promise<void> {
    const frontmatter = await this.getFrontmatter(parentPath);
    const relativePath = path.relative(path.dirname(parentPath), subcardPath);

    const subcards = frontmatter.subcards || [];
    if (!subcards.includes(relativePath)) {
      subcards.push(relativePath);
      await this.updateFrontmatter(parentPath, { subcards: subcards });
    }
  }

  async removeSubcardFromFrontmatter(
    parentPath: string,
    subcardPath: string
  ): Promise<void> {
    const frontmatter = await this.getFrontmatter(parentPath);
    const relativePath = path.relative(path.dirname(parentPath), subcardPath);

    if (frontmatter.subcards) {
      const updatedSubcards = frontmatter.subcards.filter(
        (subcard) => subcard !== relativePath
      );
      await this.updateFrontmatter(parentPath, { subcards: updatedSubcards });
    }
  }

  async generateUniqueFilename(
    directory: string,
    baseName: string
  ): Promise<string> {
    let filename = `${baseName}${MARKDOWN_EXTENSION}`;
    let counter = 1;

    while (fs.existsSync(path.join(directory, filename))) {
      filename = `${baseName}-${counter}${MARKDOWN_EXTENSION}`;
      counter++;
    }

    return filename;
  }
}
