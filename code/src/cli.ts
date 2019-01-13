#!/usr/bin/env node
import command from 'command-interface';
command(`${__dirname}/**/*.cmd.js`);
