/**
 * Wrangle command-line args.
 */
const COMMANDS = {
  INIT: 'init', // NB: example commands.
  START: 'start',
};

/**
 * Run by the bin entry-point.
 */
export async function init(args: string[]) {
  const cmd = getCommand(args) || 'NONE';
  console.log('\n.bin/create-tmpl'); // tslint:disable-line
  console.log('command:', cmd); // tslint:disable-line
  console.log('args:', args, '\n'); // tslint:disable-line
}

/**
 * INTERNAL
 */

/**
 * Get the command from the command-line-args.
 *
 * You may want to use a library for this, like:
 *
 *    - `minimist`    https://github.com/substack/minimist
 *    - `yargs`       https://github.com/yargs/yargs
 *    - `commander`   https://github.com/tj/commander.js
 */
function getCommand(args: string[]) {
  const index = args.findIndex(x =>
    Object.keys(COMMANDS)
      .map(key => COMMANDS[key])
      .includes(x),
  );
  return index === -1 ? args[0] || '' : args[index];
}
