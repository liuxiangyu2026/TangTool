const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const targets = ['aarch64-apple-darwin', 'x86_64-apple-darwin', 'x86_64-pc-windows-msvc'];

module.exports = async function publish({ github, context, core }) {
  const repo = context.repo;
  const runId = Number(process.env.BUILD_RUN_ID);
  const releaseId = Number(process.env.RELEASE_ID);
  const commit = process.env.BUILD_COMMIT;
  if (!Number.isSafeInteger(runId) || runId <= 0 || !Number.isSafeInteger(releaseId) || releaseId <= 0 || !/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error('Invalid build or release inputs');
  }
  const { data: run } = await github.rest.actions.getWorkflowRun({ ...repo, run_id: runId });
  if (run.conclusion !== 'success' || run.head_sha !== commit || run.path !== '.github/workflows/desktop-build.yml') {
    throw new Error('Expected a successful desktop build of the exact source commit');
  }
  const { data: release } = await github.rest.repos.getRelease({ ...repo, release_id: releaseId });
  if (release.target_commitish !== commit || !release.prerelease) throw new Error('Release source/channel mismatch');

  const files = [];
  const platforms = [];
  for (const target of targets) {
    const directory = path.join('release-input', `TangTool-${target}`);
    const manifest = JSON.parse(await fs.readFile(path.join(directory, 'build-info.json'), 'utf8'));
    const checksums = await fs.readFile(path.join(directory, 'SHA256SUMS.txt'), 'utf8');
    if (manifest.commit !== commit || manifest.dirty !== false || manifest.target !== target || release.tag_name !== `v${manifest.version}` || manifest.files.length !== 2) {
      throw new Error(`Invalid provenance for ${target}`);
    }
    platforms.push(manifest);
    for (const name of manifest.files) {
      if (path.basename(name) !== name || !name.startsWith('TangTool-')) throw new Error('Invalid artifact filename');
      const data = await fs.readFile(path.join(directory, name));
      const sha256 = createHash('sha256').update(data).digest('hex');
      if (!checksums.split(/\r?\n/).includes(`${sha256}  ${name}`)) throw new Error(`Checksum mismatch: ${name}`);
      files.push({ name, data, sha256 });
    }
  }
  if (new Set(platforms.map(item => item.componentVersion)).size !== 1) throw new Error('Component versions differ');
  const combined = {
    version: platforms[0].version,
    componentVersion: platforms[0].componentVersion,
    commit,
    runId,
    platforms,
  };
  const metadata = {
    'SHA256SUMS.txt': files.map(file => `${file.sha256}  ${file.name}`).join('\n') + '\n',
    'build-info.json': JSON.stringify(combined, null, 2) + '\n',
  };
  for (const [name, contents] of Object.entries(metadata)) {
    const data = Buffer.from(contents);
    files.push({ name, data, sha256: createHash('sha256').update(data).digest('hex') });
  }

  for (const file of files) {
    let asset = release.assets.find(item => item.name === file.name);
    // 重试只移除本草稿未完成的传输，不覆盖已发布或摘要不符的完整附件。
    if (asset && asset.state !== 'uploaded' && release.draft) {
      await github.rest.repos.deleteReleaseAsset({ ...repo, asset_id: asset.id });
      asset = undefined;
    }
    if (!asset) {
      if (!release.draft) throw new Error('Cannot add missing files to a published release');
      ({ data: asset } = await github.rest.repos.uploadReleaseAsset({
        ...repo,
        release_id: releaseId,
        name: file.name,
        data: file.data,
        headers: { 'content-type': 'application/octet-stream', 'content-length': file.data.length },
      }));
    }
    if (asset.state !== 'uploaded' || asset.size !== file.data.length || asset.digest !== `sha256:${file.sha256}`) {
      throw new Error(`Remote checksum mismatch: ${file.name}`);
    }
    core.info(`Verified upload: ${file.name}`);
  }
  const { data: ready } = await github.rest.repos.getRelease({ ...repo, release_id: releaseId });
  if (ready.assets.length !== files.length) throw new Error('Unexpected release attachments');
  if (ready.draft) await github.rest.repos.updateRelease({ ...repo, release_id: releaseId, draft: false, prerelease: true });
  const { data: tag } = await github.rest.git.getRef({ ...repo, ref: `tags/${release.tag_name}` });
  if (tag.object.sha !== commit) throw new Error('Published tag source mismatch');
  // 草稿附件的 URL 可能含临时标签；发布后必须重新读取正式下载地址。
  const { data: published } = await github.rest.repos.getRelease({ ...repo, release_id: releaseId });
  if (published.draft || published.assets.length !== files.length) throw new Error('Release is not publicly complete');

  const verified = [];
  for (const file of files) {
    const asset = published.assets.find(item => item.name === file.name);
    if (!asset || asset.size !== file.data.length || asset.digest !== `sha256:${file.sha256}`) {
      throw new Error(`Published asset mismatch: ${file.name}`);
    }
    // 使用无登录凭证的公开下载地址回读，不能仅凭上传接口成功就认定交付完成。
    const response = await fetch(asset.browser_download_url, { signal: AbortSignal.timeout(120000), credentials: 'omit' });
    if (!response.ok) throw new Error(`Public download failed: ${file.name} (${response.status})`);
    const hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      hash.update(chunk);
    }
    const sha256 = hash.digest('hex');
    if (bytes !== file.data.length || sha256 !== file.sha256) throw new Error(`Public checksum mismatch: ${file.name}`);
    verified.push({ name: file.name, bytes, sha256, authenticated: false, checkedAt: new Date().toISOString() });
    await fs.writeFile('release-input/public-verification.json', JSON.stringify(verified, null, 2));
    core.info(`Public verified: ${file.name}`);
  }
  await core.summary.addHeading(`${release.tag_name} published`).addRaw(`Source: ${commit}\n\nAll ${verified.length} public downloads match SHA-256.`).write();
};
