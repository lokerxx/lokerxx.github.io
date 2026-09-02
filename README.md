# lokerxx.github.io

一个可直接部署到 GitHub Pages 的安全研究主页，按 Apache CVE 与 CNVD 分类展示公开漏洞记录，已经带好 `GitHub Actions` 自动部署。

## 本地结构

- `index.html`：首页，按 Apache CVE 与 CNVD 分类展示已公开可核对的漏洞总表
- `cve_detail.html`：公开漏洞详情页
- `cve-data.js`：研究数据源
- `styles.css`：视觉样式
- `script.js`：页面渲染与交互

## 怎么发布

这个仓库名已经是 `lokerxx.github.io`，属于用户主页仓库。

建议在 GitHub 仓库设置里把 Pages 的 Source 设成 `GitHub Actions`。
之后只要你把代码 push 到 `main`，工作流就会自动部署页面到：

`https://lokerxx.github.io`
