---
license: cc-by-nc-4.0
task_categories:
- visual-question-answering
- question-answering
language:
- zh
pretty_name: Science Edge Evaluation
size_categories:
- 1K<n<10K
tags:
- scientific-benchmark
- multimodal
- chemistry
- biology
- materials-science
- laboratory-science
- benchmark
configs:
- config_name: default
  data_files:
  - split: public
    path: data/questions_public.jsonl
---

# Science Edge Evaluation (SEE)

This is the Hugging Face dataset-card template for SEE. Before publishing to Hugging Face, copy this metadata block to the top of the Hugging Face repository `README.md`, then reuse the project introduction from `README.md`.

Public data file: `data/questions_public.jsonl`

Model-facing images: `data/images/`

Evaluation prompts: `prompts/`
