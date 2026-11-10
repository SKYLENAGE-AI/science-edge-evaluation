document.documentElement.classList.add('js');

const models = [];

const organizations = [
  { prefix: 'HY4', logo: 'hy4', name: 'Tencent' },
  { prefix: 'Gemini', logo: 'google', name: 'Google' },
  { prefix: 'GPT', logo: 'openai', name: 'OpenAI' },
  { prefix: 'Claude', logo: 'anthropic', name: 'Anthropic' },
  { prefix: 'Kimi', logo: 'kimi', name: 'Moonshot AI' },
  { prefix: 'Qwen', logo: 'qwen', name: 'Qwen · Alibaba' },
  { prefix: 'Grok', logo: 'xai', name: 'xAI' },
  { prefix: 'DeepSeek', logo: 'deepseek', name: 'DeepSeek' },
  { prefix: 'Seed', logo: 'seed', name: 'ByteDance Seed' },
  { prefix: 'Intern', logo: 'internlm', name: 'InternLM' },
  { prefix: 'MiniMax', logo: 'minimax', name: 'MiniMax' },
  { prefix: 'MiMo', logo: 'xiaomi', name: 'Xiaomi MiMo' },
  { prefix: 'GLM', logo: 'glm', name: 'Zhipu AI' }
];

function getOrganization(modelName) {
  return organizations.find(organization => modelName.startsWith(organization.prefix)) || { name: modelName.split(' ')[0], logo: null };
}

const organizationLogoUrl = modelName => {
  const organization = getOrganization(modelName);
  return organization.logo ? `./assets/logos/${organization.logo}.${organization.logoExtension || 'png'}` : './favicon.svg';
};

function logoMarkup(model, eager = false) {
  const organization = getOrganization(model.name);
  return `<span class="model-logo" title="${escapeHtml(organization.name)}"><img src="${organizationLogoUrl(model.name)}" width="90" height="90" loading="${eager ? 'eager' : 'lazy'}" alt=""></span>`;
}

const copy = {
  en: {
    standard: {
      kicker: 'STANDARD EVALUATION',
      title: 'Overall accuracy',
      score: 'ACCURACY',
      note: 'Full set: 1,116 questions. * Safety-filtered non-responses are counted as incorrect.'
    },
    tool: {
      kicker: 'TOOL-AUGMENTED VISUAL AGENTS',
      title: 'Accuracy with tools',
      score: 'WITH TOOLS',
      note: 'Gemini 4 Argon uses search; other models use search and code. Gray ticks mark no-tool baselines; interfaces may differ.'
    },
    showing: (shown, total) => `Showing ${shown} of ${total} models`,
    showAll: total => `Show all ${total} models`,
    showLess: 'Show fewer models',
    empty: 'No science-specialized models are included in the tool-augmented comparison.',
    copied: 'BibTeX citation copied to clipboard.',
    copyFailed: 'Copy failed. Please select the citation from the README.',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    language: 'Switch to Chinese'
  },
  zh: {
    standard: {
      kicker: '标准多模态评测',
      title: '总体准确率',
      score: '准确率',
      note: '完整评测集共 1,116 道题。* 安全过滤导致的无响应计为错误。'
    },
    tool: {
      kicker: '工具增强视觉智能体',
      title: '工具增强准确率',
      score: '工具增强',
      note: 'Gemini 4 Argon 使用网页搜索，其余模型使用搜索和代码。灰色刻度为无工具基线；不同运行的接口可能不同。'
    },
    showing: (shown, total) => `显示 ${shown} / ${total} 个模型`,
    showAll: total => `查看全部 ${total} 个模型`,
    showLess: '收起模型列表',
    empty: '工具增强对比中不包含科学专门模型。',
    copied: 'BibTeX 引用已复制到剪贴板。',
    copyFailed: '复制失败，请前往 README 手动选择引用。',
    menuOpen: '打开菜单',
    menuClose: '关闭菜单',
    language: 'Switch to English'
  }
};

const citation = `@article{han2026see,
  title   = {Science Edge Evaluation: SEE the Missing Step Toward Real Scientific Discovery},
  author  = {Han, Taolin and Zhang, Yuchen and Wang, Jinghang and Wu, Yun and Chiu, Wai Yuet and Li, Zhaohai and Zhang, Yifei and Wang, Jinxin and Zhou, Yuhao and Zhao, Chen and Li, Jiajia and Li, Jiaxin and Jin, Qile and Sun, Kewei and Wu, Shuang and Zhai, Weiqi and Lv, Renquan and Li, Junchao and Chen, Ruodan and Chen, Qingteng and Yang, Zhibo and Wei, Hu and Qu, Lin and Bai, Shuai and Zhao, Bing},
  journal = {arXiv preprint arXiv:2608.06931},
  year    = {2026},
  url     = {https://arxiv.org/abs/2608.06931}
}`;

let language = localStorage.getItem('see-language') === 'zh' ? 'zh' : 'en';
let activeView = 'standard';
let activeFilter = 'all';
let showAll = false;

const resultsList = document.querySelector('#results-list');
const resultsCount = document.querySelector('#results-count');
const resultsKicker = document.querySelector('#results-kicker');
const resultsTitle = document.querySelector('#results-title');
const resultsNote = document.querySelector('#results-note');
const scoreLabel = document.querySelector('#score-label');
const showAllButton = document.querySelector('#show-all');
const emptyState = document.querySelector('#empty-state');
const baselineLegend = document.querySelector('#baseline-legend');
const menuToggle = document.querySelector('#menu-toggle');
const navLinks = document.querySelector('#nav-links');
const languageToggle = document.querySelector('#language-toggle');

function formatDelta(value) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(1)} pp`;
}

function getViewModels() {
  return models
    .filter(model => activeView !== 'tool' || typeof model.tool === 'number')
    .filter(model => activeFilter === 'all' || (activeFilter === 'science' ? model.science : !model.science))
    .map(model => ({
      ...model,
      displayValue: activeView === 'standard' ? model.value : model.tool
    }))
    .sort((a, b) => b.displayValue - a.displayValue);
}

function renderTopModels() {
  const topModels = [...models].sort((a, b) => b.value - a.value).slice(0, 6);
  document.querySelector('#top-models').innerHTML = topModels.map((model, index) => {
    const organization = getOrganization(model.name);
    return `
      <div class="top-model-row">
        <span class="top-model-rank">${String(index + 1).padStart(2, '0')}</span>
        <div class="top-model-identity">
          ${logoMarkup(model, true)}
          <div><span class="top-model-name">${model.name}${model.flagged ? '<sup>*</sup>' : ''}</span><span class="top-model-provider">${organization.name}</span></div>
        </div>
        <div class="top-model-track" aria-hidden="true"><span style="width:${model.value}%"></span></div>
        <strong class="top-model-score">${model.value.toFixed(1)}%</strong>
      </div>`;
  }).join('');
}

function renderResults() {
  const viewCopy = copy[language][activeView];
  const filteredModels = getViewModels();
  const visibleModels = showAll ? filteredModels : filteredModels.slice(0, 8);

  resultsKicker.textContent = viewCopy.kicker;
  resultsTitle.textContent = viewCopy.title;
  resultsNote.textContent = viewCopy.note;
  scoreLabel.textContent = viewCopy.score;
  resultsCount.textContent = copy[language].showing(visibleModels.length, filteredModels.length);
  baselineLegend.hidden = activeView === 'standard';
  resultsList.setAttribute('aria-labelledby', `tab-${activeView}`);
  resultsList.hidden = filteredModels.length === 0;
  emptyState.hidden = filteredModels.length !== 0;
  emptyState.textContent = filteredModels.length === 0 ? copy[language].empty : '';

  resultsList.innerHTML = visibleModels.map((model, index) => {
    const delta = activeView === 'tool' ? model.tool - model.value : 0;
    const deltaMarkup = activeView === 'standard'
      ? '<span></span>'
      : `<span class="result-delta ${delta < 0 ? 'negative' : ''}">${formatDelta(delta)}</span>`;
    const marker = activeView === 'standard'
      ? ''
      : `<span class="baseline-marker" style="left:${model.value}%" title="No-tool baseline: ${model.value.toFixed(1)}%"></span>`;

    return `
      <div class="result-row ${model.science ? 'science' : ''}">
        <span class="result-rank">${String(index + 1).padStart(2, '0')}</span>
        <div class="result-model">${logoMarkup(model)}<span class="result-name" title="${model.name}">${model.name}${model.flagged ? '<sup>*</sup>' : ''}</span></div>
        <div class="result-track" aria-hidden="true">
          <span class="result-bar" style="width:${model.displayValue}%; animation-delay:${index * 35}ms"></span>
          ${marker}
        </div>
        <span class="result-score">${model.displayValue.toFixed(1)}%</span>
        ${deltaMarkup}
      </div>`;
  }).join('');

  showAllButton.hidden = filteredModels.length <= 8;
  showAllButton.textContent = showAll ? copy[language].showLess : copy[language].showAll(filteredModels.length);
}

function closeMenu() {
  navLinks.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', copy[language].menuOpen);
  document.body.classList.remove('menu-open');
}

function setLanguage(nextLanguage) {
  language = nextLanguage;
  localStorage.setItem('see-language', language);
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';

  document.querySelectorAll('[data-en]').forEach(element => {
    element.textContent = element.dataset[language];
  });

  languageToggle.textContent = language === 'en' ? '中文' : 'EN';
  languageToggle.setAttribute('aria-label', copy[language].language);
  closeMenu();
  renderResults();
  if (questionExamples.length) {
    renderLibrary();
    renderQuestion();
  }
}

document.querySelectorAll('.view-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    activeView = tab.dataset.view;
    showAll = false;
    document.querySelectorAll('.view-tab').forEach(button => {
      const selected = button === tab;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    renderResults();
  });

  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll('.view-tab')];
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextTab = tabs[(tabs.indexOf(tab) + direction + tabs.length) % tabs.length];
    nextTab.focus();
    nextTab.click();
  });
});

document.querySelectorAll('.filter-button').forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    showAll = false;
    document.querySelectorAll('.filter-button').forEach(filter => filter.classList.toggle('active', filter === button));
    renderResults();
  });
});

showAllButton.addEventListener('click', () => {
  showAll = !showAll;
  renderResults();
});

languageToggle.addEventListener('click', () => {
  setLanguage(language === 'en' ? 'zh' : 'en');
});

menuToggle.addEventListener('click', () => {
  const open = !navLinks.classList.contains('is-open');
  navLinks.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', copy[language][open ? 'menuClose' : 'menuOpen']);
  document.body.classList.toggle('menu-open', open);
});

navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMenu();
});

window.addEventListener('scroll', () => {
  document.querySelector('#site-header').classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

async function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    let timer;
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Clipboard timeout')), 800);
        })
      ]);
      return true;
    } catch {
    } finally {
      clearTimeout(timer);
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
}

document.querySelector('#citation-button').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  const copied = await writeClipboard(citation);
  status.textContent = copy[language][copied ? 'copied' : 'copyFailed'];
});

let questionExamples = [];
let activeQuestionIndex = 0;
let activeResponseIndex = 0;
let activeResponseView = 'trace';
let activeTraceIndex = 1;
let activeImageIndex = 0;
let libraryPage = 0;
let experimentManifest = null;
let experimentMode = 'tool';
const questionRunCache = new Map();
const questionRunRequests = new Map();
const libraryPageSize = 6;
const localized = (en, zh) => language === 'zh' ? zh : en;
const disciplineNames = { '化学': 'Chemistry', '生物学': 'Biology', '材料科学': 'Materials science' };
const normalizeSearch = value => value.toLowerCase().replace(/[–—−]/g, '-');
const responsesFor = example => (example.responses || []).filter(response => response.mode === experimentMode);
const hasRuns = example => Boolean(experimentManifest?.questions[example.id]?.[experimentMode]);

function verdictMarkup(response) {
  const label = response.generation_failed ? localized('Generation failed', '生成失败') : response.judge_result === true ? localized('Judged correct', '判分正确') : response.judge_result === false ? localized('Judged incorrect', '判分错误') : localized('Not judged', '未判分');
  const style = response.judge_result === true ? 'correct' : response.judge_result === false ? 'incorrect' : 'unjudged';
  return `<span class="verdict-badge ${style}">${label}</span>`;
}

function attachRunData(example, payload) {
  example.responses = payload.responses.map(response => ({ ...response, logo: getOrganization(response.model)?.logo || 'openai' }));
  if (payload.question_en && example.originalQuestionEn) example.question_en = payload.question_en;
  if (payload.options_en?.length && example.originalQuestionEn) example.options_en = payload.options_en;
  example.runState = 'loaded';
}

async function loadQuestionRuns(example) {
  if (questionRunCache.has(example.id)) { attachRunData(example, questionRunCache.get(example.id)); return; }
  if (questionRunRequests.has(example.id)) return;
  example.runState = 'loading';
  const request = (async () => {
    try {
      const response = await fetch(`./data/experiments/${experimentManifest.questions[example.id].file}?v=${experimentManifest.version}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const file = experimentManifest.questions[example.id].file;
      const payload = file.endsWith('.gz') ? await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json() : await response.json();
      if (payload.id !== example.id || !Array.isArray(payload.responses)) throw new Error('Invalid question record');
      questionRunCache.set(example.id, payload);
      attachRunData(example, payload);
    } catch { example.runState = 'error'; }
    finally {
      questionRunRequests.delete(example.id);
      if (questionExamples[activeQuestionIndex]?.id === example.id) renderQuestion();
    }
  })();
  questionRunRequests.set(example.id, request);
  await request;
}

function filteredQuestions() {
  const query = normalizeSearch(document.querySelector('#question-search').value.trim());
  const subject = document.querySelector('#question-subject').value;
  const recorded = document.querySelector('#recorded-only').checked;
  return questionExamples.map((example, index) => ({ example, index })).filter(({ example }) =>
    (!recorded || hasRuns(example)) &&
    (subject === 'all' || example.disciplines.includes(subject)) &&
    (!query || normalizeSearch([example.id, example.label, example.title_en, example.title_zh, example.question_zh, example.question_en, ...example.tags, ...example.disciplines.map(name => disciplineNames[name] || name)].join(' ')).includes(query))
  );
}

function renderLibrary() {
  if (experimentManifest) {
    document.querySelectorAll('#experiment-mode option').forEach(option => {
      const count = experimentManifest.runs.filter(run => run.mode === option.value).length;
      const name = option.value === 'tool' ? localized('With tools', '工具增强') : localized('Standard', '标准评测');
      option.textContent = `${name} · ${count} ${localized('models', '个模型')}`;
    });
  }
  const matches = filteredQuestions();
  const pages = Math.max(1, Math.ceil(matches.length / libraryPageSize));
  libraryPage = Math.min(libraryPage, pages - 1);
  document.querySelector('#question-search').placeholder = localized('ID, keyword, technique…', '题号、关键词、实验方法…');
  document.querySelector('#library-count').textContent = localized(`${matches.length.toLocaleString()} / ${questionExamples.length.toLocaleString()} questions · ${experimentManifest?.model_count || 0} models · ${(experimentManifest?.response_count || 0).toLocaleString()} responses`, `${matches.length.toLocaleString()} / ${questionExamples.length.toLocaleString()} 道题 · ${experimentManifest?.model_count || 0} 个模型 · ${(experimentManifest?.response_count || 0).toLocaleString()} 条回答`);
  document.querySelector('#question-switch').innerHTML = matches.slice(libraryPage * libraryPageSize, (libraryPage + 1) * libraryPageSize).map(({ example, index }) => `
    <button class="question-tab ${index === activeQuestionIndex ? 'active' : ''}" type="button" aria-pressed="${index === activeQuestionIndex}" data-question-index="${index}">
      <span>${escapeHtml(example.label)}</span><span class="question-tab-title">${escapeHtml(example[`title_${language}`])}</span><span class="question-tab-preview">${escapeHtml(example[`question_${language}`].trim().slice(0, 100))}</span><small>${hasRuns(example) ? `${experimentManifest.questions[example.id][experimentMode]} ${localized('model runs', '个模型记录')}` : escapeHtml(example[`discipline_${language}`])}</small>
    </button>`).join('') || `<p class="library-no-results">${localized('No matching questions. Try another keyword or discipline.', '没有匹配的题目，请尝试其他关键词或学科。')}</p>`;
  document.querySelector('#questions-page').textContent = localized(`Page ${libraryPage + 1} / ${pages}`, `第 ${libraryPage + 1} / ${pages} 页`);
  document.querySelector('#questions-prev').disabled = libraryPage === 0;
  document.querySelector('#questions-next').disabled = libraryPage >= pages - 1;
  document.querySelector('.question-workspace').hidden = matches.length === 0;
}

function selectQuestion(index) {
  activeQuestionIndex = index;
  activeResponseIndex = 0;
  activeResponseView = experimentMode === 'tool' ? 'trace' : 'answer';
  activeTraceIndex = 1;
  activeImageIndex = 0;
  document.querySelector('.reference-answer').open = false;
  document.querySelector('.model-analysis').open = false;
  document.querySelector('#response-provenance').open = false;
  renderLibrary();
  renderQuestion();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character]);
}

function renderQuestion() {
  const example = questionExamples[activeQuestionIndex];
  if (!example) return;

  document.querySelector('#question-label').textContent = example.label;
  document.querySelector('#question-discipline').textContent = example[`discipline_${language}`];
  document.querySelector('#question-title').textContent = example[`title_${language}`];
  document.querySelector('#question-text').textContent = example[`question_${language}`];
  document.querySelector('#reference-answer').textContent = example[`reference_${language}`];

  const images = example.images || [example.image];
  const image = document.querySelector('#question-image');
  const imageUrl = `./${images[activeImageIndex]}`;
  image.src = imageUrl;
  image.alt = example[`title_${language}`];
  document.querySelector('#question-image-link').href = imageUrl;
  document.querySelector('.question-image-frame').hidden = !images.length;
  document.querySelector('#question-image-tabs').innerHTML = images.length > 1 ? images.map((_, index) => `<button type="button" data-image-index="${index}" aria-pressed="${index === activeImageIndex}" class="${index === activeImageIndex ? 'active' : ''}">${localized('Figure', '图')} ${index + 1}</button>`).join('') : '';

  const options = example[`options_${language}`] || [];
  const optionsList = document.querySelector('#question-options');
  optionsList.hidden = options.length === 0;
  optionsList.innerHTML = options.map(option => `<li>${escapeHtml(option)}</li>`).join('');

  const responses = responsesFor(example);
  const hasResponses = responses.length > 0;
  const coverage = experimentManifest?.questions[example.id];
  document.querySelector('#experiment-coverage').textContent = coverage ? localized(`This question: ${coverage.standard} standard · ${coverage.tool} with tools`, `本题记录：${coverage.standard} 个标准评测 · ${coverage.tool} 个工具增强`) : '';
  document.querySelector('#recorded-response').hidden = !hasResponses;
  document.querySelector('#response-empty').hidden = hasResponses;
  document.querySelector('.response-note').hidden = !hasResponses;
  if (coverage && example.runState !== 'loaded') {
    document.querySelector('#recorded-response').hidden = true;
    document.querySelector('#response-empty').hidden = false;
    document.querySelector('#response-empty').innerHTML = example.runState === 'error' ? `<h3>${localized('Unable to load model runs', '实验记录加载失败')}</h3><button type="button" id="retry-runs">${localized('Retry', '重新加载')}</button>` : `<p>${localized('Loading recorded model runs…', '正在加载真实模型运行记录…')}</p>`;
    if (!example.runState) loadQuestionRuns(example);
    return;
  }
  if (!hasResponses) {
    document.querySelector('#response-empty').innerHTML = `<span class="empty-orbit" aria-hidden="true">◎</span><h3>${localized('Explore the evidence', '先读图，再验证答案')}</h3><p>${localized('This public question includes the original figures, options, and reference answer. No model response or tool trajectory is available in the website records.', '这道公开题目包含原始图片、选项和参考答案。网站当前尚未收录该题的模型回答与工具轨迹。')}</p><button type="button" id="browse-recorded">${localized('Explore recorded runs →', '查看有运行记录的题目 →')}</button><small>${localized('Public questions are shown in their original Chinese; recorded examples include English translations.', '公开题目保留原始中文；精选运行示例另附英文翻译。')}</small>`;
    return;
  }

  document.querySelector('#response-comparison').innerHTML = responses.map((response, index) => `<button class="comparison-card ${index === activeResponseIndex ? 'active' : ''}" type="button" data-response-index="${index}" aria-pressed="${index === activeResponseIndex}"><span><img src="${organizationLogoUrl(response.model)}" alt="" width="20" height="20">${escapeHtml(response.model)}</span><strong>${escapeHtml(response.answer || localized('No final answer recorded', '未记录最终答案'))}</strong>${verdictMarkup(response)}<small>${response.trace.filter(step => step.type === 'search').length} ${localized('search', '次搜索')} · ${response.trace.filter(step => step.type === 'code').length} ${localized('code', '次代码调用')}</small></button>`).join('');

  const responseTabs = document.querySelector('#response-model-tabs');
  responseTabs.innerHTML = responses.map((response, index) => `
    <button class="response-model-tab ${index === activeResponseIndex ? 'active' : ''}" type="button" role="tab" aria-selected="${index === activeResponseIndex}" data-response-index="${index}">
      <img src="${organizationLogoUrl(response.model)}" width="90" height="90" alt=""><span>${escapeHtml(response.model)}</span>
    </button>`).join('');

  renderResponse();
}

function renderResponse() {
  const example = questionExamples[activeQuestionIndex];
  if (!example) return;
  const response = responsesFor(example)[activeResponseIndex];
  if (!response) return;
  document.querySelectorAll('.comparison-card').forEach((card, index) => {
    card.classList.toggle('active', index === activeResponseIndex);
    card.setAttribute('aria-pressed', String(index === activeResponseIndex));
  });

  document.querySelector('#response-model-name').textContent = `${response.model} · ${experimentMode === 'tool' ? localized('With tools', '工具增强') : localized('Standard multimodal', '标准多模态')}`;
  document.querySelector('#response-final-answer').textContent = response.answer || localized('No final answer recorded', '未记录最终答案');
  document.querySelector('#response-analysis').textContent = response.analysis || localized('No analysis included in the source record.', '原记录未包含分析文本。');
  document.querySelector('#response-verdict').innerHTML = verdictMarkup(response);
  const run = experimentManifest.runs.find(run => run.id === response.source_id);
  document.querySelector('#response-provenance-content').innerHTML = `<p>${escapeHtml(run?.id)} · ${escapeHtml(run?.source)}</p>${run?.note ? `<p>${escapeHtml(run.note)}</p>` : ''}<p>${localized('Source SHA256', '来源 SHA256')}<br><code>${escapeHtml(run?.sha256)}</code></p><p>${localized('Judge model', '判题模型')}：${escapeHtml(response.judge_model || localized('Not specified in record', '原记录未注明'))}<br>${localized('Reference used in this run', '本次运行使用的参考答案')}：${escapeHtml(response.reference_answer)}</p><p>${escapeHtml(response.judge_reason || localized('No judge explanation recorded.', '未记录判分理由。'))}</p>${!response.input_matches_public || !response.reference_matches_public ? `<div class="input-version-note"><strong>${localized('Input version differs from the public question', '该次运行输入版本与公开题目有差异')}</strong><p>${escapeHtml(response.input_question || example.question_zh)}</p><p>${escapeHtml((response.input_options || []).join('\n'))}</p></div>` : ''}`;

  document.querySelectorAll('.response-model-tab').forEach((tab, index) => {
    const selected = index === activeResponseIndex;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
  });

  document.querySelectorAll('.response-view-tab').forEach(tab => {
    const selected = tab.dataset.responseView === activeResponseView;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
  });

  document.querySelector('#response-answer-view').hidden = activeResponseView !== 'answer';
  document.querySelector('#response-trace-view').hidden = activeResponseView !== 'trace';
  renderTrace();
}

function renderTrace() {
  const example = questionExamples[activeQuestionIndex];
  const response = responsesFor(example)[activeResponseIndex];
  if (!response) return;
  const trace = response.trace;
  activeTraceIndex = Math.max(0, Math.min(activeTraceIndex, trace.length + 1));
  const searchCount = trace.filter(step => step.type === 'search').length;
  document.querySelector('.trace-help').textContent = trace.length ? localized('Select a step to inspect its recorded input and result. Arrows indicate call order.', '点击节点查看该步的真实输入与结果；箭头表示调用顺序。') : localized(experimentMode === 'standard' ? 'Standard evaluation uses no tools. Only the question and recorded answer are shown.' : 'No tool calls were recorded for this run. Tool availability does not imply tool use.', experimentMode === 'standard' ? '标准评测不使用工具，仅展示题目输入与原始答案。' : '该次运行未记录工具调用；工具可用不代表实际使用。');
  document.querySelector('#trace-count').textContent = localized(`${trace.length} CALLS RECORDED`, `记录了 ${trace.length} 次调用`);
  document.querySelector('#trace-metrics').innerHTML = [[searchCount, localized('Web searches', '网页搜索')], [trace.length - searchCount, localized('Code calls', '代码调用')], [trace.length, localized('Total calls', '总调用数')]].map(([count, label]) => `<div><strong>${count}</strong><span>${label}</span></div>`).join('');
  const nodes = [{ type: 'input', label: localized('Question', '题目输入'), detail: example.label }, ...trace.map((step, index) => ({ type: step.type, label: step.type === 'search' ? localized('Search', '网页搜索') : localized('Code', '代码执行'), detail: `${localized('Call', '调用')} ${index + 1}` })), { type: 'answer', label: localized('Answer', '最终答案'), detail: localized('Recorded', '原始记录') }];
  document.querySelector('#trace-flow').innerHTML = nodes.map((node, index) => `<button type="button" class="trace-node ${node.type} ${index === activeTraceIndex ? 'active' : ''}" data-trace-index="${index}" aria-pressed="${index === activeTraceIndex}"><span class="node-symbol" aria-hidden="true">${node.type === 'search' ? '⌕' : node.type === 'code' ? '&lt;/&gt;' : node.type === 'input' ? '▧' : '✓'}</span><strong>${node.label}</strong><small>${escapeHtml(node.detail)}</small></button>${index < nodes.length - 1 ? '<span class="trace-arrow" aria-hidden="true">→</span>' : ''}`).join('');
  document.querySelector('#trace-prev').disabled = activeTraceIndex === 0;
  document.querySelector('#trace-next').disabled = activeTraceIndex === nodes.length - 1;
  document.querySelector('#trace-position').textContent = `${activeTraceIndex + 1} / ${nodes.length}`;
  let content;
  if (activeTraceIndex === 0) {
    content = `<div class="trace-detail-label">${localized('INPUT · ORIGINAL QUESTION', '输入 · 原始题目')}</div><p>${escapeHtml(response.input_question || example[`question_${language}`])}</p><a href="#question-image">${localized('Inspect question figure ↑', '查看题目图片 ↑')}</a>`;
  } else if (activeTraceIndex === nodes.length - 1) {
    content = `<div class="trace-detail-label">${localized('OUTPUT · RECORDED ANSWER', '输出 · 模型原始答案')}</div><p class="trace-answer">${escapeHtml(response.answer || localized('No final answer recorded', '未记录最终答案'))}</p>${verdictMarkup(response)}<div class="trace-reference"><span>${localized('Reference used in this run', '本次运行的参考答案')}</span><strong>${escapeHtml(response.reference_answer)}</strong></div><small>${localized('Correctness labels come from the original experiment judge.', '正确性标签来自原始实验判题结果。')}</small>`;
  } else {
    const step = trace[activeTraceIndex - 1];
    const search = step.type === 'search';
    let source = '';
    source = (step.links || (step.url ? [{ url: step.url }] : [])).map(link => {
      try {
        const url = new URL(link.url);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        return `<a class="trace-source-card" href="${escapeHtml(url.href)}" target="_blank" rel="noreferrer"><span>${escapeHtml(link.title || localized('Recorded source', '记录中的来源'))}</span><strong>${escapeHtml(url.hostname)} ↗</strong></a>`;
      } catch { return ''; }
    }).join('');
    content = `<div class="trace-detail-label">${localized('CALL', '调用')} ${String(activeTraceIndex).padStart(2, '0')} · ${search ? localized('WEB SEARCH', '网页搜索') : localized('CODE INTERPRETER', '代码解释器')}</div><h4>${search ? localized('Query / page action', '搜索查询 / 页面操作') : localized('Execution', '执行内容')}</h4><p class="trace-query">${escapeHtml(step.detail)}</p>${source}${search ? `<p class="trace-result-note">${typeof step.sources === 'number' ? localized(`${step.sources} source entries reported for this call.`, `本次调用记录了 ${step.sources} 个来源条目。`) : ''} ${localized('The record contains the query and source link; full page content is not included.', '记录包含查询与来源链接，不包含完整网页正文。')}</p>` : `<div class="trace-output"><span>${localized('RECORDED OUTPUT', '原始执行输出')}</span><pre>${escapeHtml(step.output || localized('No output recorded.', '未记录输出。'))}</pre></div><details class="trace-code"><summary>${localized('Inspect executed code', '查看执行代码')}</summary><pre><code>${escapeHtml(step.code || '')}</code></pre></details>`}`;
  }
  const step = trace[activeTraceIndex - 1];
  if (step?.image_outputs) content += `<p class="trace-result-note">${localized(`${step.image_outputs} image output(s) in the source record; image binaries are omitted in this website export.`, `原记录含 ${step.image_outputs} 个图片输出，网页导出未包含图片二进制。`)}</p>`;
  if (step?.output_truncated) content += `<p class="trace-result-note">${localized('Text output is truncated to 20,000 characters in the website export.', '网页导出将文本输出截断至 20,000 个字符。')}</p>`;
  document.querySelector('#response-trace').innerHTML = `<li class="trace-inspector">${content}</li>`;
}

async function loadQuestionExamples() {
  try {
    const files = ['./data/questions_public.json', './data/site_examples.json', './data/experiments/manifest.json'];
    const [bank, featured, manifest] = await Promise.all(files.map(async file => {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }));
    experimentManifest = manifest;
    const previousModels = [...models];
    models.splice(0, models.length, ...manifest.runs.filter(run => run.mode === 'standard').map(run => {
      const previous = previousModels.find(model => model.name === run.model || model.name.replace('1017', '(1017)') === run.model);
      const tool = manifest.runs.find(candidate => candidate.model === run.model && candidate.mode === 'tool');
      return { ...previous, name: run.model, value: run.full_correct / run.full_count * 100, flagged: run.model.startsWith('Claude'), science: run.model.startsWith('Intern'), ...(tool ? { tool: tool.full_correct / tool.full_count * 100 } : {}) };
    }));
    renderTopModels();
    renderResults();
    questionExamples = bank.map(question => {
      const example = featured.find(example => example.id === question.id);
      const title = question.knowledge_point_tags.join(' · ') || question.subject_tags.join(' · ') || `SEE–${String(question.index).padStart(3, '0')}`;
      return { id: question.id, label: `SEE–${String(question.index).padStart(3, '0')}`, title_en: example?.title_en || title, title_zh: example?.title_zh || title, discipline_en: question.main_disciplines.map(name => disciplineNames[name] || name).join(' · '), discipline_zh: question.main_disciplines.join(' · '), disciplines: question.main_disciplines, tags: [...question.subject_tags, ...question.knowledge_point_tags], question_en: example?.question_en || question.question, question_zh: question.question, originalQuestionEn: !example, options_en: example?.options_en || question.options, options_zh: question.options, reference_en: question.answer, reference_zh: question.answer, images: question.images, responses: [], featured: Boolean(example) };
    }).sort((a, b) => Number(b.featured) - Number(a.featured));
    renderLibrary();
    renderQuestion();
  } catch {
    document.querySelector('#question-title').textContent = language === 'zh' ? '题目示例加载失败' : 'Unable to load question examples';
    document.querySelector('#question-text').textContent = language === 'zh' ? '请通过本地网页服务访问此页面。' : 'Please open this page through the local web server.';
    document.querySelector('#library-count').textContent = localized('Question data unavailable. Reload to retry.', '题库数据暂时不可用，请刷新重试。');
  }
}

document.querySelector('#question-switch').addEventListener('click', event => {
  const tab = event.target.closest('[data-question-index]');
  if (tab) selectQuestion(Number(tab.dataset.questionIndex));
});

function selectResponse(event) {
  const tab = event.target.closest('[data-response-index]');
  if (!tab) return;
  activeResponseIndex = Number(tab.dataset.responseIndex);
  activeTraceIndex = 1;
  renderResponse();
}
document.querySelector('#response-model-tabs').addEventListener('click', selectResponse);
document.querySelector('#response-comparison').addEventListener('click', selectResponse);
document.querySelector('#trace-flow').addEventListener('click', event => {
  const node = event.target.closest('[data-trace-index]');
  if (!node) return;
  activeTraceIndex = Number(node.dataset.traceIndex);
  renderTrace();
  document.querySelector(`[data-trace-index="${activeTraceIndex}"]`).focus({ preventScroll: true });
});
function moveTrace(direction) {
  activeTraceIndex += direction;
  renderTrace();
  document.querySelector(`[data-trace-index="${activeTraceIndex}"]`).scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
document.querySelector('#trace-prev').addEventListener('click', () => moveTrace(-1));
document.querySelector('#trace-next').addEventListener('click', () => moveTrace(1));
document.querySelector('#question-image-tabs').addEventListener('click', event => {
  const button = event.target.closest('[data-image-index]');
  if (button) { activeImageIndex = Number(button.dataset.imageIndex); renderQuestion(); }
});
function updateLibrary() {
  libraryPage = 0;
  const matches = filteredQuestions();
  if (matches.length) selectQuestion(matches[0].index);
  else renderLibrary();
}
document.querySelector('#question-search').addEventListener('input', updateLibrary);
document.querySelector('#question-subject').addEventListener('change', updateLibrary);
document.querySelector('#recorded-only').addEventListener('change', updateLibrary);
function moveLibrary(direction) {
  libraryPage += direction;
  const first = filteredQuestions()[libraryPage * libraryPageSize];
  if (first) selectQuestion(first.index);
}
document.querySelector('#questions-prev').addEventListener('click', () => moveLibrary(-1));
document.querySelector('#questions-next').addEventListener('click', () => moveLibrary(1));
document.querySelector('#response-empty').addEventListener('click', event => {
  if (event.target.closest('#retry-runs')) {
    const example = questionExamples[activeQuestionIndex];
    example.runState = undefined;
    renderQuestion();
    return;
  }
  if (!event.target.closest('#browse-recorded')) return;
  document.querySelector('#question-search').value = '';
  document.querySelector('#question-subject').value = 'all';
  document.querySelector('#recorded-only').checked = true;
  updateLibrary();
});

document.querySelector('#experiment-mode').addEventListener('change', event => {
  experimentMode = event.target.value;
  activeResponseIndex = 0;
  activeTraceIndex = 1;
  activeResponseView = experimentMode === 'tool' ? 'trace' : 'answer';
  document.querySelector('#response-provenance').open = false;
  document.querySelector('.model-analysis:not(#response-provenance)').open = false;
  renderLibrary();
  renderQuestion();
});

document.querySelectorAll('.response-view-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    activeResponseView = tab.dataset.responseView;
    renderResponse();
  });
});

renderTopModels();
setLanguage(language);
loadQuestionExamples();
