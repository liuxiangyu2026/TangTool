import changelog from "../src/data/changelog.json";

const releasesUrl = "https://github.com/liuxiangyu2026/TangTool/releases";
const status = document.querySelector("#release-status");
const versionList = document.querySelector("#version-list");
const downloads = document.querySelectorAll("[data-platform]");

function showDevelopmentNotes() {
  versionList.replaceChildren();
  for (const release of changelog) {
    const article = document.createElement("article");
    const title = document.createElement("h3");
    title.textContent = `v${release.version} · ${release.status}（非公开发布）`;
    const list = document.createElement("ul");
    for (const entry of release.entries) {
      const item = document.createElement("li");
      item.textContent = entry;
      list.append(item);
    }
    article.append(title, list);
    versionList.append(article);
  }
}

// 只使用本仓库的 HTTPS Release 链接；不将远端版本名或说明注入 HTML。
function releaseLink(value, kind) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === "https://github.com" && url.pathname.startsWith(`/liuxiangyu2026/TangTool/releases/${kind}/`) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

async function loadReleases() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  showDevelopmentNotes();
  try {
    const response = await fetch("https://api.github.com/repos/liuxiangyu2026/TangTool/releases?per_page=30", {
      signal: controller.signal,
      credentials: "omit",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid releases response");
    const releases = data.filter((release) => release && !release.draft && typeof release.tag_name === "string" && releaseLink(release.html_url, "tag"));
    if (!releases.length) {
      status.textContent = "尚未发布公开版本。三平台测试构建已完成，正式下载将在发布 Release 后开放。";
      downloads.forEach((link) => {
        link.textContent = "尚未发布 · 查看进度 ↗";
      });
      return;
    }

    // 优先正式版本；仅存在预发布时明确标记，且不会混用其他版本的安装包。
    const current = releases.find((release) => !release.prerelease) ?? releases[0];
    status.textContent = `${current.prerelease ? "最新预发布（测试版）" : "最新正式版"}：${current.tag_name}。请按系统和芯片选择安装包。`;
    for (const link of downloads) {
      const asset = (Array.isArray(current.assets) ? current.assets : []).find((asset) => {
        if (!asset || typeof asset.name !== "string" || !releaseLink(asset.browser_download_url, "download")) return false;
        if (link.dataset.platform === "windows") return /^TangTool.*(?:x64|x86_64).*\.exe$/i.test(asset.name);
        // ZIP 必须同时带 macOS 平台标识，避免将 Windows ARM/x64 ZIP 误当成 Mac 包。
        const isMac = /\.dmg$/i.test(asset.name) || /(?:apple-darwin|macos).*\.zip$/i.test(asset.name);
        if (link.dataset.platform === "arm") return isMac && /^TangTool.*(?:aarch64|arm64)/i.test(asset.name);
        return isMac && /^TangTool.*x86_64/i.test(asset.name);
      });
      link.href = asset ? releaseLink(asset.browser_download_url, "download") : current.html_url;
      link.textContent = asset ? `下载 ${current.tag_name} ↓` : "此版本暂无安装包 ↗";
      if (asset && Number.isFinite(asset.size)) link.title = `${asset.name} · ${(asset.size / 1024 / 1024).toFixed(1)} MB`;
    }

    versionList.replaceChildren();
    for (const release of releases.slice(0, 5)) {
      const article = document.createElement("article");
      const title = document.createElement("h3");
      const link = document.createElement("a");
      link.href = release.html_url;
      link.textContent = `${release.tag_name}${release.prerelease ? " · 预发布" : ""} ↗`;
      title.append(link);
      const excerpt = document.createElement("p");
      // 不渲染来自 Release 的原始 HTML / Markdown，完整升级说明在 GitHub 查看。
      excerpt.textContent = typeof release.body === "string" && release.body.trim() ? release.body.slice(0, 180) : "查看此版本的更新说明与安装包。";
      article.append(title, excerpt);
      versionList.append(article);
    }
  } catch {
    status.textContent = "暂时无法读取版本（网络不可用或 GitHub 请求受限）。请通过下方入口直接查看 Releases。";
    downloads.forEach((link) => {
      link.href = releasesUrl;
      link.textContent = "前往 GitHub 下载 ↗";
    });
  } finally {
    clearTimeout(timeout);
  }
}

void loadReleases();
