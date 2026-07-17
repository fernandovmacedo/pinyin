import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = new URL('.', import.meta.url);

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const path = pathname === '/rules.json' ? 'rules.json' : 'index.html';
  const contentType = path.endsWith('.json')
    ? 'application/json; charset=utf-8'
    : 'text/html; charset=utf-8';

  try {
    const body = await readFile(new URL(path, root));
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

try {
  const { stdout } = await execFileAsync('google-chrome', [
    '--headless', '--no-sandbox', '--disable-gpu', '--virtual-time-budget=1000', '--dump-dom',
    `http://127.0.0.1:${port}/?test`,
  ]);
  const match = stdout.match(/data-test-result="(\d+):(\d+)"/);

  if (!match || match[2] !== '0') {
    throw new Error('Browser tests did not report a passing result.');
  }

  console.log(`${match[1]} browser tests passed.`);
} finally {
  server.close();
}
