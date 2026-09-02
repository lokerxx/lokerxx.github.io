const dataStore = window.cveResearchData ?? { generatedAt: "", entries: [] };
const entries = Array.isArray(dataStore.entries) ? dataStore.entries : [];
const page = document.body.dataset.page || "home";
const LANGUAGE_STORAGE_KEY = "lokerxx-site-language";

const uiText = {
  en: {
    brandTagline: "Security research journal",
    navHome: "Home",
    navTable: "Table",
    navCnvd: "CNVD",
    navDetails: "Details",
    colVendor: "Vendor",
    colCve: "CVE ID",
    colOfficialSeverity: "Official Severity",
    colOfficialScore: "Official Score",
    colNvdScore: "NVD / ADP Score",
    colStatus: "Status",
    emptyState: "No vulnerability tracking entries are available for display.",
    pageTitleHome: "LOKERXX | Vulnerability Research",
    pageTitleDetail: "LOKERXX | Vulnerability Detail",
    pageDescriptionHome:
      "LOKERXX's vulnerability research archive. The homepage tracks public Apache CVE and CNVD records with source context.",
    pageDescriptionDetail:
      "Vulnerability detail page showing public Apache CVE and CNVD records with scores, affected versions, and source links.",
    categoryNavLabel: "Browse by category",
    categoryCve: "Apache CVE",
    categoryCnvd: "CNVD",
    categoryCveTitle: "Apache CVE records",
    categoryCveDescription: "Apache security advisories tracked in the archive.",
    categoryCnvdTitle: "CNVD records",
    categoryCnvdDescription: "Reports from China's National Vulnerability Database.",
    categoryRecordSingular: "record",
    categoryRecordPlural: "records",
    detailPublicDescription: "Public Description",
    detailResearchNotes: "Research Notes",
    detailPublishedDate: "Published Date",
    detailStatus: "Status",
    detailOfficialSeverity: "Official Severity",
    detailOfficialScore: "Official Score",
    detailNvdScore: "NVD / ADP Score",
    detailAffectedVersions: "Affected Versions",
    detailFixedVersions: "Fixed Versions",
    detailReferences: "References",
    placeholder: "TBD",
  },
  zh: {
    brandTagline: "安全研究日志",
    navHome: "首页",
    navTable: "总表",
    navCnvd: "CNVD",
    navDetails: "详情",
    colVendor: "厂商",
    colCve: "CVE 编号",
    colOfficialSeverity: "官方风险等级",
    colOfficialScore: "官方评分",
    colNvdScore: "NVD / ADP 评分",
    colStatus: "状态",
    emptyState: "当前没有可展示的漏洞跟踪条目。",
    pageTitleHome: "LOKERXX | 漏洞研究",
    pageTitleDetail: "LOKERXX | 漏洞详情",
    pageDescriptionHome:
      "LOKERXX 的漏洞记录首页，展示已公开的 Apache CVE 与 CNVD 记录及其来源背景。",
    pageDescriptionDetail:
      "漏洞详情页，展示公开 Apache CVE 与 CNVD 记录的描述、评分、影响版本和来源链接。",
    categoryNavLabel: "按类别浏览",
    categoryCve: "Apache CVE",
    categoryCnvd: "CNVD",
    categoryCveTitle: "Apache CVE 记录",
    categoryCveDescription: "归档中的 Apache 安全公告记录。",
    categoryCnvdTitle: "CNVD 记录",
    categoryCnvdDescription: "中国国家信息安全漏洞库报告。",
    categoryRecordSingular: "条记录",
    categoryRecordPlural: "条记录",
    detailPublicDescription: "公开描述",
    detailResearchNotes: "补充说明",
    detailPublishedDate: "公开日期",
    detailStatus: "状态",
    detailOfficialSeverity: "官方风险等级",
    detailOfficialScore: "官方评分",
    detailNvdScore: "NVD / ADP 评分",
    detailAffectedVersions: "影响版本",
    detailFixedVersions: "修复版本",
    detailReferences: "参考链接",
    placeholder: "待公开",
  },
};

const referenceLabelZh = {
  "CNVD report": "CNVD 报告页面",
  "CVE.org record": "CVE.org 记录",
  "MITRE CVE API status": "MITRE CVE API 状态",
  "Apache ActiveMQ advisory": "Apache ActiveMQ 公告",
  "Apache APISIX advisory": "Apache APISIX 公告",
  "Apache HTTP Server 2.4 vulnerabilities": "Apache HTTP Server 2.4 漏洞公告",
  "Apache Tomcat 11 vulnerabilities": "Apache Tomcat 11 漏洞公告",
};

const severityLabelMap = {
  en: {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  },
  zh: {
    critical: "严重",
    high: "高",
    medium: "中",
    low: "低",
  },
};

const statusLabelMap = {
  en: {
    published: "Published",
    reserved: "Reserved",
    rejected: "Rejected",
    reported: "Reported",
    none: "-",
  },
  zh: {
    published: "已公开",
    reserved: "保留中",
    rejected: "已拒绝",
    reported: "已上报",
    none: "-",
  },
};

function resolveInitialLanguage() {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "en" || stored === "zh") {
    return stored;
  }

  const docLang = String(document.documentElement.lang || "").toLowerCase();
  if (docLang.startsWith("zh")) {
    return "zh";
  }

  return "en";
}

let currentLanguage = resolveInitialLanguage();

const yearNode = document.querySelector("#year");
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const t = (key) => uiText[currentLanguage][key] ?? uiText.en[key] ?? key;

const normalizeCategory = (category) => String(category || "CVE").trim().toUpperCase();

const categoryConfig = {
  CVE: {
    labelKey: "categoryCve",
    titleKey: "categoryCveTitle",
    descriptionKey: "categoryCveDescription",
  },
  CNVD: {
    labelKey: "categoryCnvd",
    titleKey: "categoryCnvdTitle",
    descriptionKey: "categoryCnvdDescription",
  },
};

const getCategoryMeta = (category) => {
  const key = normalizeCategory(category);
  const config = categoryConfig[key] || categoryConfig.CVE;

  return {
    key,
    label: t(config.labelKey),
    title: t(config.titleKey),
    description: t(config.descriptionKey),
  };
};

const categoryAnchor = (category) => `category-${normalizeCategory(category).toLowerCase()}`;

const groupEntriesByCategory = (sourceEntries) => {
  const groups = [];
  const groupMap = new Map();

  sourceEntries.forEach((entry) => {
    const key = normalizeCategory(entry.category);
    let group = groupMap.get(key);

    if (!group) {
      group = { category: key, entries: [] };
      groupMap.set(key, group);
      groups.push(group);
    }

    group.entries.push(entry);
  });

  return groups;
};

const getEntryText = (entry, field) => {
  if (currentLanguage === "zh" && entry[`${field}Zh`]) {
    return entry[`${field}Zh`];
  }

  return entry[field] ?? "";
};

const getEntryVendor = (entry) => getEntryText(entry, "vendor") || "-";

const formatScore = (score) => {
  if (score === null || score === undefined || score === "") {
    return "-";
  }

  return typeof score === "number" ? score.toFixed(1) : String(score);
};

const scoreClassName = (score) => {
  if (score === null || score === undefined || score === "") {
    return "score-pill is-none";
  }

  return Number(score) >= 7 ? "score-pill is-high" : "score-pill";
};

const formatScoreSource = (source) => {
  if (!source) {
    return "";
  }

  return `<span class="score-source">${source}</span>`;
};

const resolveOfficialScore = (entry) => {
  if (entry.officialCvss !== undefined) {
    return entry.officialCvss;
  }

  return null;
};

const resolveOfficialScoreSource = (entry) => {
  if (entry.officialCvssSource) {
    return entry.officialCvssSource;
  }

  return "";
};

const resolveNvdScore = (entry) => {
  if (entry.nvdCvss !== undefined) {
    return entry.nvdCvss;
  }

  return null;
};

const resolveNvdScoreSource = (entry) => {
  if (entry.nvdCvssSource) {
    return entry.nvdCvssSource;
  }

  return "";
};

const formatOfficialSeverity = (severity) => {
  const normalizedSeverity = String(severity || "").trim().toUpperCase();

  if (!normalizedSeverity) {
    return { label: "-", className: "risk-pill is-none" };
  }

  if (normalizedSeverity === "CRITICAL") {
    return { label: severityLabelMap[currentLanguage].critical, className: "risk-pill is-critical" };
  }

  if (normalizedSeverity === "IMPORTANT" || normalizedSeverity === "HIGH") {
    return { label: severityLabelMap[currentLanguage].high, className: "risk-pill is-high" };
  }

  if (normalizedSeverity === "MODERATE" || normalizedSeverity === "MEDIUM") {
    return { label: severityLabelMap[currentLanguage].medium, className: "risk-pill is-medium" };
  }

  if (normalizedSeverity === "LOW") {
    return { label: severityLabelMap[currentLanguage].low, className: "risk-pill is-low" };
  }

  return { label: normalizedSeverity, className: "risk-pill is-none" };
};

const formatStatus = (status) => {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  if (!normalizedStatus) {
    return { label: statusLabelMap[currentLanguage].none, className: "status-pill is-none" };
  }

  if (normalizedStatus === "PUBLISHED" || normalizedStatus === "PUBLIC") {
    return { label: statusLabelMap[currentLanguage].published, className: "status-pill is-public" };
  }

  if (normalizedStatus === "RESERVED" || normalizedStatus === "PENDING") {
    return { label: statusLabelMap[currentLanguage].reserved, className: "status-pill is-reserved" };
  }

  if (normalizedStatus === "REJECTED") {
    return { label: statusLabelMap[currentLanguage].rejected, className: "status-pill is-rejected" };
  }

  if (normalizedStatus === "REPORTED") {
    return { label: statusLabelMap[currentLanguage].reported, className: "status-pill is-reported" };
  }

  return { label: normalizedStatus, className: "status-pill is-none" };
};

const formatList = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return t("placeholder");
  }

  return items.join(" / ");
};

const formatDate = (value) => value || "-";

const translateReferenceLabel = (label) => {
  if (currentLanguage !== "zh") {
    return label;
  }

  if (referenceLabelZh[label]) {
    return referenceLabelZh[label];
  }

  return label;
};

function applyStaticText() {
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  });

  const toggleButton = document.querySelector("#language-toggle");
  if (toggleButton) {
    toggleButton.textContent = currentLanguage === "zh" ? "English" : "中文";
  }

  document.title = page === "detail" ? t("pageTitleDetail") : t("pageTitleHome");

  const descriptionNode = document.querySelector('meta[name="description"]');
  if (descriptionNode) {
    descriptionNode.setAttribute("content", page === "detail" ? t("pageDescriptionDetail") : t("pageDescriptionHome"));
  }
}

const renderTableHead = () => `
  <thead>
    <tr>
      <th data-i18n="colVendor">${t("colVendor")}</th>
      <th data-i18n="colCve">${t("colCve")}</th>
      <th data-i18n="colOfficialSeverity">${t("colOfficialSeverity")}</th>
      <th data-i18n="colOfficialScore">${t("colOfficialScore")}</th>
      <th data-i18n="colNvdScore">${t("colNvdScore")}</th>
      <th data-i18n="colStatus">${t("colStatus")}</th>
    </tr>
  </thead>
`;

const renderEntryRow = (entry) => {
  const officialSeverity = formatOfficialSeverity(entry.officialSeverity);
  const status = formatStatus(entry.status);
  const officialScore = resolveOfficialScore(entry);
  const officialScoreSource = resolveOfficialScoreSource(entry);
  const nvdScore = resolveNvdScore(entry);
  const nvdScoreSource = resolveNvdScoreSource(entry);
  const entryHref = page === "detail" ? `#${entry.id}` : `cve_detail.html#${entry.id}`;

  return `
    <tr>
      <td>${getEntryVendor(entry)}</td>
      <td>
        <a class="cve-link" href="${entryHref}">${entry.publicCve}</a>
      </td>
      <td>
        <div class="risk-cell">
          <span class="${officialSeverity.className}">${officialSeverity.label}</span>
          ${formatScoreSource(entry.officialSeveritySource)}
        </div>
      </td>
      <td>
        <div class="score-cell">
          <span class="${scoreClassName(officialScore)}">${formatScore(officialScore)}</span>
          ${formatScoreSource(officialScoreSource)}
        </div>
      </td>
      <td>
        <div class="score-cell">
          <span class="${scoreClassName(nvdScore)}">${formatScore(nvdScore)}</span>
          ${formatScoreSource(nvdScoreSource)}
        </div>
      </td>
      <td>
        <div class="status-cell">
          <span class="${status.className}">${status.label}</span>
          ${formatScoreSource(entry.statusSource)}
        </div>
      </td>
    </tr>
  `;
};

const renderCategoryGroups = (sourceEntries) =>
  groupEntriesByCategory(sourceEntries)
    .map((group) => {
      const category = getCategoryMeta(group.category);
      const countLabel = group.entries.length === 1 ? t("categoryRecordSingular") : t("categoryRecordPlural");

      return `
        <section class="category-group" id="${categoryAnchor(group.category)}">
          <div class="category-heading">
            <div>
              <p class="category-eyebrow">${category.label}</p>
              <h3>${category.title}</h3>
              <p>${category.description}</p>
            </div>
            <span class="category-count">${group.entries.length} ${countLabel}</span>
          </div>
          <article class="panel table-panel">
            <div class="table-wrap">
              <table class="research-table">
                ${renderTableHead()}
                <tbody>${group.entries.map(renderEntryRow).join("")}</tbody>
              </table>
            </div>
          </article>
        </section>
      `;
    })
    .join("");

function renderHomePage() {
  const groups = document.querySelector("#public-cve-groups");

  if (!groups) {
    return;
  }

  groups.innerHTML = entries.length
    ? renderCategoryGroups(entries)
    : `<article class="panel table-panel"><p class="empty-state">${t("emptyState")}</p></article>`;
}

function renderDetailFacts(entry, status, officialSeverity) {
  const officialScore = resolveOfficialScore(entry);
  const officialScoreSource = resolveOfficialScoreSource(entry);
  const nvdScore = resolveNvdScore(entry);
  const nvdScoreSource = resolveNvdScoreSource(entry);

  return `
    <div class="detail-fact-grid">
      <div class="detail-fact">
        <span class="detail-fact-label">${t("detailPublishedDate")}</span>
        <div class="detail-fact-value">${formatDate(entry.publishedDate)}</div>
      </div>
      <div class="detail-fact">
        <span class="detail-fact-label">${t("detailStatus")}</span>
        <div class="detail-fact-value">
          <span class="${status.className}">${status.label}</span>
          ${entry.statusSource ? ` ${formatScoreSource(entry.statusSource)}` : ""}
        </div>
      </div>
      <div class="detail-fact">
        <span class="detail-fact-label">${t("detailOfficialSeverity")}</span>
        <div class="detail-fact-value">
          <span class="${officialSeverity.className}">${officialSeverity.label}</span>
          ${entry.officialSeveritySource ? ` ${formatScoreSource(entry.officialSeveritySource)}` : ""}
        </div>
      </div>
      <div class="detail-fact">
        <span class="detail-fact-label">${t("detailOfficialScore")}</span>
        <div class="detail-fact-value">
          <span class="${scoreClassName(officialScore)}">${formatScore(officialScore)}</span>
          ${officialScoreSource ? ` ${formatScoreSource(officialScoreSource)}` : ""}
        </div>
      </div>
      <div class="detail-fact">
        <span class="detail-fact-label">${t("detailNvdScore")}</span>
        <div class="detail-fact-value">
          <span class="${scoreClassName(nvdScore)}">${formatScore(nvdScore)}</span>
          ${nvdScoreSource ? ` ${formatScoreSource(nvdScoreSource)}` : ""}
        </div>
      </div>
      <div class="detail-fact">
        <span class="detail-fact-label">${t("detailAffectedVersions")}</span>
        <div class="detail-fact-value">${formatList(entry.affectedVersions)}</div>
      </div>
      <div class="detail-fact">
        <span class="detail-fact-label">${t("detailFixedVersions")}</span>
        <div class="detail-fact-value">${formatList(entry.fixedVersions)}</div>
      </div>
    </div>
  `;
}

function renderDetailPage() {
  const detailIndexGroups = document.querySelector("#detail-index-groups");
  const detailList = document.querySelector("#detail-list");

  if (!detailIndexGroups || !detailList) {
    return;
  }

  if (entries.length === 0) {
    detailIndexGroups.innerHTML = `<article class="panel table-panel"><p class="empty-state">${t("emptyState")}</p></article>`;
    detailList.innerHTML = `
      <article class="panel detail-section">
        <p class="detail-copy">${t("emptyState")}</p>
      </article>
    `;
    return;
  }

  detailIndexGroups.innerHTML = renderCategoryGroups(entries);

  detailList.innerHTML = entries
    .map((entry) => {
      const status = formatStatus(entry.status);
      const officialSeverity = formatOfficialSeverity(entry.officialSeverity);
      const category = getCategoryMeta(entry.category);
      const localizedSummary = getEntryText(entry, "summary");
      const localizedDetail = getEntryText(entry, "detail");
      const summaryBlock = !entry.hidePublicDescription && localizedSummary
        ? `
            <div class="detail-copy-block">
              <p class="detail-block-label">${t("detailPublicDescription")}</p>
              <p class="detail-copy">${localizedSummary}</p>
            </div>
          `
        : "";
      const references = Array.isArray(entry.references) && entry.references.length > 0
        ? entry.references
            .map(
              (reference) => `
                <a href="${reference.url}">${translateReferenceLabel(reference.label)}</a>
              `,
            )
            .join("")
        : t("placeholder");

      return `
        <article class="panel detail-section" id="${entry.id}">
          <div class="detail-section-head">
            <div>
              <p class="category-label">${category.label}</p>
              <p class="eyebrow">${getEntryVendor(entry)}</p>
              <h3>${entry.publicCve}</h3>
            </div>
          </div>

          <div class="detail-copy-stack">
            ${summaryBlock}

            <div class="detail-copy-block">
              <p class="detail-block-label">${t("detailResearchNotes")}</p>
              <p class="detail-copy">${localizedDetail || t("placeholder")}</p>
            </div>

            ${renderDetailFacts(entry, status, officialSeverity)}

            <div class="detail-copy-block">
              <p class="detail-block-label">${t("detailReferences")}</p>
              <div class="detail-record-links">${references}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPage() {
  applyStaticText();

  if (page === "home") {
    renderHomePage();
  }

  if (page === "detail") {
    renderDetailPage();
  }
}

const toggleButton = document.querySelector("#language-toggle");
if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    currentLanguage = currentLanguage === "zh" ? "en" : "zh";
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    renderPage();
  });
}

renderPage();
