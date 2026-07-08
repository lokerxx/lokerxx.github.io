const dataStore = window.cveResearchData ?? { generatedAt: "", entries: [] };
const entries = Array.isArray(dataStore.entries) ? dataStore.entries : [];
const page = document.body.dataset.page || "home";
const LANGUAGE_STORAGE_KEY = "lokerxx-site-language";

const uiText = {
  en: {
    navHome: "Home",
    navTable: "Table",
    navDetails: "Details",
    colVendor: "Vendor",
    colCve: "CVE ID",
    colOfficialSeverity: "Official Severity",
    colOfficialScore: "Official Score",
    colNvdScore: "NVD / ADP Score",
    colStatus: "Status",
    emptyState: "No Apache CVE tracking entries are available for display.",
    pageTitleHome: "LOKERXX | Apache CVE Research",
    pageTitleDetail: "LOKERXX | Apache CVE Detail",
    pageDescriptionHome:
      "LOKERXX's Apache CVE research archive. The homepage tracks published and reserved CVE records with official severity, official score, NVD / ADP score, and status.",
    pageDescriptionDetail:
      "Apache CVE detail page showing the public record, official and NVD / ADP scores, affected versions, fixed versions, and references for tracked CVEs.",
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
    navHome: "首页",
    navTable: "总表",
    navDetails: "详情",
    colVendor: "厂商",
    colCve: "CVE 编号",
    colOfficialSeverity: "官方风险等级",
    colOfficialScore: "官方评分",
    colNvdScore: "NVD / ADP 评分",
    colStatus: "状态",
    emptyState: "当前没有可展示的 Apache CVE 跟踪条目。",
    pageTitleHome: "LOKERXX | Apache CVE 研究",
    pageTitleDetail: "LOKERXX | Apache CVE 详情",
    pageDescriptionHome:
      "LOKERXX 的 Apache CVE 研究归档首页，展示已公开和保留中的 CVE 记录、官方风险等级、官方评分、NVD / ADP 评分与状态。",
    pageDescriptionDetail:
      "Apache CVE 详情页，展示已跟踪 CVE 的公开描述、官方评分、NVD / ADP 评分、影响版本、修复版本和参考链接。",
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
    none: "-",
  },
  zh: {
    published: "已公开",
    reserved: "保留中",
    rejected: "已拒绝",
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

const getEntryText = (entry, field) => {
  if (currentLanguage === "zh" && entry[`${field}Zh`]) {
    return entry[`${field}Zh`];
  }

  return entry[field] ?? "";
};

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

function renderHomePage() {
  const tableBody = document.querySelector("#public-cve-body");

  if (!tableBody) {
    return;
  }

  if (entries.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">${t("emptyState")}</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = entries
    .map((entry) => {
      const officialSeverity = formatOfficialSeverity(entry.officialSeverity);
      const status = formatStatus(entry.status);
      const officialScore = resolveOfficialScore(entry);
      const officialScoreSource = resolveOfficialScoreSource(entry);
      const nvdScore = resolveNvdScore(entry);
      const nvdScoreSource = resolveNvdScoreSource(entry);

      return `
        <tr>
          <td>${entry.vendor}</td>
          <td>
            <a class="cve-link" href="cve_detail.html#${entry.id}">${entry.publicCve}</a>
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
    })
    .join("");
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
  const detailIndexBody = document.querySelector("#detail-index-body");
  const detailList = document.querySelector("#detail-list");

  if (!detailIndexBody || !detailList) {
    return;
  }

  if (entries.length === 0) {
    detailIndexBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">${t("emptyState")}</td>
      </tr>
    `;
    detailList.innerHTML = `
      <article class="panel detail-section">
        <p class="detail-copy">${t("emptyState")}</p>
      </article>
    `;
    return;
  }

  detailIndexBody.innerHTML = entries
    .map((entry) => {
      const officialSeverity = formatOfficialSeverity(entry.officialSeverity);
      const status = formatStatus(entry.status);
      const officialScore = resolveOfficialScore(entry);
      const officialScoreSource = resolveOfficialScoreSource(entry);
      const nvdScore = resolveNvdScore(entry);
      const nvdScoreSource = resolveNvdScoreSource(entry);

      return `
        <tr>
          <td>${entry.vendor}</td>
          <td><a class="cve-link" href="#${entry.id}">${entry.publicCve}</a></td>
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
    })
    .join("");

  detailList.innerHTML = entries
    .map((entry) => {
      const status = formatStatus(entry.status);
      const officialSeverity = formatOfficialSeverity(entry.officialSeverity);
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
              <p class="eyebrow">${entry.vendor}</p>
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
