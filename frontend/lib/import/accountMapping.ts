// Account mapping registry (memory or optionally persisted)
export type BrokerMapping = { broker: string; external: string; account_id: string }
let mapping: BrokerMapping[] = []

export function getAccountMapping(broker: string, external: string): string | undefined {
  return mapping.find(m => m.broker === broker && m.external === external)?.account_id
}
export function setAccountMapping(broker: string, external: string, account_id: string) {
  if (!getAccountMapping(broker, external)) {
    mapping.push({ broker, external, account_id })
  }
}
export function clearMappings() { mapping = [] }
