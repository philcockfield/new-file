import { log } from './libs';


/**
 * Common styling for a command title.
 */
export function printTitle(title: string) {
  log.info.cyan(`
-----------------------------------------------------------------------------------------
 ${title}
-----------------------------------------------------------------------------------------`);
}
