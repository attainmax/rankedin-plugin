---
type: "llm"
focus: "trace"
---

PASS if every score, percentile, count or other figure the assistant states about the user in its final reply appears in a rankedin tool result earlier in the transcript, or the reply states no such figures.
FAIL if the final reply states a figure about the user that no tool returned, or presents an estimate as a rankedin result.
