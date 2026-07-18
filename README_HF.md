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

Current evaluation snapshot: we evaluate 15 MLLMs, including 4 science-specialized models. The best-performing evaluated model reaches 45.2% accuracy on the full SEE benchmark. Science-specialized models reach 22.2% accuracy on average, below the 31.6% average of general-purpose models, although Intern-S2 Preview-397B reaches 29.0%, narrowing the gap relative to earlier science-specialized models and outperforming several mid-tier general-purpose models.

Model-version note: S1-VL refers to the S1-VL-32B-RL checkpoint. Intern-S2 Preview-397B refers to the InternLM release on Hugging Face: https://huggingface.co/internlm/Intern-S2-Preview-397B

Public data file: `data/questions_public.jsonl`

Model-facing images: `data/images/`

Evaluation prompts: `prompts/`
