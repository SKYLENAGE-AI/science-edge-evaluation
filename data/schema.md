# Data Schema

The public benchmark is released in two equivalent formats:

- `questions_public.jsonl`: one JSON object per line, recommended for Hugging Face and streaming.
- `questions_public.json`: pretty-printed JSON array, convenient for inspection.

## Fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | UUID for the question. |
| `index` | integer | 1-based index in the public release. |
| `question` | string | Chinese question text. |
| `options` | list[string] | Chinese answer options. Empty for open-answer questions. |
| `images` | list[string] | Image paths relative to the repository root, under `data/images/`. |
| `answer` | string | Reference answer. |
| `subject_tags` | list[string] | Fine-grained discipline tags in Chinese. |
| `main_disciplines` | list[string] | Normalized main disciplines in Chinese: `化学`, `生物学`, and/or `材料科学`. |
| `knowledge_point_tags` | list[string] | Knowledge-point tags from expert annotation. |

## Notes

- `images` are entry-level references. They include visual evidence used by the question and may also include images used for expert verification.
- `options` is always a list in this release, even when the source annotation used newline-separated strings.
- Multiple-choice answers are represented as option letters, for example `A`, `BD`, or `B, C, D`, depending on the original annotation.
- Open-answer and numerical questions use canonical short answers or numerical answers in the `answer` field.
- Solution rationales, original primary-field labels, and English-translated fields are not included in the public data files.
