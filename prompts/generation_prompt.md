# Default Generation Prompt

```text
[System]
You are an intelligent assistant. Please read the question and images
carefully, and provide the correct answer.

[User]
Please answer the following question. If it is a choice question, it may
be either single-choice or multiple-choice.

[Question text]:
{question}

[Options]:
{options}

Please first provide the analysis process, and then provide the final
answer. Strictly output the following JSON format, and do not include
Markdown formatting:
{
  "analysis": "your analysis process",
  "answer": "final answer"
}
```
