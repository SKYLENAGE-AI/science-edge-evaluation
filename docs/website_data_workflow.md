# 网页数据与 GitHub 同步

网站是静态 HTML/CSS/JavaScript，源码与公开数据同在 `SKYLENAGE-AI/science-edge-evaluation` 仓库。浏览器读取当前部署版本中的相对路径数据，不直接读取本机实验目录，也不实时查询 GitHub API。

## 数据链路

```text
本机原始 data_judged*.json
        ↓ 按 experiment_sources.json 的来源和 SHA256 校验
scripts/export_site_experiments.py
        ↓ 只导出 questions_public.json 中的公开 UUID
data/experiments/manifest.json + <UUID>.json.gz
        ↓ 与 HTML/JS 一起 commit / push
GitHub Actions 校验 → GitHub Pages 发布
        ↓
浏览器先读 manifest，再按题目解压加载回答与工具轨迹
```

排行榜与逐题回答共用同一份 manifest：排行榜从各运行的 `full_correct/full_count` 计算完整评测集准确率，逐题页面只加载公开题目的原始回答。当前有 29 个标准评测模型、11 个工具增强模型、1,049 道公开题目、41,960 条回答。未导出无图消融。

HY4 最新标准评测为 476/1,116（42.65%），公开部分为 443/1,049（42.23%）；来自 2026-11-10 完整性审计，来源文件 SHA256 为 `0534e09e733d3ea653e18ba40092168d21209b7ecc2fedfa09c679e7adc7123e`。未将工具能力探针作为全量工具增强结果导入。原记录没有逐回答实际模型元数据，保留该来源限制。

`site_examples.json` 目前只提供两道精选题的标题与英文题干；其中旧示例回答不再用于运行展示。其他题目有可用实验英文输入时也会加载，原始中文题干始终保留。

原始文件不上传网站。网页导出保留回答、分析文本、原判分与判分理由、判题模型、参考答案、文本工具轨迹及来源链接。来源文件 SHA256 可追溯；调用文本输出最多 20,000 字符并标注截断，图片二进制输出不包含在网页包中。原始错误与拒答不进行重试或重新判分。

## 增加模型

1. 在实验工程完成相同 1,116 题的评测和判题，保留原文件。本导出流程只读取既有结果，不会发起模型请求。
2. 在 `data/experiment_sources.json` 的 `runs` 追加一条配置：

```json
{
  "model": "New Model",
  "mode": "standard",
  "root": "current",
  "file": "data/results/new_batch/new-model/data_judged.json",
  "sha256": "原始文件的完整 SHA256",
  "expected_correct": 123
}
```

`mode` 只允许 `standard` 或 `tool`；同一模型可以分别添加两条。`root=current` 是已冻结的实验工程镜像根目录，`root=historical` 是历史 results 根目录，`root=live` 是本机最新实验工程根目录（用于 HY4 等镜像创建后完成的实验）。默认路径见导出脚本，也可用 `--current-root`、`--historical-root`、`--live-root` 显式指定。所有来源均由 SHA256 锁定；`live` 只表示目录来源，网页仍读取导出快照。`expected_correct` 是可选的全量正确题数校验，不能填估计数。

可用 `shasum -a 256 /完整路径/data_judged.json` 计算文件哈希。修改原始来源后必须核对原因并更新哈希。导出会校验 UUID 唯一性、全量题数及公开题覆盖，缺题或来源改变会停止。

3. 导出并检查：

```sh
cd /Users/hantaolin/Documents/SEE/science-edge-evaluation
python3 scripts/export_site_experiments.py
python3 scripts/verify_site_data.py
node --check script.js
python3 -m http.server 8080
```

然后访问 `http://localhost:8080/#questions`。运行模式中的模型数和排行榜成绩自动更新；新提供商可在 `script.js` 的 `organizations` 添加图标映射，未配置时使用网站通用图标。页面介绍中的模型数量等编辑文案需要随范围变化调整。若题目输入或参考答案版本与公开版本不同，网页会在运行详情中注明，并保留该次运行的原判分及参考答案。

## 同步到 GitHub 和网页

先审阅本次修改，再提交网页代码、数据和脚本。首次接入此页面时还要提交新增的图标、样式等资产。示例：

```sh
git status --short
git add index.html script.js styles.css blue-theme.css favicon.svg assets data scripts docs .github .gitignore
git diff --cached --stat
git commit -m "Update website experiment records"
git push origin main
```

本次已经准备 `.github/workflows/pages.yml`：PR 执行校验，推送 `main` 或手动运行工作流后校验并发布 Pages。**首次使用需要仓库管理员在 Settings → Pages → Build and deployment 中选择 GitHub Actions**。本地创建工作流并不表示线上已经启用或发布成功；以 Actions 的部署结果和 Pages 返回的实际网址为准。

题图已经由 Git LFS 管理。工作流使用 `checkout` 的 `lfs: true` 拉取真实图片，并验证图片不是 LFS 指针，再打包静态站点。不要只把 Git LFS 指针发布到网页。实验回答采用普通 Git 中的逐题 gzip 文件；浏览器使用 `DecompressionStream` 解压，需要支持该 API 的现代浏览器。

本机实验目录不会上传 GitHub，因此 GitHub Actions 只校验已经导出的公开数据，不在云端重新跑实验或导出。以后每次更新都应同时提交新版 manifest 和对应题目分片。分片请求带 manifest 版本号，避免新旧数据缓存混用。一次部署包含同一提交的页面与数据。

GitHub Pages 配置参考：[配置发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[自定义 Actions 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
