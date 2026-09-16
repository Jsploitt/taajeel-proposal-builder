/**
 * One XML implementation, both environments.
 *
 * The browser has DOMParser/XMLSerializer natively and Node does not, but the
 * bigger reason to use @xmldom/xmldom everywhere is that namespace-prefix
 * serialization differs between implementations. A deck that round-trips
 * cleanly under Node's shim but re-prefixes `a:`/`p:` elements in a browser is
 * a corrupt deck that only fails in production. Same library, same output.
 */
import { DOMParser as XParser, XMLSerializer as XSerializer } from '@xmldom/xmldom'

export const parser = new XParser({
  onError: (level, msg) => {
    if (level === 'error' || level === 'fatalError') throw new Error(`XML ${level}: ${msg}`)
  },
})

export const serializer = new XSerializer()

export function parseXml(s: string): Document {
  return parser.parseFromString(s, 'text/xml') as unknown as Document
}

export function serializeXml(d: Document | Element): string {
  return serializer.serializeToString(d as never)
}
