export interface ISettings {
  dir: string;
  templates: ITemplate[];
}

export interface ITemplate {
  dir: string;
  name: string;
  folder: string;
  variables: ITemplateVariables;
}

export interface ITemplateVariables {
  [key: string]: string;
}

export interface ITemplateFile {
  name: string;
  path: string;
  text: string;
}

export interface ICreateOptions {
  settingsPath?: string;
  targetDir?: string;
  templateName?: string;
}
