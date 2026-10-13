const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWin = os.platform() === 'win32';
const rootDir = __dirname;

console.log('==========================================================');
console.log(' Starting AgroCure Full-Stack Ecosystem');
console.log(' 1. React Web Frontend:        http://localhost:5173');
console.log(' 2. NestJS Gateway Orchestrator: http://localhost:3000');
console.log(' 3. FastAPI ML Engine:          http://localhost:8000');
console.log('==========================================================');

const pythonBin = isWin
  ? path.join(rootDir, 'ml_service', '.venv', 'Scripts', 'python.exe')
  : path.join(rootDir, 'ml_service', '.venv', 'bin', 'python');

const npmCmd = isWin ? 'npm.cmd' : 'npm';

// 1. Spawn FastAPI ML Engine
const mlProcess = spawn(
  pythonBin,
  ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'],
  {
    cwd: path.join(rootDir, 'ml_service'),
    stdio: 'inherit',
    shell: true,
  }
);

// 2. Spawn NestJS Gateway Orchestrator
const orchProcess = spawn(
  npmCmd,
  ['run', 'start'],
  {
    cwd: path.join(rootDir, 'orchestrator'),
    stdio: 'inherit',
    shell: true,
  }
);

// 3. Spawn React Frontend
const frontendProcess = spawn(
  npmCmd,
  ['run', 'dev'],
  {
    cwd: path.join(rootDir, 'frontend'),
    stdio: 'inherit',
    shell: true,
  }
);

function cleanup() {
  console.log('\nTerminating AgroCure services...');
  if (isWin) {
    if (mlProcess.pid) spawn('taskkill', ['/pid', mlProcess.pid, '/f', '/t']);
    if (orchProcess.pid) spawn('taskkill', ['/pid', orchProcess.pid, '/f', '/t']);
    if (frontendProcess.pid) spawn('taskkill', ['/pid', frontendProcess.pid, '/f', '/t']);
  } else {
    mlProcess.kill('SIGINT');
    orchProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
