import changelog from "../src/data/changelog.json";
import { configureLocale, normalizeLocale, t } from "../src/i18n/core";
import { toolGroups } from "../src/data/toolCatalog";

const releasesUrl = "https://github.com/liuxiangyu2026/TangTool/releases";
const languageKey = "tangtool.website.language.v1";
const languageSelect = document.querySelector("#site-language");
const status = document.querySelector("#release-status");
const versionList = document.querySelector("#version-list");
const downloads = document.querySelectorAll("[data-platform]");
const componentDownloads = document.querySelectorAll("[data-component-platform]");
const dialog = document.querySelector("#screenshot-dialog");
const expandedImage = document.querySelector("#expanded-screenshot");
const expandedCaption = document.querySelector("#expanded-caption");
const screenImages = import.meta.glob("./screenshots/*.webp", { eager: true, query: "?url", import: "default" });
const carousel = document.querySelector("#screenshots");
const screenshotTrack = carousel.querySelector(".screenshot-track");
const slides = [...carousel.querySelectorAll("[data-screenshot]")];
const screenshotDots = slides.map((slide, index) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.className = "screenshot-dot";
  dot.addEventListener("click", () => {
    slideIndex = index;
    renderSlide();
    scheduleSlide();
  });
  carousel.querySelector(".screenshot-dots").append(dot);
  return dot;
});
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let language = "zh-CN";
const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
try {
  language = normalizeLocale(localStorage.getItem(languageKey));
} catch {
  // 浏览器禁止本地存储时仍可在本页切换语言。
}
if (requestedLanguage === "en" || requestedLanguage === "zh-CN") language = requestedLanguage;
configureLocale(() => language);

const textBindings = [...document.querySelectorAll("[data-i18n]")].map(node => ({ node, key: node.textContent.replace(/\s+/g, " ").trim() }));
const attributeBindings = [
  ...[...document.querySelectorAll("[data-i18n-aria]")].map(node => ({ node, attribute: "aria-label", key: node.getAttribute("aria-label") })),
  ...[...document.querySelectorAll("[data-i18n-alt]")].map(node => ({ node, attribute: "alt", key: node.getAttribute("alt") })),
];
let activeGroup = "all";
let activeScreenshot = null;
let previousOverflow = "";
let releaseState = { loading: true, failed: false, releases: [] };
let slideIndex = 0;
let carouselTimer;
let pointerOverCarousel = false;

function renderSlide() {
  screenshotTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
  slides.forEach((slide, index) => {
    // 画面外的截图不接受焦点，避免 Tab 进入不可见链接。
    slide.inert = index !== slideIndex;
    slide.setAttribute("aria-hidden", String(index !== slideIndex));
  });
  screenshotDots.forEach((dot, index) => {
    dot.setAttribute("aria-label", t("查看截图：{name}", { name: slides[index].querySelector("img").alt }));
    dot.setAttribute("aria-pressed", String(index === slideIndex));
  });
}

function scheduleSlide() {
  clearTimeout(carouselTimer);
  // 悬停、键盘操作、大图和后台页面均暂停，避免用户正在查看的截图被切走。
  if (reducedMotion.matches || pointerOverCarousel || carousel.contains(document.activeElement) || dialog.open || document.hidden) return;
  carouselTimer = setTimeout(() => {
    slideIndex = (slideIndex + 1) % slides.length;
    renderSlide();
    scheduleSlide();
  }, 4500);
}

function renderTools() {
  let count = 0;
  for (const card of document.querySelectorAll("[data-tool-group]")) {
    card.hidden = activeGroup !== "all" && card.dataset.toolGroup !== activeGroup;
    if (!card.hidden) count += 1;
  }
  for (const button of document.querySelectorAll("[data-tool-filter]")) {
    button.setAttribute("aria-pressed", String(button.dataset.toolFilter === activeGroup));
    button.title = button.dataset.toolFilter === activeGroup ? t("再次点击显示所有工具") : "";
  }
  document.querySelector("#tool-count").textContent = t("显示 {count} 个工具", { count });
}

function renderScreenshots() {
  const suffix = language === "en" ? "en" : "zh";
  for (const image of document.querySelectorAll("[data-screen-image]")) {
    const url = screenImages[`./screenshots/${image.dataset.screenImage}-${suffix}.webp`];
    if (url) {
      image.src = url;
      image.closest("a").href = url;
    }
  }
  if (dialog.open && activeScreenshot) {
    const image = activeScreenshot.querySelector("img");
    expandedImage.src = image.src;
    expandedImage.alt = image.alt;
    expandedCaption.textContent = image.alt;
  }
}

// 仅接受本仓库 Release 的 HTTPS 链接。远端版本名不进入 innerHTML。
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

function renderReleases() {
  const { loading, failed, releases } = releaseState;
  versionList.replaceChildren();
  for (const link of componentDownloads) {
    link.href = releasesUrl;
    link.textContent = t("文档组件安装包 ↗");
    link.removeAttribute("title");
  }
  if (!releases.length) {
    for (const release of changelog) {
      const article = document.createElement("article");
      const title = document.createElement("h3");
      title.textContent = t("v{version} · 内置功能说明", { version: release.version });
      const list = document.createElement("ul");
      for (const entry of release.entries) {
        const item = document.createElement("li");
        item.textContent = t(entry);
        list.append(item);
      }
      article.append(title, list);
      versionList.append(article);
    }
    status.textContent = loading
      ? t("正在读取 GitHub 公开版本；若无法加载，可直接查看 GitHub Releases。")
      : failed
        ? t("暂时无法读取版本，请通过 GitHub Releases 查看安装包。")
        : t("尚未发布公开版本。完成验收后将在这里开放下载。");
    for (const link of downloads) {
      link.href = releasesUrl;
      link.textContent = t(failed ? "前往 GitHub 下载 ↗" : "查看发布状态 ↗");
      link.removeAttribute("title");
    }
    return;
  }

  // 优先正式版本；仅存在预发布时明确标记，且不跨版本补充平台安装包。
  const current = releases.find(release => !release.prerelease) ?? releases[0];
  status.textContent = t(current.prerelease ? "最新预发布：{version}，请按系统和芯片选择安装包。" : "最新版本：{version}，请按系统和芯片选择安装包。", { version: current.tag_name });
  for (const link of downloads) {
    const asset = (Array.isArray(current.assets) ? current.assets : []).find(asset => {
      if (!asset || typeof asset.name !== "string" || !releaseLink(asset.browser_download_url, "download")) return false;
      if (asset.name.startsWith("TangTool-DocumentRuntime-")) return false;
      if (link.dataset.platform === "windows") return /^TangTool.*(?:x64|x86_64).*\.exe$/i.test(asset.name);
      const isMac = /\.dmg$/i.test(asset.name) || /(?:apple-darwin|macos).*\.zip$/i.test(asset.name);
      if (link.dataset.platform === "arm") return isMac && /^TangTool.*(?:aarch64|arm64)/i.test(asset.name);
      return isMac && /^TangTool.*x86_64/i.test(asset.name);
    });
    link.href = asset ? releaseLink(asset.browser_download_url, "download") : current.html_url;
    link.textContent = asset ? t("下载 {version} ↓", { version: current.tag_name }) : t("此版本暂无安装包 ↗");
    if (asset && Number.isFinite(asset.size)) link.title = `${asset.name} · ${(asset.size / 1024 / 1024).toFixed(1)} MB`;
    else link.removeAttribute("title");
  }

  for (const link of componentDownloads) {
    const target = { windows: "x86_64-pc-windows-msvc-setup.exe", arm: "aarch64-apple-darwin.pkg", intel: "x86_64-apple-darwin.pkg" }[link.dataset.componentPlatform];
    const asset = (Array.isArray(current.assets) ? current.assets : []).find(asset =>
      asset && typeof asset.name === "string" && asset.name.startsWith("TangTool-DocumentRuntime-") && asset.name.endsWith(target) && releaseLink(asset.browser_download_url, "download"));
    link.href = asset ? releaseLink(asset.browser_download_url, "download") : current.html_url;
    link.textContent = t(asset ? "下载文档组件 ↓" : "文档组件安装包 ↗");
    if (asset && Number.isFinite(asset.size)) link.title = `${asset.name} · ${(asset.size / 1024 / 1024).toFixed(1)} MB`;
  }

  for (const release of releases.slice(0, 5)) {
    const article = document.createElement("article");
    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = release.html_url;
    link.textContent = `${release.tag_name}${release.prerelease ? " · " + t("预发布") : ""} ↗`;
    title.append(link);
    const description = document.createElement("p");
    description.textContent = t("查看此版本的更新说明与安装包。");
    article.append(title, description);
    versionList.append(article);
  }
}

function applyLanguage() {
  document.documentElement.lang = language;
  document.title = t("TangTool — 常用工具，就在手边");
  document.querySelector('meta[name="description"]').content = t("TangTool 本地桌面工具箱：19 个工具，覆盖 JSON、Excel、文档、编码、时间与图像，支持简体中文和英文。");
  languageSelect.value = language;
  for (const { node, key } of textBindings) {
    if (node.isConnected) node.textContent = t(key);
  }
  for (const { node, attribute, key } of attributeBindings) node.setAttribute(attribute, t(key));
  renderTools();
  renderScreenshots();
  renderSlide();
  renderReleases();
}

languageSelect.addEventListener("change", () => {
  language = normalizeLocale(languageSelect.value);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", language);
  window.history.replaceState(null, "", url);
  try {
    localStorage.setItem(languageKey, language);
  } catch {
    // 当前页面仍即时生效，不因偏好保存失败阻断工具介绍和下载。
  }
  applyLanguage();
});
for (const button of document.querySelectorAll("[data-tool-filter]")) {
  button.addEventListener("click", () => {
    const group = button.dataset.toolFilter;
    activeGroup = group !== activeGroup && toolGroups.some(item => item.id === group) ? group : "all";
    renderTools();
  });
}
for (const link of document.querySelectorAll("[data-screenshot]")) {
  link.addEventListener("click", event => {
    event.preventDefault();
    activeScreenshot = link;
    const image = link.querySelector("img");
    expandedImage.src = image.src;
    expandedImage.alt = image.alt;
    expandedCaption.textContent = image.alt;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    scheduleSlide();
  });
}
dialog.addEventListener("click", event => {
  if (event.target === dialog || event.target === expandedImage) dialog.close();
});
dialog.addEventListener("close", () => {
  document.body.style.overflow = previousOverflow;
  activeScreenshot?.focus();
  activeScreenshot = null;
  scheduleSlide();
});

carousel.addEventListener("pointerenter", event => {
  if (event.pointerType === "touch") return;
  pointerOverCarousel = true;
  scheduleSlide();
});
carousel.addEventListener("pointerleave", () => {
  pointerOverCarousel = false;
  scheduleSlide();
});
carousel.addEventListener("focusin", scheduleSlide);
carousel.addEventListener("focusout", () => queueMicrotask(scheduleSlide));
document.addEventListener("visibilitychange", scheduleSlide);
reducedMotion.addEventListener("change", scheduleSlide);
window.addEventListener("pagehide", () => clearTimeout(carouselTimer));
window.addEventListener("pageshow", scheduleSlide);

async function loadReleases() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch("https://api.github.com/repos/liuxiangyu2026/TangTool/releases?per_page=30", {
      signal: controller.signal,
      credentials: "omit",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid releases response");
    const releases = data.filter(release => release && !release.draft && typeof release.tag_name === "string" && releaseLink(release.html_url, "tag"));
    releaseState = { loading: false, failed: false, releases };
  } catch {
    releaseState = { loading: false, failed: true, releases: [] };
  } finally {
    clearTimeout(timeout);
    renderReleases();
  }
}

applyLanguage();
scheduleSlide();
void loadReleases();
