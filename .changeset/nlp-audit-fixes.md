---
'@pii-mask/nlp': minor
---

- Detects names, places and organizations inside freeform text (previously whole values only), masking just the entity
- A sentence that mentions a place is no longer replaced wholesale; mask mode masks only entity words
- Custom lexicons are kept per detector set instead of mutating compromise's global state
- New `Organization` entity support and `buildEntityDetector()`; parses are cached
