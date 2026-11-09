# Text-Only Ablation Protocol

The text-only ablation uses the same question text and answer-generation prompt as the standard setting, but removes all image inputs from the model payload.

Use `generation_prompt.md` with:

- `{question}` filled by the original question text,
- `{options}` filled by the original options when present,
- no image attachments.

The ablation compares accuracy with and without images and separately measures whether a model explicitly recognizes missing visual evidence. Empty outputs, generation errors, generic refusals, and other non-answer cases are not counted as explicit missing-image acknowledgments.

Accuracy and acknowledgment rates should be interpreted separately. Textual cues remain available and the generation prompt requests an answer, so lack of acknowledgment alone does not establish hallucination.
