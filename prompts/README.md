# Prompts

This directory contains the prompts and protocol notes needed to reproduce SEE-style evaluation.

- `generation_prompt.md`: default prompt for model answer generation.
- `judge_prompt.md`: strict binary judging prompt.
- `text_only_ablation.md`: text-only no-image ablation protocol.
- `with_tool_protocol.md`: web-search-only with-tool evaluation protocol.

In the standard evaluation setting, images are supplied as multimodal inputs alongside the user message. The prompt text itself does not inline image bytes or image paths.
