# Handover: clinical modules on real FHIR

Everything here landed after the last pull (`e4f5853`, "Booking patient lookup by
name, phone number, or NIN").

Range `e4f5853..8039353`, 17 commits, 63 files, +5,990/-1,039. On `main`, pushed.

## Background

An earlier commit stripped the fabricated records out of `src/lib/mock/*` but
left every module still importing those arrays. They were empty by then, so most
clinical screens rendered blank tables.

The less obvious problem was the write side. Buttons that looked like they worked
were setting React state that disappeared on navigation:

- Front-desk check-in turned the row green locally, nothing hit the server
- Discharge set a local flag, so the bed was never released and the patient
  stayed admitted as far as everyone else was concerned
- Approving a lab result never released it
- Approving a transfer was a colour change
- Marking an ICU patient critical was a colour change
- Dispensing a prescription never recorded the drugs as issued
- Signing a surgical consent wasn't possible, no signing action existed
- The pre-op checklist was read-only, so a theatre team couldn't tick anything

All of those write to Medplum now.

## What's done

| Module | Files | Resources |
|---|---|---|
| Vitals | 3 | Observation (LOINC-coded) |
| Laboratory | 3 | ServiceRequest, DiagnosticReport, Observation |
| Radiology | 3 | ServiceRequest, DiagnosticReport |
| Reception | 3 | Appointment, Patient |
| Admissions | 9 | Encounter (IMP), Location, ServiceRequest |
| Pharmacy | 8 | MedicationRequest, MedicationDispense, Medication, Organization, Basic |
| Emergency | 7 | Encounter (EMER), Basic |
| Surgery | 8 | Procedure, Consent |
| Consultation hub | 2 | Appointment, reusing the existing appointments layer |

Twenty new files. Mapping layers in `src/lib/fhir/`: `admissions.ts` (446 lines),
`billing.ts`, `laboratory.ts` (361), `surgery.ts` (338), `radiology.ts` (264),
`inventory.ts` (237), `loinc.ts` (222), `vitals.ts` (217), `emergency.ts` (213),
`pharmacy.ts` (165), `custom.ts` (122), `ambulance.ts` (97). Query hooks under
`src/features/*/hooks/` for admissions, billing, emergency, laboratory,
inventory, prescriptions, radiology, surgery and vitals.

## Decisions worth a second opinion

These are the ones that are annoying to undo later. Each is commented in the file
it affects, so this is a summary rather than the full reasoning.

### LOINC

`src/lib/fhir/loinc.ts` codes the whole lab catalogue, 12 panels and 24 analytes.
Every entry carries the official LOINC long common name next to the code, which
is how you check a code without looking it up. If the name doesn't match
loinc.org for that code, the code is wrong.

Two need a lab scientist:

"Urea" is coded as urea *nitrogen* (`3094-0`), not urea. The catalogue's 7-20
mg/dL range is the BUN interval; serum urea runs roughly 15-40. If the lab really
does report urea, this is out by a factor of about 2.14, which is the kind of
error that reaches a patient.

Malaria antigen uses the species-agnostic code (`46094-9`). A P. falciparum-only
HRP2 kit, which is what a lot of Nigerian labs stock, should be `76772-3`. The
generic code isn't wrong, just less specific, so it's safe either way.

Urine protein and glucose use the dipstick "Presence" codes rather than the
quantitative serum ones. Their results are Negative/Trace/1+, and a quantitative
code would claim a measurement nobody made.

### Custom resources

Applied as a split rather than uniformly. Real FHIR where the thing genuinely is
that thing, `Basic` only where R4 has nothing:

- Supplier is an `Organization` with a supplier role. A supplier is an
  organization.
- Drug is a `Medication` with stock extensions. Batch and expiry use the real
  `Medication.batch` fields rather than inventing extensions for things that
  already exist.
- Purchase order, ambulance dispatch and refund are `Basic` with Folio codes.

`Basic` was chosen over stretching `SupplyRequest` or `Transport`. Those mean
specific things, and putting a commercial order in one puts wrong data somewhere
another system reads literally. Ambulance dispatch is deliberately shaped like
R5's `Transport`, so an upgrade later is a rename rather than a redesign.

The upside of keeping this in Medplum instead of a side table is that it inherits
AccessPolicy enforcement, history and search. A separate store needs its own
authorisation, and then "who can see this facility's stock" has two answers.

### Extensions for things FHIR doesn't model

`ready-for-discharge`, `icu-acuity`, `on-ventilator`, `ward-capacity`,
`bed-state`, `theatre-number`, `pre-op-checklist`, `blood-loss-ml`, `is-trauma`,
`mechanism-of-injury`, `invoice-due-date`.

The important one is `ready-for-discharge`. FHIR has no way to say "medically
done, waiting on paperwork or transport", which is exactly what a discharge queue
tracks; an Encounter is either in-progress or finished. Faking it by finishing
the encounter early would free the bed while the patient is still in it, so it's
an extension instead.

ICU acuity is an extension because the nearest standard equivalent is a scored
assessment like APACHE or SOFA, which is a much heavier thing than a three-level
flag on a board.

### Derived rather than stored

Storing these next to their source would give two answers that drift:

- Bed occupancy comes from live encounters, not `Location.status`. A bed with a
  patient in it is occupied no matter what anyone marked it as.
- Theatre "In Use" comes from whether an operation is actually in progress.
- The ICU roster comes from where patients actually are: bed, ward, department.
- Outstanding bills are a view over unpaid invoices past their due date.
- Invoice balance comes from line items and recorded payments. Nothing reads a
  stored balance, so the ledger can't contradict itself.
- `itemsSupplied` per supplier is counted from the drugs naming that supplier.

### Attribution

Lab orders, imaging orders, admissions, surgery, vitals, prescriptions and
dispensing all used to offer a dropdown of mock doctors, which let any user
attribute an action to anyone. FHIR's `requester`, `performer` and `participant`
exist to answer "who actually did this". They all record the signed-in clinician
now, shown read-only in the form.

### Concurrency

Stock adjustments take a delta and are applied read-modify-write. Sending
absolute totals would let two concurrent dispenses each write their own figure
and silently lose one.

Status changes are read-then-write throughout, so they can't revert a concurrent
edit to a different field on the same resource.

Multi-resource writes are ordered so a failure in the middle is safe.
Observations go in before the DiagnosticReport that references them, the bed move
happens before the transfer is marked complete, and the radiology report is
written before the order closes.

Batch writes are sequential rather than parallel. Medplum rate-limits bursts, and
a half-written vitals reading reassembles as a row of zeros.

## Gaps left visible on purpose

Nothing invents a value to fill a shape. These show as "Unassigned", a dash, or
are removed:

- Ward "nurse in charge" reads Unassigned. `Location` has no such field, and
  doing it properly needs a `PractitionerRole`.
- The post-op recovery outcome column is gone. There's no FHIR home for recovery
  notes yet, and a placeholder status would assert a recovery nobody recorded.
  The column now shows what the note does hold, whether complications occurred.
- ICU vitals with no observations read "No vitals recorded" rather than zeros.
  Zeros render as a patient with no pulse.
- `dischargeSummaryReady` is unknown. Whether the summary document exists is a
  `DocumentReference` question, not a boolean.
- `lastReminderSent` is null because reminders aren't modelled. A date there
  would claim someone chased a patient when nobody did.
- A blank ambulance ETA stores as absent rather than defaulting to 15 minutes.
- Practitioner names a query doesn't resolve show `Practitioner/<id>` instead of
  a made-up name.
- An unrecognised triage level falls back to 3, mid-scale. Defaulting an unknown
  case to "resuscitate now" would cry wolf on the board.

One to revisit: unset ICU acuity currently displays as Stable. It means "nobody
has set this yet" but reads as a clinical assertion. Fine on a dashboard, wrong
if that board is ever used for triage.

## Deliberately uncoded

Free text rather than a guessed code, because a wrong code is silently wrong
forever and propagates into everything downstream:

- Lab test names with no confirmed LOINC
- Radiology exam names. The catalogue is body parts crossed with modalities and
  there's no safe lookup from that pair to RadLex or LOINC.
- Procedure names. Hospital-local theatre language, and a wrong SNOMED code here
  is a clinical error rather than a data-quality one.
- Drug codes use Folio's own catalogue id, not a guessed RxNorm code.
- Insurers. Nigerian HMOs aren't in a FHIR-published directory, and a reference
  to an Organization nobody created is a dangling pointer.

Modality is DICOM-coded (CR/MR/CT/US) because that vocabulary is unambiguous.

## Behaviour changes, not just plumbing

- Ordering-doctor dropdowns removed across lab, radiology, admissions and
  surgery.
- `QUEUE_ENTRIES` folded into appointments on the reception dashboard. Two
  fabricated sources side by side could disagree about who's in the building.
- Recent registrations come from the server-sorted patient list, replacing a sort
  on a `registeredAt` field FHIR doesn't have.
- Check-in only offers transitions the state machine allows. It asks
  `allowedActions()` instead of re-deriving, so the UI can't offer something the
  server will refuse.
- A role with no Appointment grant now sees "Not available for your role" instead
  of an empty day. Those are very different things to tell a clinician.
- Receiving a purchase order increases stock. A status change on its own leaves
  the shelves and the system disagreeing.
- Consent starts `proposed`, not `active`. A form existing isn't consent having
  been given, and signing is a separate action.
- Transfers are two steps. Approving changes nothing physical, completing moves
  the patient. The move appends a location entry rather than editing one, so the
  encounter keeps a real history of where the patient has been, which is what an
  infection trace reads.

## Environment

The Medplum project had zero `Location` and zero `Encounter` resources, so
admissions includes ward and bed creation. Without it there's nowhere to admit
anyone.

The Doctor and Nurse AccessPolicies were missing. They've been installed from the
builders in `Folio-Web/packages/fhir-model`, 21 resource rules each. The three
policies that already existed were left alone, since overwriting them would
change live access for users already bound to them.

A service ClientApplication ("Folio Credential Service") was created and wired
into `.env.local` as `MEDPLUM_SERVICE_CLIENT_ID` and
`MEDPLUM_SERVICE_CLIENT_SECRET`.

## Outstanding

Billing has its layer and hooks committed and typechecking, but the 12 components
aren't wired yet. Worth knowing that layer hit three type errors and one real bug
during development, the last of them found by re-reading the code while writing
this doc: the due-date reader and writer used different extension URLs, so no
invoice would ever have shown as overdue. It's had less scrutiny than the other
modules.

Untouched: nursing (10 files), obstetrics (8), pediatrics (7), blood-bank (6),
portal (10), analytics (9), hr (7), communication (6), and the consultation
workspace, which is still entirely local state.

Housekeeping:

- Rotate `operator@folio.local`. Its password was pasted into a chat transcript
  during this work.
- Delete the `e2e.nurse.*@folio.local` test accounts in Medplum, left over from
  verifying the forced password change.
- There's a pre-existing lint error at `src/app/(auth)/login/page.tsx:54`,
  `setRedirectTo` inside an effect. It predates this work and 16 other files trip
  the same rule.

On the remaining `lib/mock` imports: they're nearly all `import type` now. Those
modules still supply vocabulary, statuses, catalogues, checklist items, with the
fabricated records removed. Moving the type definitions out is a separate
refactor from putting real data behind them, and doing both at once would have
made these diffs unreviewable.
