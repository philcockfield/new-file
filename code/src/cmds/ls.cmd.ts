import {
  constants,
  log,
  file,
  fsPath,
  loadSettings,
  ISettings,
} from '../common';

export const name = 'ls';
export const alias = 'l';
export const description = 'Lists the available templates |||.';
export const args = {};

/**
 * CLI command.
 */
export async function cmd(args?: { params: string[]; options: {} }) {
  await ls({});
}

export interface IOptions {}

/**
 * List modules in dependency order.
 */
export async function ls(options: IOptions = {}) {
  // Retrieve settings.
  const settings = (await loadSettings()) as ISettings;
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  // Print templates.
  log.info();
  const head = [log.gray('Template'), log.gray('Files'), log.gray('Folder')];

  const templates = log.table({ head });
  for (const tmpl of settings.templates) {
    const files = await file.glob(fsPath.join(tmpl.dir, '*'));
    templates.add([
      log.cyan(tmpl.name),
      log.magenta(files.length),
      log.gray(tmpl.dir),
    ]);
  }
  templates.log();

  // Finish up.
  log.info();
  return {
    settings,
  };
}
