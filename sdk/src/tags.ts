/**
 * Rejects NaN / Infinity and circular references in `tags`.
 *
 * `TagsPrimitive` is `number`, so `{ score: Number('oops') }` type-checks.
 * JSON has no literal for those values. Each platform rewrites them
 * differently (`null` on web, `0` on iOS via `NSNumber.intValue`, usually
 * `null` on Android) and identification still succeeds. Throw instead of
 * storing the wrong tag.
 *
 * A circular reference makes this walk recurse forever. Reject it with a
 * clean error instead of letting it blow the call stack.
 *
 * `Date`, `Map`, and class instances are already a type error on `TagsValue`.
 * This walk does not reject them. The RN bridge and JS agent do not agree on
 * those values (a `Date` is an ISO string on web and `{}` on native), but we
 * choose to ignore that.
 *
 * Size is a server `payload_too_large`.
 * https://docs.fingerprint.com/docs/tagging-information
 */

export function validateTags(tags?: unknown): void {
  if (tags === null || tags === undefined) {
    return
  }
  walk(tags, 'tags', [])
}

function walk(value: unknown, path: string, ancestors: unknown[]): void {
  if (value === null || value === undefined) {
    return
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${path} must be a finite number`)
    }
    return
  }

  if (typeof value !== 'object') {
    return
  }

  if (ancestors.includes(value)) {
    throw new TypeError(`${path} contains a circular reference`)
  }
  ancestors.push(value)

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      walk(entry, `${path}[${String(index)}]`, ancestors)
    }
  } else {
    for (const [key, entry] of Object.entries(value)) {
      walk(entry, `${path}['${key}']`, ancestors)
    }
  }

  ancestors.pop()
}
