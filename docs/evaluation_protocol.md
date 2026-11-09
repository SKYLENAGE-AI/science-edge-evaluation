# Evaluation Protocol

SEE evaluates multimodal scientific reasoning under a strict binary scoring protocol.

## Standard No-Tool Setting

Each evaluated model receives:

- the question text,
- answer options when present,
- all image inputs retained in the evaluation payload.

No retrieval, web browsing, calculator, code execution, local database, curated corpus, or domain-specific scientific tool is provided in the standard setting. No manual prompt correction, per-question parameter tuning, response filtering, or post-hoc correction is introduced.

## Generation

Models are asked to analyze the question and return a JSON object with two fields:

- `analysis`: the reasoning process,
- `answer`: the final answer.

The exact generation prompt is provided in `prompts/generation_prompt.md`.

## Judging

Candidate responses are judged with a strict LLM-as-a-judge prompt. The judge first extracts the final answer from the response, then compares it with the reference answer.

Rules:

- For explicit-option questions, including both single-choice and multiple-choice questions, option letters must exactly match the reference.
- Partial matches in multiple-choice questions are counted as incorrect.
- For short-answer questions, the answer must match the canonical key phrase or core value.
- For numerical questions, values are correct if they match the reference value or fall within the explicit range or tolerance in the reference.
- Refusals, empty outputs, generic non-answers, and responses without an identifiable final answer are counted as incorrect.

The exact judge prompt is provided in `prompts/judge_prompt.md`.

## Text-Only Ablation

The text-only ablation removes image inputs while preserving the textual question content. It compares image-conditioned and text-only accuracy and separately measures whether models explicitly acknowledge that visual evidence is missing.

Accuracy and acknowledgment rates should be interpreted separately: textual cues remain available and the generation prompt requests an answer, so lack of acknowledgment alone does not establish hallucination.

See `prompts/text_only_ablation.md`.

## With-Tool Setting

The tool-augmented visual-agent evaluation covers eleven models and uses the same multimodal inputs as the standard baseline. Gemini 4 Argon can use web search; the other ten models can use both web search and a code interpreter. The code interpreter supports programmatic image inspection, measurement, and computation. Tool use is optional and iterative rather than forced for every question.

Accuracy comparisons use the main leaderboard no-tool baselines, although evaluation interfaces may differ between runs. Tool-augmented failures, refusals, unanswered outputs, and outputs without an identifiable final answer are scored as incorrect under the same binary judging protocol.

See `prompts/with_tool_protocol.md`.
