import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';

const PREFERRED = [/wi-?fi/i, /ethernet/i, /lan/i];

function getLanIp() {
  const nets = networkInterfaces();
  const candidates = [];

  for (const [name, addresses] of Object.entries(nets)) {
    for (const net of addresses ?? []) {
      const family = typeof net.family === 'string' ? net.family : String(net.family);
      if (
        (family === 'IPv4' || family === '4') &&
        !net.internal &&
        !net.address.startsWith('169.254.')
      ) {
        candidates.push({ name, address: net.address });
      }
    }
  }

  for (const pattern of PREFERRED) {
    const match = candidates.find((c) => pattern.test(c.name));
    if (match) return match.address;
  }

  return candidates[0]?.address ?? null;
}

const lanIp = getLanIp();
const port = '3000';
const child = spawn(`npx next dev -H 0.0.0.0 -p ${port}`, {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env,
});

function rewrite(chunk) {
  let text = chunk.toString();
  if (lanIp) {
    text = text.replaceAll(`http://0.0.0.0:${port}`, `http://${lanIp}:${port}`);
  }
  return text;
}

child.stdout.on('data', (chunk) => process.stdout.write(rewrite(chunk)));
child.stderr.on('data', (chunk) => process.stderr.write(rewrite(chunk)));

const shutdown = () => {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGINT');
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

child.on('exit', (code, signal) => {
  if (signal) process.exit(0);
  process.exit(code ?? 0);
});
