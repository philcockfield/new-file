import { log, table } from '../common';

export const name = 'ls';
export const alias = 'l';
export const description = 'Lists the available templates.';
export const args = {
};

/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {},
  },
) {
  log.info.yellow('ls');

  table()
    .add('one', 'two')
    .add('one', 'two')
    .add('one', 'two')
    .log();

}
