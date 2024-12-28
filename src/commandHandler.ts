import { CommandConfig } from "./types";

export interface Disposable {
  dispose(): void;
}

export interface CommandHandler extends Disposable {
  registerCommands(): Disposable[];
  executeCommand(
    action: () => Promise<boolean | void>,
    config: CommandConfig
  ): Promise<void>;
}
