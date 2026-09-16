import { useEffect, useRef, useState } from 'react'
import type { ClientRecord } from '../../compiler/types'
import { Button, Callout, Card, Field, SectionHeader, Select, TextArea, TextInput } from '../../ui'
import { db } from '../data'
import type { ClientRow } from '../data'
import { logoPreviewUrl } from '../data/assets'
import { useDispatch, useDraft } from '../state/DraftContext'
import { COUNTRIES, demonymFor } from '../sentence/demonyms'

const REGISTRATION_LABELS = [
  'Commercial Registration No.',
  'Unified National Number',
  'MISA License No.',
]

export function Step1Client() {
  const { spec, ui } = useDraft()
  const dispatch = useDispatch()
  const c = spec.client

  const set = (field: keyof ClientRecord) => (value: string) =>
    dispatch({ type: 'SET_CLIENT_FIELD', field, value })

  return (
    <div className="flex flex-col gap-4">
      <ClientPicker />

      <Card>
        <SectionHeader
          title="Identity"
          slides={[1, 12, 27]}
          description="The legal name signs the letter; the display name is the cover treatment."
        />
        <div className="field-grid p-4">
          <Field label="Legal name" slides={27} tbc={!c.legalName} hint="As it appears on the commercial register.">
            <TextInput value={c.legalName} onChange={(e) => set('legalName')(e.target.value)} />
          </Field>
          <Field label="Display name" slides={1} tbc={!c.displayName} hint="Cover treatment, e.g. HAVENSTONE Consulting W.L.L">
            <TextInput value={c.displayName} onChange={(e) => set('displayName')(e.target.value)} />
          </Field>
          <Field label="Legal form" slides={12} hint="e.g. limited liability company">
            <TextInput value={c.legalForm ?? ''} onChange={(e) => set('legalForm')(e.target.value)} />
          </Field>
          <Field
            label="Country"
            slides={12}
            hint="Enter it as it should read in the sentence, e.g. “the Kingdom of Bahrain”."
          >
            <TextInput
              list="country-names"
              value={c.country ?? ''}
              onChange={(e) => set('country')(e.target.value)}
            />
            <datalist id="country-names">
              {COUNTRIES.map((x) => (
                <option key={x.code} value={x.name} />
              ))}
            </datalist>
          </Field>
          <Field
            label="Country code"
            slides={12}
            hint="ISO 3166-1 alpha-2. Pre-fills the nationality adjective on step 3."
          >
            <Select
              value={c.countryCode ?? ''}
              onChange={(e) => {
                const code = e.target.value
                set('countryCode')(code)
                // Pre-fill, never overwrite something staff already confirmed.
                if (!ui.demonym) dispatch({ type: 'SET_UI', patch: { demonym: demonymFor(code) } })
              }}
            >
              <option value="">— none —</option>
              {COUNTRIES.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.code} — {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Registration label" slides={12}>
            <Select
              value={c.registrationLabel ?? ''}
              onChange={(e) => set('registrationLabel')(e.target.value)}
            >
              <option value="">— none —</option>
              {REGISTRATION_LABELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Registration number" slides={12}>
            <TextInput
              value={c.registrationNumber ?? ''}
              onChange={(e) => set('registrationNumber')(e.target.value)}
            />
          </Field>
          <Field label="Incorporated on" slides={12} hint="Typed as it should read, e.g. 18 March 2023. Never derived.">
            <TextInput value={c.incorporatedOn ?? ''} onChange={(e) => set('incorporatedOn')(e.target.value)} />
          </Field>
          <Field label="Capital" slides={12} hint="Include the currency, e.g. BHD 2,500.">
            <TextInput value={c.capital ?? ''} onChange={(e) => set('capital')(e.target.value)} />
          </Field>
          <Field label="Activity" slides={12} hint="e.g. freight forwarding and logistics consultancy">
            <TextInput value={c.activity ?? ''} onChange={(e) => set('activity')(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Letter block" slides={5} description="The addressee block at the head of the letter." />
        <div className="field-grid p-4">
          <Field label="Address" slides={5} tbc={!c.address} className="md:col-span-2">
            <TextArea rows={2} value={c.address ?? ''} onChange={(e) => set('address')(e.target.value)} />
          </Field>
          <Field label="Contact name" slides={5} tbc={!c.attention} hint="Rendered after “Atte: ”.">
            <TextInput value={c.attention ?? ''} onChange={(e) => set('attention')(e.target.value)} />
          </Field>
          <Field label="Mobile" slides={5} tbc={!c.mobile}>
            <TextInput value={c.mobile ?? ''} onChange={(e) => set('mobile')(e.target.value)} />
          </Field>
          <Field label="Email" slides={5} tbc={!c.email}>
            <TextInput type="email" value={c.email ?? ''} onChange={(e) => set('email')(e.target.value)} />
          </Field>
          <Field label="Website" slides={5} tbc={!c.web}>
            <TextInput value={c.web ?? ''} onChange={(e) => set('web')(e.target.value)} />
          </Field>
        </div>
      </Card>

      <LogoCard />
    </div>
  )
}

function ClientPicker() {
  const { ui } = useDraft()
  const dispatch = useDispatch()
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let live = true
    setLoading(true)
    const t = setTimeout(() => {
      db.listClients(q).then((r) => {
        if (live) {
          setRows(r)
          setLoading(false)
        }
      })
    }, 150)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [q])

  return (
    <Card>
      <SectionHeader
        title="Existing client"
        description="Selecting one replaces every field below. Nothing from a previous proposal is carried across."
        actions={
          ui.clientId ? (
            <Button
              size="sm"
              onClick={() =>
                dispatch({ type: 'LOAD_CLIENT', client: { legalName: '', displayName: '' }, clientId: undefined })
              }
            >
              Clear and enter a new client
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-2 p-4">
        <TextInput
          placeholder="Search by name or registration number…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul className="max-h-40 overflow-y-auto">
          {loading && <li className="px-2 py-1 text-xs text-navy-300">Searching…</li>}
          {!loading && rows.length === 0 && (
            <li className="px-2 py-1 text-xs text-navy-300">No matching client. Fill the fields below to create one.</li>
          )}
          {rows.map((r) => {
            const { id, updatedAt: _u, ...record } = r
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'LOAD_CLIENT', client: record, clientId: id })}
                  className={
                    'flex w-full items-baseline justify-between gap-3 rounded px-2 py-1 text-left hover:bg-cream-200 ' +
                    (ui.clientId === id ? 'bg-cream' : '')
                  }
                >
                  <span className="truncate text-sm text-navy-900">{r.displayName}</span>
                  <span className="shrink-0 font-mono text-xs text-navy-300">{r.registrationNumber ?? '—'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}

function LogoCard() {
  const { spec } = useDraft()
  const dispatch = useDispatch()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [, force] = useState(0)

  const url = logoPreviewUrl(spec.client.logoPath)

  async function onPick(file: File) {
    setError(null)
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setError('Use a PNG or JPEG. Other formats are not embedded reliably by PowerPoint.')
      return
    }
    if (file.size > 2_000_000) setError('Over 2 MB — it will work, but it bloats every deck built from it.')
    const path = await db.uploadLogo(file)
    dispatch({ type: 'SET_LOGO', logoPath: path })
    force((n) => n + 1)
  }

  return (
    <Card>
      <SectionHeader
        title="Logo"
        slides={[1, 12, 14]}
        description="One logo, used on the cover plate, the About-the-Client page and the scope page."
        actions={
          spec.client.logoPath ? (
            <Button size="sm" variant="danger" onClick={() => dispatch({ type: 'SET_LOGO', logoPath: undefined })}>
              Remove
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-3 p-4">
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onPick(f)
            e.target.value = ''
          }}
        />
        <div className="flex items-center gap-3">
          <Button onClick={() => input.current?.click()}>
            {spec.client.logoPath ? 'Replace logo' : 'Upload logo'}
          </Button>
          {!spec.client.logoPath && (
            <span className="text-xs text-check">
              Without a logo the cover keeps the template placeholder.
            </span>
          )}
        </div>
        {error && <Callout tone="check">{error}</Callout>}
        {url && (
          <div className="flex gap-3">
            {/* The cover puts the logo on a white plate; check it both ways so a
                white-knockout logo is not invisible where it actually lands. */}
            <figure className="flex flex-col items-center gap-1">
              <img src={url} alt="Logo on white" className="h-20 w-40 border border-navy-100 bg-white object-contain p-2" />
              <figcaption className="text-xs text-navy-300">on white (the cover plate)</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-1">
              <img src={url} alt="Logo on navy" className="h-20 w-40 border border-navy-100 bg-navy object-contain p-2" />
              <figcaption className="text-xs text-navy-300">on navy</figcaption>
            </figure>
          </div>
        )}
      </div>
    </Card>
  )
}
