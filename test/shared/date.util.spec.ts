import { parsePtDateTime } from '../../src/shared/date.util'

describe('parsePtDateTime', () => {
  it('should parse valid date and time', () => {
    const date = parsePtDateTime('16/08/2025 14:30:45')
    expect(date.getFullYear()).toBe(2025)
    expect(date.getMonth()).toBe(7) // August is 7 (0-based)
    expect(date.getDate()).toBe(16)
    expect(date.getHours()).toBe(14)
    expect(date.getMinutes()).toBe(30)
    expect(date.getSeconds()).toBe(45)
  })

  it('should handle single digit day and month', () => {
    const date = parsePtDateTime('5/1/2020 01:02:03')
    expect(date.getFullYear()).toBe(2020)
    expect(date.getMonth()).toBe(0) // January
    expect(date.getDate()).toBe(5)
    expect(date.getHours()).toBe(1)
    expect(date.getMinutes()).toBe(2)
    expect(date.getSeconds()).toBe(3)
  })

  it('should return Invalid Date for invalid input', () => {
    const date = parsePtDateTime('invalid')
    expect(isNaN(date.getTime())).toBe(true)
  })
})
