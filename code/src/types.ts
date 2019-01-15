export interface ISettings {
  dir: string;
  templates: ITemplate[];
}

export interface ITemplate {
  dir: string;
  name: string;
  folder: string;
  install: boolean;
  variables: ITemplateVariables;
}

export interface ITemplateVariables {
  [key: string]: string;
}

export interface ITemplateFile {
  name: string;
  path: string;
  text: string;
  isBinary: boolean;
  buffer: Buffer;
}

export interface ICreateOptions {
  settingsPath?: string;
  targetDir?: string;
  templateName?: string;
  beforeWrite?: BeforeWriteFile;
}

export type BeforeWriteFile = (
  e: IWriteFile,
) => Promise<string | IWriteFile | undefined | void>;

export type IWriteFile = {
  path: string;
  text: string;
  isBinary: boolean;
};
