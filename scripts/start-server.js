const { spawn } = require('child_process');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const out = require('fs').openSync(path.join(projectDir, 'next-dev-out.log'), 'a');
const err = require('fs').openSync(path.join(projectDir, 'next-dev-err.log'), 'a');

const child = spawn('npm.cmd', ['run', 'dev'], {
  cwd: projectDir,
  detached: true,
  stdio: ['ignore', out, err]
});

child.unref();
console.log(`Next.js dev server started (PID: ${child.pid})`);
console.log('Check next-dev-out.log and next-dev-err.log for output');
