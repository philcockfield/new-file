import * as constants from './constants';
import { fsPath, log, file } from './libs';
import { ISettings, ITemplate } from '../types';

export interface IIndexYaml {
  templateDirs: string[];
}
export interface ITemplateYaml {
  name: string;
  folder: string;
  variables: { [key: string]: string };
  install: boolean;
}

/**
 * Initializes the settings.
 */
export async function loadSettings(
  args: { path?: string } = {},
): Promise<ISettings | undefined> {
  // Find the configuration YAML file.
  const path =
    args.path ||
    (await file.findClosestAncestor(
      process.cwd(),
      constants.CONFIG_FILE_INDEX,
    ));
  if (!path) {
    return;
  }

  // Load the YAML.
  const yaml = await loadIndexYaml(path);
  if (!yaml) {
    return;
  }

  // Load template dirs.
  const dir = fsPath.dirname(path);
  const settings: ISettings = {
    dir,
    templates: [],
  };
  for (const pattern of yaml.templateDirs) {
    const dirs = await file.glob(fsPath.join(dir, pattern));
    (await loadTemplates(dirs))
      .filter(tmpl => Boolean(tmpl))
      .forEach(tmpl => settings.templates.push(tmpl));
  }

  // Finish up.
  return settings;
}

async function loadTemplates(dirs: string[]): Promise<ITemplate[]> {
  const result: ITemplate[] = [];
  for (const dir of dirs) {
    const tmpl = await loadTemplate(dir);
    if (tmpl) {
      result.push(tmpl);
    }
  }
  return result;
}

async function loadTemplate(dir: string): Promise<ITemplate | undefined> {
  const tmplPath = fsPath.join(dir, constants.CONFIG_FILE_TEMPLATE);
  try {
    const yaml = await file.yaml<ITemplateYaml>(tmplPath);
    return {
      dir,
      name: yaml.name,
      folder: yaml.folder || 'NAME',
      variables: yaml.variables || {},
      install: Boolean(yaml.install),
    };
  } catch (error) {
    return;
  }
}

/**
 * Finds and loads the YAML configuration file.
 */
async function loadIndexYaml(path: string) {
  try {
    const result = await file.yaml<IIndexYaml>(path);

    // Fill in default values.
    result.templateDirs = result.templateDirs || [];

    return result;
  } catch (error) {
    log.error(`Failed to parse YAML configuration`);
    log.error(error.message);
    log.info(log.magenta('File:'), path, '\n');
  }
  return;
}
