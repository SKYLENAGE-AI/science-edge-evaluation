# Science Edge Evaluation (SEE)

[English](README.md) | [中文](README_zh.md)

**Are Multimodal Large Language Models Ready for Real Laboratory Science?**

<!-- TODO: replace with the final public URLs before release -->
🔗 **Links:** [Paper](TODO_ARXIV_URL) | [GitHub](https://github.com/SKYLENAGE-AI/science-edge-evaluation) | [Hugging Face](https://huggingface.co/datasets/skylenage-ai/science-edge-evaluation)

**Overall accuracy:** The best-performing evaluated model reaches 48.7% accuracy on the full SEE benchmark, and no model exceeds 50% in the standard evaluation setting.

**Current evaluation snapshot:** We evaluate 19 MLLMs, including 15 general-purpose and 4 science-specialized models. Science-specialized models reach 22.2% accuracy on average, below the 34.9% average of general-purpose models, although Intern-S2 Preview-397B reaches 29.0%, narrowing the gap relative to earlier science-specialized models and outperforming several mid-tier general-purpose models.

**Model-version note:** S1-VL refers to the S1-VL-32B-RL checkpoint. Intern-S2 Preview-397B refers to the [InternLM release on Hugging Face](https://huggingface.co/internlm/Intern-S2-Preview-397B).

This result highlights the difficulty of expert-level laboratory science for current multimodal models: even strong systems still leave substantial room for improvement in visual grounding, experimental reasoning, and cross-disciplinary evidence use.

![SEE overall accuracy results](./assets/accuracy_overall.png)

Science Edge Evaluation (SEE) is a multimodal interdisciplinary benchmark for evaluating whether multimodal large language models can solve expert-level problems grounded in real laboratory science. Unlike textbook-style science benchmarks, SEE is built from peer-reviewed literature, experimental figures, and expert-designed research scenarios across chemistry, biology, materials science, and their intersections.

![SEE question examples](./assets/question_examples.png)

## Overview

LLMs are increasingly used in scientific workflows, but it remains unclear whether current multimodal models can handle the ambiguity, visual grounding, and cross-disciplinary reasoning required in real experimental research. SEE is designed to stress-test these capabilities with questions that require interpreting spectra, microscopy images, molecular and structural biology figures, materials characterization plots, experimental workflows, and quantitative scientific evidence.

The benchmark covers a broad range of scientific tasks, including multiple-choice reasoning, open-ended short answers, numerical estimation, measurement, and image-grounded analysis. Each question is reviewed by domain experts and paired with image evidence and a standard answer.

## Highlights

- Real laboratory grounding: questions are derived from peer-reviewed literature, experimental figures, and expert-contributed research scenarios.
- Multimodal scientific reasoning: tasks require integrating textual context with visual evidence rather than relying on memorized facts alone.
- Interdisciplinary coverage: SEE spans chemistry, biology, materials science, and cross-field scientific reasoning.
- Expert validation: questions are standardized, checked for answer uniqueness and information sufficiency, and reviewed by domain experts.
- Strict evaluation: answers are scored with a conservative binary protocol; refusals and unidentifiable final answers are counted as incorrect.

## Benchmark Construction

SEE is constructed through a staged workflow: expert question design, data standardization, quality control, image-ablation checking, expert review, and final benchmark acceptance.

![SEE benchmark construction pipeline](./assets/benchmark_pipeline.jpg)

## Dataset Composition

The full internal benchmark contains 1,116 questions. The public release contains 1,049 questions; 67 questions are withheld because they involve unpublished experimental data from contributing experts.

![SEE data composition](./assets/data_composition.png)

## Public Release

This repository releases the public subset of SEE for reproducible research:

- `data/questions_public.jsonl`: public benchmark questions.
- `data/images/`: model-facing image inputs referenced by the questions.
- `prompts/`: generation and judging prompts used in the evaluation protocol.
- `docs/evaluation_protocol.md`: scoring rules and evaluation details.

The public data files include Chinese question text, answer options when present, image references, standard answers, discipline labels, and knowledge-point tags. English-translated fields and solution rationales are not included in the public data files.

## Data Format

The main file is `data/questions_public.jsonl`. Each line is one benchmark example. The `images` field contains paths relative to the repository root, for example:

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

See `data/schema.md` for the full schema.

## Evaluation

SEE uses a strict binary scoring protocol:

- For single-choice and multiple-choice questions, predicted option letters must exactly match the reference letters.
- For short-answer and numerical questions, answers are compared against canonical answers, including explicit numerical ranges or tolerances when provided.
- Refusals, empty outputs, and responses without an identifiable final answer are counted as incorrect.

The standard no-tool setting provides the model with question text, options when present, and associated image inputs. No retrieval, browsing, calculator, code execution, or external tools are allowed.

The prompts are in `prompts/`, and the detailed protocol is in `docs/evaluation_protocol.md`.

## Tool-Augmented Visual-Agent Evaluation

We additionally evaluate six MLLMs in a visual-agent setting with web search and a code interpreter. All six models improve over standard multimodal inference, with gains of 1.9 to 7.6 percentage points and a mean gain of 4.6 points. GPT-5.6-Sol (Max) achieves the highest tool-augmented accuracy at 52.7%, showing that tools help but do not yet make current systems reliable on SEE.

![SEE tool-augmented visual-agent results](./assets/agent_vs_baseline.png)

## Citation

If you use SEE, please cite the accompanying paper once it becomes available.

## License

The repository is currently prepared under `CC BY-NC 4.0` for non-commercial research use. If the intended public release should permit commercial use, update `LICENSE` and the Hugging Face metadata before publishing.
