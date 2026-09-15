export type ReleaseInfo = {
  tag: string;
  name: string;
  url: string;
  body: string;
  prerelease: boolean;
};

type Version = { core: string[]; prerelease: string[] };

function parseVersion(value: string): Version | null {
  if (value.length > 128) return null;
  const match = /^[vV]?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(value);
  if (!match) return null;
  const prerelease = match[4]?.split('.') ?? [];
  if (prerelease.some(part => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0'))) return null;
  return { core: match.slice(1, 4), prerelease };
}

/** 按 SemVer 比较，不用字符串排序，也不让大数字经 Number 转换丢失精度。 */
export function compareVersions(left: string, right: string): number | null {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return null;
  for (let index = 0; index < 3; index += 1) {
    const first = a.core[index]!;
    const second = b.core[index]!;
    if (first !== second) return first.length !== second.length ? first.length - second.length : first > second ? 1 : -1;
  }
  if (!a.prerelease.length || !b.prerelease.length) {
    return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length ? -1 : 1;
  }
  for (let index = 0; index < Math.max(a.prerelease.length, b.prerelease.length); index += 1) {
    const first = a.prerelease[index];
    const second = b.prerelease[index];
    if (first === undefined || second === undefined) return first === undefined ? -1 : 1;
    if (first === second) continue;
    const firstNumeric = /^\d+$/.test(first);
    const secondNumeric = /^\d+$/.test(second);
    if (firstNumeric !== secondNumeric) return firstNumeric ? -1 : 1;
    if (firstNumeric && first.length !== second.length) return first.length - second.length;
    return first > second ? 1 : -1;
  }
  return 0;
}

export function readReleases(data: unknown): ReleaseInfo[] {
  if (!Array.isArray(data)) throw new Error('Invalid release response');
  const releases: ReleaseInfo[] = [];
  for (const item of data.slice(0, 30)) {
    if (!item || typeof item !== 'object' || item.draft !== false || typeof item.prerelease !== 'boolean' || typeof item.tag_name !== 'string' || typeof item.html_url !== 'string') continue;
    const version = parseVersion(item.tag_name);
    if (!version) continue;
    try {
      const url = new URL(item.html_url);
      const prefix = '/liuxiangyu2026/TangTool/releases/tag/';
      // 只打开本仓库、同一个版本的 HTTPS 页面；远端内容不成为可执行链接或模板。
      if (url.origin !== 'https://github.com' || url.username || url.password || url.search || url.hash || !url.pathname.startsWith(prefix) || decodeURIComponent(url.pathname.slice(prefix.length)) !== item.tag_name) continue;
      releases.push({
        tag: item.tag_name,
        name: typeof item.name === 'string' ? item.name.slice(0, 200) : item.tag_name,
        url: url.href,
        body: typeof item.body === 'string' ? item.body.slice(0, 12000) : '',
        prerelease: item.prerelease || version.prerelease.length > 0,
      });
    } catch {
      // 忽略格式错误的条目，其余合法发布仍可用于提醒。
    }
  }
  return releases;
}

export function findAvailableUpdate(releases: ReleaseInfo[], current: string, includePrereleases: boolean): ReleaseInfo | null {
  let latest: ReleaseInfo | null = null;
  for (const release of releases) {
    if (release.prerelease && !includePrereleases) continue;
    if ((compareVersions(release.tag, current) ?? -1) <= 0) continue;
    if (!latest || (compareVersions(release.tag, latest.tag) ?? -1) > 0) latest = release;
  }
  return latest;
}
