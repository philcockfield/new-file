import { exec, log } from './libs';

export interface INpmInfo {
  name: string;
  latest: string;
  json: any;
}

/**
 * Lookup latest info for module from NPM.
 */
export async function getInfo(name: string): Promise<INpmInfo | undefined> {
  const cmd = `npm info ${name} --json`;

  const parseJson = (text: string) => {
    try {
      const json = JSON.parse(text);
      return json;
    } catch (error) {
      log.error('Raw JSON text:');
      log.info(text);
      throw error;
    }
  };

  try {
    const result = await exec.run(cmd, { silent: true });
    if (!result.stdout) {
      return undefined;
    }
    const json = parseJson(result.stdout);
    const latest = json['dist-tags'].latest;
    const name = json.name;
    return {
      name,
      latest,
      json,
    };
  } catch (error) {
    if (error.message.includes('Not found')) {
      return undefined; // Return nothing indicating the module was not found on NPM.
    } else {
      throw new Error(
        `Failed while reading info for '${name}' from NPM.\nCMD: ${log.yellow(
          cmd,
        )}\n\n${error.message}`,
      );
    }
  }
}

/**
 * Updates any versions on a `package.json` text file to their latest.
 */
export async function toLatestVersions(packageJson: string) {
  type Deps = { [key: string]: string };
  type Package = { dependencies?: Deps; devDependencies?: Deps };

  const process = async (
    pkg: Package,
    key: 'dependencies' | 'devDependencies',
  ) => {
    const deps = pkg[key] as Deps;
    if (typeof deps === 'object') {
      pkg = { ...pkg };
      pkg[key] = await update(deps);
    }
    return pkg;
  };

  const update = async (deps: Deps) => {
    deps = { ...deps };
    const keys = Object.keys(deps).filter(key => deps[key] === '__LATEST__');

    const wait = keys.map(async name => {
      const res = await getInfo(name);
      const latest = res ? res.latest : undefined;
      return { name, latest };
    });

    (await Promise.all(wait)).forEach(m => {
      const { name, latest } = m;
      if (latest) {
        deps[name] = latest;
      }
    });

    return deps;
  };

  try {
    let pkg = JSON.parse(packageJson) as Package;
    pkg = await process(pkg, 'dependencies');
    pkg = await process(pkg, 'devDependencies');
    packageJson = `${JSON.stringify(pkg, null, '  ')}\n`;
  } catch (error) {
    throw new Error(
      `Failed to update to latest package.json versions from NPM. ${
        error.message
      }`,
    );
  }

  return packageJson;
}
