# Web-Search-Only With-Tool Protocol

The with-tool setting uses the same benchmark inputs as the standard no-tool setting and adds web search as the only external tool.

## Configuration

- Input payload: same question text, options, and image inputs as the standard baseline.
- Added tool: web search only.
- Not provided: code interpreter, calculator, local database, curated retrieval corpus, or specialized scientific tools.
- Tool policy: the model may decide whether to call web search; search is optional rather than required.
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
