export function isDefined<T>(value?: T): value is NonNullable<T> {
  return value !== undefined && value !== null
}

export function isTruthy<T>(value?: T | null): value is T {
  return Boolean(value)
}

export function isEmptyArray(value: unknown): value is [] {
  return Array.isArray(value) && value.length === 0
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isMap(value: unknown): value is Map<unknown, unknown> {
  return value instanceof Map
}

function isSet(value: unknown): value is Set<unknown> {
  return value instanceof Set
}

function hasCustomValueOf(value: Record<string, unknown>): value is Record<string, unknown> & { valueOf(): unknown } {
  return typeof value.valueOf === 'function' && value.valueOf !== Object.prototype.valueOf
}

function hasCustomToString(value: Record<string, unknown>): value is { toString(): string } {
  return typeof value.toString === 'function' && value.toString !== Object.prototype.toString
}

/**
 * Structural equality check.
 *
 * Adapted from fast-deep-equal (MIT), kept close to upstream so it stays easy to diff against the
 * original while keeping the SDK free of runtime dependencies. The upstream implementation is
 * untyped JS; this port narrows `unknown` with type guards instead.
 *
 * @see https://github.com/epoberezkin/fast-deep-equal/blob/master/src/index.jst
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  if (!isObject(a) || !isObject(b)) {
    // true if both NaN, false otherwise
    return typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)
  }

  if (a.constructor !== b.constructor) {
    return false
  }

  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) {
      return false
    }
    for (let i = a.length; i-- !== 0;) {
      if (!deepEqual(a[i], b[i])) {
        return false
      }
    }
    return true
  }

  if (isMap(a) && isMap(b)) {
    if (a.size !== b.size) {
      return false
    }
    for (const key of a.keys()) {
      if (!b.has(key)) {
        return false
      }
    }
    for (const [key, value] of a) {
      if (!deepEqual(value, b.get(key))) {
        return false
      }
    }
    return true
  }

  if (isSet(a) && isSet(b)) {
    if (a.size !== b.size) {
      return false
    }
    for (const value of a.values()) {
      if (!b.has(value)) {
        return false
      }
    }
    return true
  }

  if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
    // Upstream indexes the typed arrays directly; `ArrayBufferView` is not index-typed and casting to
    // `ArrayLike<number>` is unsound, so compare the raw bytes instead. Constructors already matched
    // above, so equal byte contents imply equal element contents.
    if (a.byteLength !== b.byteLength) {
      return false
    }
    const bytesA = new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
    const bytesB = new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
    for (let i = bytesA.length; i-- !== 0;) {
      if (bytesA[i] !== bytesB[i]) {
        return false
      }
    }
    return true
  }

  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags
  }

  if (hasCustomValueOf(a) && hasCustomValueOf(b)) {
    return a.valueOf() === b.valueOf()
  }
  if (hasCustomToString(a) && hasCustomToString(b)) {
    // The guards above already established that `toString` is overridden (not `Object.prototype`'s),
    // so it will not produce the default `[object Object]`; `no-base-to-string` can't see through the guard.
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return a.toString() === b.toString()
  }

  const keys = Object.keys(a)
  const { length } = keys
  if (length !== Object.keys(b).length) {
    return false
  }

  for (let i = length; i-- !== 0;) {
    if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
      return false
    }
  }

  for (let i = length; i-- !== 0;) {
    const key = keys[i]
    if (!deepEqual(a[key], b[key])) {
      return false
    }
  }

  return true
}
