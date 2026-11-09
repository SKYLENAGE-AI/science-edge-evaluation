# Science Edge Evaluation (SEE)

[English](README.md) | [中文](README_zh.md)

**Science Edge Evaluation：“看见”大模型探索科学领域的能力边界**

🔗 **链接：** [论文 (arXiv:2608.06931)](https://arxiv.org/abs/2608.06931) | [GitHub](https://github.com/SKYLENAGE-AI/science-edge-evaluation)

**总体准确率：** Gemini 4 Argon 在完整 SEE 基准上取得最佳结果，准确率为 54.9%；在标准评测设置下，没有模型超过 55%。

**当前评测概览：** 我们共评测 28 个 MLLM，其中包括 24 个通用模型和 4 个科学专门模型。科学专门模型平均准确率为 25.0%，低于通用模型平均值 37.3%；其中 Intern-S2 Preview-397B 达到 29.0%，相比更早的科学专门模型缩小了差距，并超过若干中等表现的通用模型。

**模型版本说明：** Intern-S2 Preview-397B 指 InternLM 发布的版本。

这一结果表明，专家级实验室科学问题对当前多模态模型仍然具有明显挑战；即使是表现较强的模型，在图像证据理解、实验逻辑推理和跨学科证据整合方面仍有较大提升空间。

![28 个 MLLM 的 SEE 总体准确率结果](./assets/accuracy_overall.png)

## 图像证据与跨学科推理

移除图像输入后，所有受评模型的准确率均有所下降，28 个模型平均下降 14.5 个百分点。31,248 条纯文本响应中，仅 2,888 条（9.2%）明确指出缺少视觉证据并拒绝给出具体答案，表明当前模型对证据边界的意识仍然有限。

![28 个 MLLM 的 SEE 图像证据消融结果](./assets/visual_evidence_ablation.png)

跨学科题目的平均准确率为 32.0%，低于单一主学科题目的 38.6%，相差 6.6 个百分点。

## 工具增强视觉智能体评测

我们进一步评测了 11 个 MLLM 的工具增强视觉智能体表现。Gemini 4 Argon 可使用网页搜索，其余 10 个模型可同时使用网页搜索和代码解释器。11 个模型的工具增强准确率均高于对应的无工具基线。Gemini 4 Argon 以 56.1% 取得最高工具增强准确率；Qwen3.8 Flash 的提升最大，从 36.6% 增至 45.5%。这些结果表明，工具能够带来帮助，但仍不足以使当前系统在 SEE 上达到可靠水平。

轨迹级归因表明，工具使用具有双向效应：在 11 个模型中，708 次由错改对和 250 次由对转错可实质归因于工具使用。工具相关错误主要涉及证据整合、动作选择、观察解释和执行控制等失败模式。这表明工具增强将静态多模态推理转化为沿工具使用轨迹的证据管理问题。

![SEE 工具增强视觉智能体结果与轨迹归因](./assets/tool_augmented_evaluation.png)

Science Edge Evaluation (SEE) 是一个面向真实实验室科学场景的多模态交叉学科基准，用于评估多模态大语言模型是否能够解决专家级科学问题。不同于以教材题或合成题为主的科学评测，SEE 的题目来自同行评议文献、实验图像和专家设计的真实科研场景，覆盖化学、生物学、材料科学及其交叉领域。

![SEE 题目示例](./assets/question_examples.png)

## 概览

大语言模型正在越来越多地进入科学工作流，但现有多模态模型是否具备真实实验研究所需的图像理解、证据整合、跨学科推理和不确定性判断能力，仍然缺乏系统评估。SEE 旨在用真实科研问题检验这些能力，题目涉及谱图、显微图像、分子与结构生物学图像、材料表征曲线、实验流程和定量科学证据等多种形式。

SEE 包含选择题、开放短答题、数值估计、测量题和图像证据推理题。每道题均经过标准化处理、专家审核，并配有图像证据和标准答案。

## 主要特点

- 真实实验室来源：题目来自同行评议文献、实验图像和专家贡献的科研场景。
- 多模态科学推理：题目要求模型结合文本和图像证据，而不仅是复述已有知识。
- 交叉学科覆盖：覆盖化学、生物学、材料科学及跨领域科学推理。
- 专家质量控制：题目经过标准化、答案唯一性检查、信息充分性检查和领域专家审核。
- 严格评测协议：采用保守的二元评分，拒答、空输出和无法识别最终答案的回答均计为错误。

## 基准构建流程

SEE 通过分阶段流程构建，包括专家命题、数据标准化、质量控制、图像必要性检查、专家复核和最终收录。

![SEE benchmark 构建流程](./assets/benchmark_pipeline.jpg)

## 数据组成

完整内部基准包含 1,116 道题。当前公开版本包含 1,049 道题；其余 67 道题因涉及贡献专家的未发表实验数据而暂不公开。

![SEE 数据组成](./assets/data_composition.png)

## 公开版本

本仓库发布 SEE 的公开子集，用于复现和后续研究：

- `data/questions_public.jsonl`：公开题目数据。
- `data/images/`：题目引用的模型输入图片。
- `prompts/`：评测使用的生成 prompt 和 judge prompt。
- `docs/evaluation_protocol.md`：评分规则和评测细节。

公开数据文件包含中文题干、选项、图片路径、标准答案、学科标签和知识点标签。公开数据文件不包含英文翻译字段和解析过程。

## 数据格式

主数据文件是 `data/questions_public.jsonl`，每一行是一道题。`images` 字段中的路径相对于仓库根目录。

```json
{
  "id": "02ca31df-ad06-46dc-8609-26c631b867f4",
  "index": 1,
  "question": "...",
  "options": ["A. ...", "B. ..."],
  "images": ["data/images/275cb15e-8f18-4d6b-96f1-d6e66896444f.png"],
  "answer": "D",
  "subject_tags": ["金属材料", "物理化学"],
  "main_disciplines": ["化学", "材料科学"],
  "knowledge_point_tags": ["CCT曲线"]
}
```

完整字段说明见 `data/schema.md`。

## 评测协议

SEE 采用严格的二元评分协议：

- 对于单选和多选题，预测选项字母必须与标准答案完全一致。
- 对于短答题和数值题，答案需要与标准答案、数值范围或显式容差一致。
- 拒答、空输出以及无法识别最终答案的回答均计为错误。

标准 no-tool 设置只向模型提供题干、选项和图片输入，不允许检索、浏览网页、计算器、代码执行或外部工具。

提示词位于 `prompts/`，详细评测协议位于 `docs/evaluation_protocol.md`。

## 引用

如果使用 SEE，请引用配套论文：

```bibtex
@article{han2026see,
  title   = {Science Edge Evaluation: SEE the Missing Step Toward Real Scientific Discovery},
  author  = {Han, Taolin and Zhang, Yuchen and Wang, Jinghang and Wu, Yun and Chiu, Wai Yuet and Li, Zhaohai and Zhang, Yifei and Wang, Jinxin and Zhou, Yuhao and Zhao, Chen and Li, Jiajia and Li, Jiaxin and Jin, Qile and Sun, Kewei and Wu, Shuang and Zhai, Weiqi and Lv, Renquan and Li, Junchao and Chen, Ruodan and Chen, Qingteng and Yang, Zhibo and Wei, Hu and Qu, Lin and Bai, Shuai and Zhao, Bing},
  journal = {arXiv preprint arXiv:2608.06931},
  year    = {2026},
  url     = {https://arxiv.org/abs/2608.06931}
}
```

## 许可证

当前仓库按 `CC BY-NC 4.0` 准备，用于非商业研究用途。如果希望允许商业使用，发布前需要同步修改 `LICENSE`。
