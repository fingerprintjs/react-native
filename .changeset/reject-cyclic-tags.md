---
'@fingerprint/react-native': patch
---

Fixed `tags` validation to reject circular references with a clear `TypeError` instead of throwing an unhandled `RangeError: Maximum call stack size exceeded`.
