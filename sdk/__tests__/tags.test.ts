import { validateTags } from '../src/tags'

describe('validateTags', () => {
  it.each([Infinity, -Infinity, NaN])('rejects invalid numeric values', (value) => {
    expect(() => {
      validateTags(value)
    }).toThrow(new TypeError('tags must be a finite number'))
  })

  it.each([Infinity, -Infinity, NaN])('rejects nested invalid numeric values', (value) => {
    expect(() => {
      validateTags({
        value: {
          numeric: value,
        },
      })
    }).toThrow(new TypeError("tags['value']['numeric'] must be a finite number"))
  })

  it('rejects a list that contains itself', () => {
    const cyclic: unknown[] = ['a']
    cyclic.push(cyclic)

    expect(() => {
      validateTags({ items: cyclic })
    }).toThrow(new TypeError("tags['items'][1] contains a circular reference"))
  })

  it('rejects a map that contains itself', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic

    expect(() => {
      validateTags(cyclic)
    }).toThrow(new TypeError("tags['self'] contains a circular reference"))
  })

  it('rejects a cycle that closes further down', () => {
    const outer: Record<string, unknown> = {}
    outer.items = [{ back: outer }]

    expect(() => {
      validateTags(outer)
    }).toThrow(new TypeError("tags['items'][0]['back'] contains a circular reference"))
  })

  it('accepts the same object referenced twice when it is not a cycle', () => {
    const shared = { nested: true }

    expect(() => {
      validateTags({ left: shared, right: shared })
    }).not.toThrow()

    expect(() => {
      validateTags({
        items: [shared, shared],
      })
    }).not.toThrow()
  })
})
