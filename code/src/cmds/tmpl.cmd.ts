import {
  constants,
  file,
  fs,
  fsPath,
  ICreateOptions,
  inquirer,
  ISettings,
  ITemplate,
  ITemplateFile,
  ITemplateVariables,
  loadSettings,
  log,
  R,
  BeforeWriteFile,
  IWriteFile,
  exec,
  listr,
  IListrTask,
  isYarnInstalled,
  npm,
} from '../common';

export const name = 'tmpl';
export const alias = 't';
export const description = 'Runs a generator template.';
export const args = {};

/**
 * CLI
 */
export async function cmd(args?: { params: string[]; options: {} }) {
  await create();
}

export type ICreateResponse = {
  success: boolean;
  dir: string;
  error?: Error;
};

/**
 * Creates a new template
 */
export async function create(
  options: ICreateOptions = {},
): Promise<ICreateResponse> {
  // const result = { success: true, e };

  // Retrieve settings.
  const { settingsPath, targetDir, templateName, beforeWrite } = options;
  const settings = (await loadSettings({ path: settingsPath })) as ISettings;
  if (!settings) {
    const error = new Error(constants.CONFIG_NOT_FOUND_ERROR);
    log.warn.yellow(error.message);
    return { success: false, dir: '', error };
  }

  // Prompt for the template to use.
  const templates = settings.templates;
  const template = templateName
    ? findTemplateByName(templateName, templates)
    : await promptForTemplate(templates);
  if (!template) {
    const error = new Error(`Template 'templateName' not found.`);
    return { success: false, dir: '', error };
  }

  // Copy the template.
  const variables = await promptForVariables(template);
  const write = await writeFiles({
    template,
    variables,
    targetDir,
    beforeWrite,
  });
  const dir = write.dir;
  if (!write.success) {
    const error = new Error('Failed to write template files.');
    log.info.yellow(`\n😥  ${error.message}`);
    return { success: false, dir, error };
  }

  // Run `npm install` if requested.
  if (template.install) {
    log.info();
    const res = await npmInstall(write.dir);
    if (!res.success) {
      log.info.yellow(`\n😥  Failed to install NPM modules.`);
      return { success: false, dir, error: res.error };
    }
  }

  // Finish up.
  log.info();
  log.info.green(`✨✨  Done`);
  return { success: true, dir };
}

async function promptForTemplate(templates: ITemplate[]) {
  const choices = templates.map(item => ({ name: item.name, value: item.dir }));
  const confirm = {
    type: 'list',
    name: 'path',
    message: 'Select a template',
    choices,
  };
  const { path } = (await inquirer.prompt(confirm)) as { path: string };
  const result = templates.find(item => item.dir === path);
  return result;
}

function findTemplateByName(name: string, templates: ITemplate[]) {
  return templates.find(item => item.name === name);
}

async function promptForVariables(template: ITemplate) {
  const result = {} as any;
  for (const key of Object.keys(template.variables)) {
    const description = template.variables[key];
    result[key] = await promptForVariable(key, description);
  }
  return result;
}

async function promptForVariable(key: string, description: string) {
  description = description.replace(/\.$/, '');
  if (!description.endsWith('?')) {
    description += ':';
  }
  const confirm = {
    type: 'input',
    name: 'value',
    message: description,
  };
  const { value } = (await inquirer.prompt(confirm)) as { value: string };
  return value;
}

const writeFiles = async (args: {
  template: ITemplate;
  variables: ITemplateVariables;
  targetDir?: string;
  beforeWrite?: BeforeWriteFile;
}) => {
  const { template, variables, beforeWrite } = args;

  log.info();
  const folderName = variables[template.folder]
    ? variables[template.folder].replace(/\//g, '-')
    : 'Unnamed';

  const parentDir = args.targetDir || process.cwd();
  const dir = fsPath.join(parentDir, folderName);

  if (fs.existsSync(dir)) {
    log.info.yellow(`⚠️  WARNING: Directory already exists.`);
    log.info.yellow(`    - Directory: ${log.magenta(dir)}`);
    log.info.yellow(`    - Template not created.`);
    return { success: false, dir };
  }

  fs.ensureDirSync(dir);
  log.info.gray('Creating:');

  const files = await loadFiles(template.dir);

  for (const file of files) {
    const filePath = file.path.replace(
      new RegExp(`__${template.folder}__`, 'g'),
      folderName,
    );
    let fullPath = fsPath.join(dir, filePath);
    let text = file.text;

    // Replace template values.
    Object.keys(variables).forEach(key => {
      const replaceWith = variables[key];
      if (replaceWith) {
        text = text.replace(new RegExp(`__${key}__`, 'g'), replaceWith);
      }
    });

    // Prepare known file types.
    if (file.name === 'package.json') {
      text = await npm.toLatestVersions(text);
    }

    // Get any modifications to the file before writing.
    if (beforeWrite) {
      const e: IWriteFile = {
        path: fullPath,
        text,
      };
      const res = await beforeWrite(e);
      if (res) {
        let updates = e;
        updates = typeof res === 'object' ? res : updates;
        updates = typeof res === 'string' ? { ...updates, text: res } : updates;
        fullPath = updates.path;
        text = updates.text;
      }
    }

    // Write the file.
    fs.ensureDirSync(fsPath.dirname(fullPath));
    fs.writeFileSync(fullPath, text);

    // Log details.
    log.info.gray(`- ${formatPath(fullPath, parentDir).substr(1)}`);
  }

  return { success: true, dir };
};

const formatPath = (path: string, rootDir: string) => {
  let dir = fsPath.dirname(path);
  dir = dir.substr(rootDir.length);
  const file = fsPath.basename(path);
  return `${dir}/${log.cyan(file)}`;
};

const loadFiles = async (dir: string) => {
  const IGNORE = ['.DS_Store', '.template.yml', '.template.yaml'];
  const glob = `${dir.replace(/\/$/, '')}/**`;
  const files = await file.glob(glob, { nodir: true, dot: true });
  return files
    .filter(path => R.none(ignore => path.endsWith(ignore), IGNORE))
    .map(path => {
      const name = fsPath.basename(path);
      const result: ITemplateFile = {
        name,
        path: path.substr(dir.length, path.length),
        text: fs.readFileSync(path).toString(),
      };
      return result;
    });
};

async function npmInstall(dir: string) {
  const cmd = (await isYarnInstalled()) ? 'yarn install' : 'npm install';
  const task: IListrTask = {
    title: cmd,
    task: async () => {
      await exec.run(`cd ${dir} && ${cmd}`, { silent: true });
    },
  };
  try {
    await listr([task]).run();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
