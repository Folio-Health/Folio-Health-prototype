# Handover — clinical modules moved onto real FHIR

Everything below landed **after your last pull** (`e4f5853` — *"Booking patient
lookup by name, phone number, or NIN"*).

**Range:** `e4f5853..6e2efc3` · **16 commits** · **63 files** · **+5,990 / −1,039**
**Branch:** `main`, pushed to `origin`. Typecheck clean at every commit.

---

## Why any of this was needed

A previous commit removed the fabricated records from `src/lib/mock/*` but left
the modules reading those (now empty) arrays. The visible effect was that most
clinical screens rendered **permanently blank tables**, and — less visibly —
their write actions changed React component state that vanished on navigation.

So several buttons across the app looked like they worked and did nothing:

| Action | What actually happened before |
|---|---|
| Front-desk **check-in** | Row turned green locally; nothing reached the server |
| **Discharge** a patient | Local flag; bed never released, patient still admitted for everyone else |
| Approve a **lab result** | Local flag; result never released |
| Approve a **transfer** | Colour change only |
| Mark ICU patient **critical** | Colour change only |
| **Dispense** a prescription | Local flag; drugs never recorded as issued |
| **Sign a surgical consent** | *No signing action existed at all* |
| Complete a **pre-op checklist** | Read-only; a theatre team could not tick anything |

All of the above now write to Medplum.

---

## Modules completed

| Module | Files | FHIR resources |
|---|---|---|
| Vitals | 3 | `Observation` (LOINC-coded) |
| Laboratory | 3 | `ServiceRequest`, `DiagnosticReport`, `Observation` |
| Radiology | 3 | `ServiceRequest`, `DiagnosticReport` |
| Reception | 3 | `Appointment`, `Patient` |
| Admissions | 9 | `Encounter` (IMP), `Location`, `ServiceRequest` |
| Pharmacy | 8 | `MedicationRequest`, `MedicationDispense`, `Medication`, `Organization`, `Basic` |
| Emergency | 7 | `Encounter` (EMER), `Basic` |
| Surgery | 8 | `Procedure`, `Consent` |
| Consultation hub | 2 | `Appointment` (reuses the existing appointments layer) |

**19 new files**, all typechecked:

```
src/lib/fhir/           admissions.ts (446)  laboratory.ts (361)  surgery.ts (338)
                        radiology.ts  (264)  inventory.ts  (237)  loinc.ts   (222)
                        vitals.ts     (217)  emergency.ts  (213)  pharmacy.ts (165)
                        custom.ts     (122)  ambulance.ts   (97)

src/features/*/hooks/   use-admissions · use-emergency · use-laboratory
                        use-inventory · use-prescriptions · use-radiology
                        use-surgery · use-vitals
```

---

## Decisions you should know about

These are the judgement calls that are painful to reverse later. Each is
documented in the file it affects.

### 1. LOINC coding of the whole lab catalogue

`src/lib/fhir/loinc.ts` codes **12 panels and 24 analytes**. Every entry stores
the official LOINC long common name beside the code so a reviewer can check it
without a lookup — if the name doesn't match loinc.org, the code is wrong.

**Two you should have a lab scientist confirm:**

- **"Urea" is coded as urea *nitrogen* (`3094-0`), not urea.** The catalogue's
  7–20 mg/dL range is the BUN interval; serum urea runs ~15–40. If your lab
  genuinely reports urea, this is wrong by a factor of ~2.14.
- **Malaria antigen uses the species-agnostic code (`46094-9`).** A
  P. falciparum-only HRP2 kit — common in Nigeria — should be `76772-3`. The
  generic code isn't wrong, just less specific.

Urine protein and glucose deliberately use the **dipstick "Presence"** codes,
not the quantitative serum ones; a quantitative code would claim a measurement
nobody made.

### 2. Custom resources — your "use custom Medplum resources" decision

Applied as a **split**, not uniformly. Real FHIR wherever the thing genuinely
*is* that thing; `Basic` only where R4 has no resource:

| Thing | Storage | Why |
|---|---|---|
| Supplier | `Organization` + supplier role | A supplier *is* an organization |
| Drug | `Medication` + stock extensions | A drug *is* a medication; batch/expiry use real `Medication.batch` |
| Purchase order | `Basic` `purchase-order` | No R4 resource |
| Ambulance dispatch | `Basic` `ambulance-dispatch` | No R4 resource (R5 adds `Transport`) |
| Refund | `Basic` `refund` | No R4 resource |

`Basic` was chosen over stretching `SupplyRequest`/`Transport`, which mean
specific things — putting a commercial order in one puts wrong data where
another system reads it literally.

**Ambulance dispatch is shaped like R5 `Transport`**, so an upgrade is a rename
rather than a redesign.

Everything inherits Medplum's AccessPolicy enforcement, history and search. A
separate store would have needed its own authorisation, and *"who may see this
facility's stock"* would then have two answers.

### 3. Things FHIR does not model — carried as Folio extensions

| Concept | Extension | Why not a standard field |
|---|---|---|
| Ready for discharge | `ready-for-discharge` | An Encounter is in-progress or finished; there is no "medically done, awaiting transport" |
| ICU acuity | `icu-acuity` | Nearest standard is a scored assessment (APACHE/SOFA), far heavier than a 3-level flag |
| On ventilator | `on-ventilator` | Same |
| Ward capacity | `ward-capacity` | `Location` has no capacity field |
| Bed state (cleaning/reserved) | `bed-state` | `Location.status` says whether a bed *exists*, not whether it's free |
| Theatre number | `theatre-number` | No `Procedure` field |
| Pre-op checklist | `pre-op-checklist` | No R4 resource |
| Blood loss (ml) | `blood-loss-ml` | No `Procedure` field |
| Trauma flag / mechanism | `is-trauma`, `mechanism-of-injury` | No `Encounter` fields |
| Invoice due date | `invoice-due-date` | FHIR `Invoice` has no due date |

**Critically: `ready-for-discharge` is an extension rather than finishing the
encounter early.** Finishing it would free the bed while the patient is still
lying in it.

### 4. Derived, never stored

Storing these alongside the source data would create two answers that drift
apart:

- **Bed occupancy** — from live encounters, not `Location.status`. A bed with a
  patient in it is occupied regardless of what anyone marked it.
- **Theatre "In Use"** — from whether an operation is actually in progress.
- **ICU roster** — from where patients actually are (bed → ward → department).
- **Outstanding bills** — an unpaid invoice past its due date is a *view*.
- **Invoice balance** — from line items and recorded payments. No screen reads
  a stored balance, so the ledger cannot disagree with itself.
- **`itemsSupplied`** per supplier — counted from drugs naming that supplier.

### 5. Attribution: pickers replaced with the signed-in user

Lab orders, imaging orders, admissions, surgery, vitals, prescriptions and
dispensing all previously offered a **dropdown of mock doctors**, letting any
user attribute an action to anyone. FHIR's `requester` / `performer` /
`participant` fields exist to answer *"who actually did this"*.

All now record the signed-in clinician, stated read-only in the form.

### 6. Concurrency

- **Stock adjustments take a delta**, applied read-modify-write. Absolute totals
  would let two concurrent dispenses each write their own figure, losing one.
- **Every status change is read-then-write**, so it can't revert a concurrent
  edit to another field on the same resource.
- **Multi-resource writes are ordered so a mid-way failure is safe:**
  Observations before the DiagnosticReport that references them; the bed move
  before the transfer is marked complete; the radiology report before the order
  is closed.
- **Batch writes are sequential, not parallel** — Medplum rate-limits bursts,
  and a half-written vitals reading reassembles as a row of zeros.

### 7. Honest gaps — deliberately left blank rather than filled

These render as "Unassigned", "—", or are removed entirely. **Nothing invents a
value to fill a shape.**

- **Ward "nurse in charge"** → *Unassigned*. `Location` has no such field;
  proper modelling needs a `PractitionerRole`.
- **Post-operative recovery outcome** → **column removed**. No FHIR home yet; a
  placeholder status would assert a recovery nobody recorded. The column now
  reports what the note *does* hold — whether complications occurred.
- **ICU vitals with no observations** → *"No vitals recorded"*, not zeros.
  Zeros read as a patient with no pulse.
- **`dischargeSummaryReady`** → unknown. Whether the summary *document* exists
  is a `DocumentReference` question, not a boolean.
- **`lastReminderSent`** → `null`. Reminders aren't modelled; a date would claim
  a patient was chased when nobody contacted them.
- **Ambulance ETA left blank** → stored as absent, not defaulted to 15 minutes.
- **Practitioner names** not resolved by a query → shows `Practitioner/<id>`
  rather than a fabricated name.
- **Unrecognised triage level** → falls back to **3** (mid-scale). Defaulting an
  unknown case to "resuscitate now" would cry wolf on the board.
- **Unset ICU acuity** → displays *Stable*. ⚠️ **This one is worth revisiting** —
  it means "nobody has set this yet" but reads as a clinical assertion. Fine on
  a dashboard, wrong if the board is ever used for triage.

### 8. Uncoded on purpose

Free text, not a guessed code:

- **Lab test names** where no confirmed LOINC exists
- **Radiology exam names** — the catalogue is body-parts × modalities with no
  safe RadLex/LOINC lookup
- **Procedure names** — hospital-local theatre language; a wrong SNOMED code is
  a *clinical* error
- **Drug codes** use Folio's catalogue id, not a guessed RxNorm code
- **Insurers** — free text; Nigerian HMOs aren't in a FHIR-published directory,
  and a reference to a nonexistent Organization is a dangling pointer

Modality *is* DICOM-coded (`CR`/`MR`/`CT`/`US`) because that vocabulary is
unambiguous.

---

## Things that changed behaviour, not just plumbing

- **Ordering-doctor dropdowns removed** across lab, radiology, admissions and
  surgery (see §5).
- **`QUEUE_ENTRIES` collapsed into appointments** on the reception dashboard.
  Two fabricated sources side by side could disagree about who is in the
  building.
- **Recent registrations** now come from the server-sorted patient list,
  replacing a sort on a `registeredAt` field FHIR doesn't carry.
- **Check-in offers only transitions the state machine allows** — it asks
  `allowedActions()` rather than re-deriving, so the UI can't offer something
  the server will refuse.
- **A role with no Appointment grant** now sees *"Not available for your role"*
  instead of an empty day. Those are very different statements to a clinician.
- **Receiving a purchase order increases stock.** A status change alone would
  leave the shelves and the system disagreeing.
- **Consent starts `proposed`, not `active`.** A form existing is not consent
  having been given.
- **Transfers are two steps.** Approving changes nothing physical; *completing*
  moves the patient. The move appends a location entry rather than editing, so
  the encounter keeps a truthful history — which is what an infection trace
  reads.

---

## Environment notes

- **Your Medplum project had zero `Location` and zero `Encounter` resources.**
  Admissions therefore includes **ward and bed creation** — without it there is
  nowhere to admit anyone.
- **Doctor and Nurse AccessPolicies were missing** and have been installed from
  your authoritative builders in `Folio-Web/packages/fhir-model` (21 resource
  rules each). The three existing policies were **not** overwritten — that would
  change live access for users already bound to them.
- **A service ClientApplication was created** (`Folio Credential Service`) and
  wired into `.env.local` as `MEDPLUM_SERVICE_CLIENT_ID` / `_SECRET`.

---

## Still to do

**In progress, uncommitted:** billing layer + hooks
(`src/lib/fhir/billing.ts`, `src/features/billing/hooks/use-billing.ts`) are
written; the **12 billing components are not yet wired**.

**Untouched modules:** nursing (10), obstetrics (8), pediatrics (7),
blood-bank (6), portal (10), analytics (9), hr (7), communication (6), and the
**consultation workspace** (SOAP notes, orders, medications, attachments — still
entirely local state).

**Housekeeping:**

- Rotate `operator@folio.local`'s password — it was pasted into a chat
  transcript during this work.
- Delete the `e2e.nurse.*@folio.local` test accounts in Medplum.
- Pre-existing lint error in `src/app/(auth)/login/page.tsx:54`
  (`setRedirectTo` inside an effect) — predates this work; 16 other files trip
  the same rule.

**Note on remaining `lib/mock` imports:** these are now almost all
`import type` — the modules still supply vocabulary (statuses, catalogues,
checklist item lists) with the fabricated records removed. That's intentional;
moving the type definitions is a separate refactor from putting real data behind
them.
