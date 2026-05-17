const content = document.getElementById("content");
const tabsEl = document.getElementById("tabs");
const copyAllBtn = document.getElementById("copyAll");
const reloadBtn = document.getElementById("reload");
const stats = document.getElementById("stats");
const countLabel = document.getElementById("countLabel");
const toast = document.getElementById("toast");
const footerLinks = document.getElementById("footerLinks");

const FOOTER_ICONS = {
  github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.756-1.335-1.756-1.087-.744.084-.729.084-.729 1.205.084 1.848 1.236 1.848 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.266 1.98-.399 3-.405 1.02.006 2.04.139 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.66 1.653.225 2.874.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>`,
  telegram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>`,
};

const proxyData = {};
let activeSection = "ru";

function initFooter() {
  footerLinks.innerHTML = SITE_CONFIG.footerLinks
    .map((link) => {
      const icon = FOOTER_ICONS[link.type] || FOOTER_ICONS.github;
      return `<a href="${escapeAttr(link.href)}" target="_blank" rel="noopener" class="footer-link footer-link--${link.type}" title="${escapeAttr(link.title)}">${icon}</a>`;
    })
    .join("");
}

function initHero() {
  document.getElementById("heroTitle").textContent = SITE_CONFIG.title;
  document.title = SITE_CONFIG.title;
}

function initTabs() {
  tabsEl.innerHTML = SITE_CONFIG.proxySections
    .map(
      (section) =>
        `<button type="button" class="tab" role="tab" data-id="${section.id}" aria-selected="false">${escapeHtml(section.label)}</button>`
    )
    .join("");

  tabsEl.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => switchSection(btn.dataset.id));
  });
}

function parseLines(text) {
  const seen = new Set();
  const lines = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    lines.push(trimmed);
  }
  return lines.sort().map(parseProxy);
}

function parseProxy(line) {
  try {
    const url = new URL(line.trim());
    return {
      raw: line.trim(),
      server: url.searchParams.get("server") || "—",
      port: url.searchParams.get("port") || "—",
    };
  } catch {
    return { raw: line.trim(), server: line.trim(), port: "" };
  }
}

function getActiveProxies() {
  return proxyData[activeSection] || [];
}

function switchSection(id) {
  activeSection = id;
  tabsEl.querySelectorAll(".tab").forEach((btn) => {
    const selected = btn.dataset.id === id;
    btn.classList.toggle("active", selected);
    btn.setAttribute("aria-selected", selected ? "true" : "false");
  });
  updateView();
}

function updateView() {
  const items = getActiveProxies();
  const section = SITE_CONFIG.proxySections.find((s) => s.id === activeSection);

  if (!items.length) {
    content.innerHTML = '<p class="empty">Список прокси пуст</p>';
    stats.hidden = true;
    copyAllBtn.hidden = true;
    return;
  }

  stats.hidden = false;
  copyAllBtn.hidden = false;
  countLabel.textContent =
    items.length +
    " " +
    plural(items.length, "прокси", "прокси", "прокси") +
    (section ? " · " + section.label : "");
  renderList(items);
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

function renderList(items) {
  content.innerHTML = '<div class="list" id="list"></div>';
  const list = document.getElementById("list");

  items.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "proxy-card";
    card.innerHTML = `
      <span class="proxy-num">${i + 1}</span>
      <div class="proxy-info">
        <div class="proxy-host" title="${escapeHtml(p.server)}">${escapeHtml(p.server)}</div>
        <div class="proxy-meta">порт ${escapeHtml(p.port)}</div>
      </div>
      <div class="proxy-actions">
        <button type="button" class="btn-icon btn-copy" title="Копировать" data-proxy="${escapeAttr(p.raw)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <a class="btn-icon" href="${escapeAttr(p.raw)}" title="Открыть в Telegram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await copyText(btn.dataset.proxy);
      showToast("Скопировано");
      btn.classList.add("copied");
      setTimeout(() => btn.classList.remove("copied"), 1500);
    });
  });
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

async function loadProxies() {
  content.innerHTML = '<p class="loading">Загрузка прокси…</p>';
  stats.hidden = true;
  copyAllBtn.hidden = true;
  tabsEl.querySelectorAll(".tab").forEach((btn) => (btn.disabled = true));

  try {
    await Promise.all(
      SITE_CONFIG.proxySections.map(async (section) => {
        const res = await fetch(section.url + "?_=" + Date.now());
        if (!res.ok) throw new Error(section.id + ": HTTP " + res.status);
        proxyData[section.id] = parseLines(await res.text());
      })
    );

    tabsEl.querySelectorAll(".tab").forEach((btn) => (btn.disabled = false));
    switchSection(activeSection);
  } catch {
    tabsEl.querySelectorAll(".tab").forEach((btn) => (btn.disabled = false));
    content.innerHTML = `
      <p class="error">Не удалось загрузить списки прокси</p>
      <p class="empty">Проверьте интернет или попробуйте позже.</p>
      <button type="button" class="btn btn-primary" id="retryLoad">Повторить</button>
    `;
    document.getElementById("retryLoad")?.addEventListener("click", loadProxies);
  }
}

function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

initFooter();
initHero();
initTabs();
copyAllBtn.addEventListener("click", async () => {
  const items = getActiveProxies();
  await copyText(items.map((p) => p.raw).join("\n"));
  showToast(
    "Скопировано " +
      items.length +
      " " +
      plural(items.length, "ссылка", "ссылки", "ссылок")
  );
});
reloadBtn.addEventListener("click", loadProxies);
loadProxies();
