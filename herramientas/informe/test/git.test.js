const test = require('node:test');
const assert = require('node:assert');
const { ultimoCambioGit } = require('../lib/git');

test('returns the date of the last commit that touched a file, relative to the repository root', () => {
  assert.match(ultimoCambioGit('apps/vender/lib/metadatos.js'), /^\d{4}-\d{2}-\d{2}$/);
});

test('returns null for a file git does not know', () => {
  assert.equal(ultimoCambioGit('apps/vender/lib/no-existe.js'), null);
});
