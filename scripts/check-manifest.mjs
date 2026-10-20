// Verifies manifest.json and rules.json parse, and that every file they (and
// the package list) reference exists. Run: node scripts/check-manifest.mjs
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(join(root, file), 'utf8'));
  } catch (err) {
    problems.push(`${file}: ${err.message}`);
    return null;
  }
};
const mustExist = (path, from) => {
  if (path.endsWith('/*')) {
    const dir = join(root, path.slice(0, -2));
    if (!existsSync(dir) || readdirSync(dir).length === 0) problems.push(`${from}: empty or missing ${path}`);
  } else if (!existsSync(join(root, path))) {
    problems.push(`${from}: missing ${path}`);
  }
};

const manifest = readJson('manifest.json');
readJson('rules.json');

if (manifest) {
  if (manifest.manifest_version !== 3) problems.push('manifest.json: manifest_version must be 3');
  if (!/^\d+(\.\d+){0,3}$/.test(manifest.version)) problems.push(`manifest.json: invalid version "${manifest.version}"`);
  if (manifest.description.length > 132) problems.push('manifest.json: description is longer than 132 characters');
  Object.values(manifest.icons).forEach((p) => mustExist(p, 'icons'));
  Object.values(manifest.action.default_icon).forEach((p) => mustExist(p, 'action.default_icon'));
  mustExist(manifest.action.default_popup, 'action.default_popup');
  mustExist(manifest.background.service_worker, 'background.service_worker');
  manifest.declarative_net_request.rule_resources.forEach((r) => mustExist(r.path, 'declarative_net_request'));
  for (const cs of manifest.content_scripts) {
    [...(cs.js || []), ...(cs.css || [])].forEach((p) => mustExist(p, 'content_scripts'));
  }
  manifest.web_accessible_resources.flatMap((w) => w.resources).forEach((p) => mustExist(p, 'web_accessible_resources'));
}

readFileSync(join(root, 'scripts/package-files.txt'), 'utf8')
  .split(/\r?\n/)
  .filter((line) => line && !line.startsWith('#'))
  .forEach((p) => mustExist(p, 'package-files.txt'));

if (problems.length) {
  console.error(`Manifest check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`Manifest OK: ${manifest.name} v${manifest.version}`);
