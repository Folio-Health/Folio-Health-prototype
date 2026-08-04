import { faker } from "@faker-js/faker"

/**
 * All mock generators call this before generating their dataset so the
 * "database" is stable for the lifetime of the server process instead of
 * reshuffling on every request. Each generator module should pick its own
 * offset so unrelated datasets don't end up correlated.
 */
export function seedFaker(offset: number) {
  faker.seed(84000 + offset)
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(faker.number.float({ min: 0, max: 0.999 }) * items.length)]
}

export function pickWeighted<T>(items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let roll = faker.number.float({ min: 0, max: total })
  for (const item of items) {
    if (roll < item.weight) return item.value
    roll -= item.weight
  }
  return items[items.length - 1].value
}

export function id(prefix: string, n: number, width = 4) {
  return `${prefix}-${String(n).padStart(width, "0")}`
}
