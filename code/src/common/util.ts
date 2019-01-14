import { log, exec } from './libs';

/**
 * Common styling for a command title.
 */
export function printTitle(title: string) {
  log.info.cyan(`\n👋  ${title}\n`);
}

/**
 * Determines whether Yarn is installed.
 */
export async function isYarnInstalled() {
  try {
    const cmd = `yarn --version`;
    const res = await exec.run(cmd, { silent: true });
    return res.code === 0;
  } catch (error) {
    return false;
  }
}
