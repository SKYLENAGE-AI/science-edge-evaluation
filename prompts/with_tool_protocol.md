# Tool-Augmented Visual-Agent Protocol

The with-tool setting uses the same benchmark inputs as the standard no-tool setting and allows models to gather and verify additional evidence through native tools.

## Configuration

- Input payload: same question text, options, and image inputs as the standard baseline.
- Added tools: Gemini 4 Argon can use web search; the other ten evaluated models can use both web search and a code interpreter.
- Code-interpreter use: programmatic image inspection, measurement, computation, and verification of intermediate interpretations.
- Not provided: local database, curated retrieval corpus, or specialized scientific tools.
- Tool policy: the model may iteratively decide whether to call its available tools; tool use is optional rather than required.
- Accuracy controls: main leaderboard no-tool baselines; evaluation interfaces may differ between runs.
- Scoring: same strict binary judging protocol as the standard setting.

## Expected Answer Object

Tool-enabled runs should return a structured final answer object containing:

```json
{
  "answer_status": "answered | refused | insufficient_information | error",
  "final_answer": "final answer",
  "reasoning": "concise reasoning or analysis",
  "confidence": "low | medium | high"
}
```

Any tool failure, refusal, unanswered output, or output without an identifiable final answer is counted as incorrect.
