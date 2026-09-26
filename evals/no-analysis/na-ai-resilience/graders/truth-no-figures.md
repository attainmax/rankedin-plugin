---
type: "regex"
target: "last_message"
match: "not_contains"
flags: "i"
pattern: "\\b\\d{1,3}\\s*/\\s*100\\b|\\b\\d{1,3}(st|nd|rd|th)\\s*(%ile|percentile)|resilience score (of|is) \\d"
---
