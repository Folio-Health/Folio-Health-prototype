# Front-Office Workflow Design in Production EMR/EHR Systems

Research synthesis covering Epic (Cadence/Prelude/Welcome), Oracle Health/Cerner Millennium, athenahealth (athenaOne), MEDITECH Expanse, OpenMRS/Bahmni, and Medplum, mapped against HL7 FHIR R4/R5.

---

## 1. Appointment Scheduling

### Actors
- **Scheduler / access-center agent** — searches availability, books, cancels, reschedules; in Epic, central scheduling teams work across departments with Snapboard/Day View dashboards.
- **Template builder / department scheduling admin** — a distinct, privileged role that owns provider templates and blocks (Epic sites run formal template change-management SOPs, e.g. VUMC's).
- **Front-desk receptionist** — books follow-ups at check-out, marks arrivals/no-shows.
- **Patient** — self-schedules via portal (Epic MyChart; 35–50% of volume can shift to self-scheduling when templates permit it).
- **Provider/resource** — owns the schedule being booked against; in FHIR terms, the `Schedule.actor`.

### State machine / lifecycle
**FHIR canonical statuses** (`Appointment.status`, R4+): `proposed → pending → booked → checked-in / arrived → fulfilled`, with exits to `cancelled`, `noshow`, `entered-in-error`, plus `waitlist` ([HL7 R4 Appointment](https://hl7.org/fhir/R4/appointment.html)). The spec's booking dance: discover the `Schedule`, optionally query `Slot`s, create the Appointment as `proposed` with all participants at `needs-action`; each participant answers via `AppointmentResponse` (accepted/declined/tentative); once responses are in, the appointment consolidates to `booked`. Production systems in practice skip the proposed/pending negotiation — the scheduler creates the appointment directly as `booked` because the front office is the authority for all participants.

**What vendors actually use:**
- **Oracle Cerner Millennium** exposes exactly the FHIR set (`proposed, pending, booked, arrived, fulfilled, cancelled, noshow, entered-in-error, checked-in, waitlist`) in its [Millennium FHIR Appointment API](https://docs.oracle.com/en/industries/health/millennium-platform-apis/mfrap/op-appointment-get.html). Natively, the Scheduling Appointment Book supports right-click actions **Hold, Confirm, Check In, Check Out, Cancel, Reschedule**; check-out is blocked unless the appointment is in Checked-In status, and Reschedule moves the appointment into a "Work In Progress" tray to be re-placed rather than deleting it. Appointments requiring prior authorization sit in a **Pending Confirmation** state until a clerk confirms with the associated authorization.
- **athenahealth** uses a much flatter, billing-driven lifecycle: `f` (future) → `o` (open, i.e. today/bookable) → `2` (checked in) → `3` (checked out) → `4` (charge entered), plus `x` (cancelled). Notably there is **no automatic no-show state**: a past appointment that was never checked in stays `f`, and "it is up to a practice to cancel appointments as a no show" explicitly ([athenahealth Appointments docs](https://docs.athenahealth.com/api/docs/appointments)). This is a useful design lesson: no-show is a *decision*, not a timeout.
- **OpenMRS/Bahmni appointments module**: `Scheduled → CheckedIn → Completed`, with `Missed` and `Cancelled` reachable from both Scheduled and CheckedIn. Transition rules are enforced: Scheduled → {CheckedIn, Missed, Cancelled}; CheckedIn → {Completed, Missed, Cancelled}. Check-in is undoable back to Scheduled; Completed is terminal ([Bahmni Manage Appointments](https://bahmni.atlassian.net/wiki/spaces/BAH/pages/138313802/Manage+Appointments)).

### Business rules & edge cases
- **Slot/template model**: Epic Cadence builds provider **templates** (recurring weekly availability per provider/location), overlaid with **blocks** — a block on a slot restricts which **visit types** can match it (e.g. a "new patient" block at 8am only accepts new-patient visit types). Visit types carry duration, instructions, and map to billing (Resolute); bad visit-type mapping is a documented cause of claim denials. **Decision trees** interview the scheduler (or patient in MyChart) to select correct visit type/provider automatically.
- **Overbooking**: deliberate and permission-gated, not a free-for-all — Epic gates double-booking behind role-based security and per-template rules. FHIR models this with `Slot.overbooked` (boolean) — the slot stays visible but flagged.
- **Rescheduling**: modeled as **cancel + rebook with linkage**, not in-place mutation. Cerner's Work-In-Progress tray makes this explicit; FHIR recommends cancelling and creating a new Appointment (R5 adds `Appointment.replaces` / cancellation with `cancellationReason`). Keep the cancelled record — it feeds no-show/cancellation analytics.
- **Wait list**: FHIR pattern is two appointments — one `booked` in the available slot, one `waitlist` spanning the preferred window; if a better slot opens, the waitlisted one becomes booked and the original is cancelled. Epic automates this ("automated backfill" of cancelled slots; documented 18% slot-fill improvement).
- **Recurring visits**: in FHIR **R4 each occurrence is its own Appointment resource**; R5 adds `recurrenceTemplate`, `originatingAppointment`, and `occurrenceChanged` to model series natively. Production systems (Cerner "recur," MEDITECH "series booking") book a series as N discrete appointments so each can be individually cancelled/rescheduled — model recurrence as a generator, not a single record.
- **Reminders/confirmation**: multi-channel (SMS/email/IVR) with a separate **confirmation status** orthogonal to appointment status; confirmations reduce no-shows (Epic client: −17% to −22%). High no-show-risk patients get prompted to confirm or reschedule ahead of time.
- **Concurrency**: Medplum's `$book` operation is the cleanest reference design — it atomically creates the Appointment, marks the `Slot.status=busy`, and creates buffer slots in one FHIR transaction under **serializable isolation** to prevent double-booking races; `$find` returns *proposed* Appointment candidates from Schedules ([Medplum $book](https://www.medplum.com/docs/scheduling/appointment-book)).

### FHIR mapping
- `Schedule` — container of availability for an actor (Practitioner/PractitionerRole/Location/HealthcareService) over a `planningHorizon`; ≙ Epic template.
- `Slot` — bookable unit; `status: free | busy | busy-unavailable | busy-tentative | entered-in-error`; `appointmentType`/`serviceType` ≙ Epic block restricting visit types; `overbooked` flag.
- `Appointment` — the booking; `appointmentType` ≙ visit type; `participant.status` + `AppointmentResponse` for multi-party negotiation; `cancelationReason` (R4).
- Appointment is **administrative only**; the Encounter carries clinical meaning and is created at service start, not at booking.

### Sources
[HL7 FHIR R4 Appointment](https://hl7.org/fhir/R4/appointment.html) · [Oracle Millennium FHIR Appointment API](https://docs.oracle.com/en/industries/health/millennium-platform-apis/mfrap/op-appointment-get.html) · [athenahealth Appointments](https://docs.athenahealth.com/api/docs/appointments) · [Epic Cadence guide (Mindbowser)](https://www.mindbowser.com/epic-cadence-a-guide-for-healthcare-scheduling/) · [VUMC template management SOP](https://www.vumc.org/patient-access-services/sites/default/files/public_files/PAS002-%20Template%20Management_SOP.pdf) · [Bahmni Manage Appointments](https://bahmni.atlassian.net/wiki/spaces/BAH/pages/138313802/Manage+Appointments) · [Medplum scheduling](https://www.medplum.com/docs/scheduling/appointment-book)

---

## 2. Patient Registration & Identity

### Actors
- **Registrar / receptionist** — creates records, captures demographics/insurance/guarantor; may **flag** suspected duplicates but does not merge.
- **HIM (Health Information Management)** — owns the MPI: adjudicates duplicates, performs merges, corrects identity data errors, notifies downstream systems. This division of labor (registration creates, HIM corrects) is the industry norm.
- **EMPI/identity analysts** — work potential-duplicate queues produced by the matching engine (Epic's Identity module).

### State machine / lifecycle
1. **Search-before-create** (mandatory): registrar searches by name/DOB/sex/phone; Epic Prelude "search and match" runs before record creation; many systems pop a **Potential Duplicate Records window** listing near-matches at MRN creation time — the rule is *use the existing MRN if a match exists*.
2. **Create** → system assigns MRN (system-generated, never user-typed, never reused; enterprise systems keep a facility-level MRN plus an enterprise identifier — Epic's MPI sits in Prelude and links records across the organization).
3. **Active record** — demographics editable by registration within policy; identity-critical fields (legal name, DOB, SSN) are typically edit-restricted or audited; corrections that change *who the record is* route to HIM.
4. **Flag for merge** — front-end staff mark a suspected duplicate; it enters a review queue (Epic pattern: the "LINK MRN" is merged into the permanent MRN via the Patient Merge activity).
5. **Merge (HIM)** — analyst compares records, picks a **survivor**, executes electronic merge, combines any physical charts, and **notifies ancillary systems/clinics** so interfaces re-point. Unmerge must be supported because wrong merges (overlays) are patient-safety events.
6. **Retired/duplicate record** — deactivated, permanently pointing to the survivor.

### Business rules & edge cases
- **Matching algorithms** — three tiers: **deterministic** (exact match; only ~20–40% effective at catching duplicates), **rules-based weighting**, and **probabilistic** — per-field weights, tolerance for transpositions/misspellings (phonetic + edit-distance), summed into a score with **two thresholds**: auto-merge above the upper, human-review queue in the middle band, distinct below the lower ([ONC Patient Matching Final Report](https://www.healthit.gov/sites/default/files/resources/patient_identification_matching_final_report.pdf)). Newer: **referential matching** against external identity databases, and **Project US@** standardizing address format to improve match rates.
- **Duplicate vs overlay**: duplicate = one person, two MRNs (fix = merge). Overlay = two people under one MRN (far more dangerous; fix = unmerge/split with clinical review). Best practice: auto-merge only high-confidence matches, queue the rest, preserve legacy identifiers.
- **What the receptionist may edit**: contact info, address, phone, insurance, PCP, emergency contacts — freely. Legal name/DOB/sex changes usually require documentation and are audited; merges and MRN corrections are HIM-only.
- **Registration completeness** is enforced by required-field checks (Epic Prelude captures demographics → guarantor → coverage → consents in sequence, one-time entry flowing downstream).

### FHIR mapping
- `Patient` with `identifier` (MRN, use=official, type=MR), `Patient.active`.
- `Patient.link` types: `replaced-by` (on the retired duplicate), `replaces` (on the survivor), `seealso`, `refer`.
- **R5 `Patient/$merge` operation**: source + target; result sets source `active=false` + `link.type=replaced-by` → target; `preview=true` simulates; the server must re-point all resources referencing the source and should write a `Provenance` for the merge event.
- Guarantor/financials: `RelatedPerson`/`Account.guarantor`, `Coverage`.
- Duplicate-review queue: `Task` resources over candidate `Patient` pairs.

### Sources
[HL7 R5 Patient $merge](https://hl7.org/fhir/R5/patient-operation-merge.html) · [AHIMA EMPI paper](https://journal.ahima.org/Portals/0/archives/AHIMA%20files/Building%20an%20Enterprise%20Master%20Person%20Index.pdf) · [ONC Patient Matching Final Report](https://www.healthit.gov/sites/default/files/resources/patient_identification_matching_final_report.pdf) · [UIowa Epic Identity](https://epicsupport.sites.uiowa.edu/epic-resources/identity) · [Epic Prelude guide (Mindbowser)](https://www.mindbowser.com/understanding-epic-prelude/)

---

## 3. Check-In / Arrival & Queuing

### Actors
- **Receptionist / patient access rep** — works the arrival list (Epic: **DAR, Department Appointments Report**), verifies identity/demographics, collects payment, marks Arrived.
- **Patient** — increasingly self-serves via kiosk/mobile pre-check-in (Epic Welcome/MyChart "eCheck-In", MEDITECH Expanse Patient Connect).
- **MA/nurse** — pulls next patient from the waiting queue, rooms them.
- **Billing/eligibility engine** — automated payer checks pre-visit and at arrival.

### State machine / lifecycle
1. **Pre-arrival** (T-3 to T-1 days): batch **real-time eligibility** checks run against payers (X12 **270/271**); failures land on a work queue; prior-auth gaps flagged.
2. **Arrival**: patient identified (two identifiers; extra step if identity-theft flag). Appointment `booked → arrived`. Distinguish **arrived** (walked in the door) from **checked-in** (registration/financial clearance complete) — FHIR deliberately has both statuses.
3. **Check-in tasks**: verify demographics; update insurance; **collect copay**; MSPQ if applicable; questionnaires; labels/wristbands; portal signup prompt.
4. **Queue**: patient enters waiting-room queue visible to clinical staff (Epic DAR + rooming statuses; OpenMRS O3 **Service Queues** with per-queue statuses like *Waiting for Service → In Service*, priorities, and station-to-station transfers).
5. **Encounter start**: check-in creates/activates the visit. FHIR guidance: the **Encounter is created when the patient arrives** (status `arrived`), and creating it transitions the **Appointment to `fulfilled`**; Encounter then goes `in-progress` when care begins, `finished` at close.
6. **Check-out**: update registration, collect residual balances, **schedule follow-up**; Cerner requires Checked-In before Check Out is allowed.

### Business rules & edge cases
- **Copay/balance collection at check-in and check-out** is a first-class workflow (MEDITECH surfaces copays/deductibles/balances at both points).
- **Eligibility failure at the desk**: doesn't block clinical care — routes to a financial-counseling path. Financial clearance is a parallel gate, not a blocker to `arrived`.
- **Late arrival**: policy-driven — convert to walk-in on a later slot or same-day reschedule rather than a bespoke "late" state.
- **Left without being seen**: Encounter `cancelled` after `arrived`; the appointment is *not* `fulfilled`.
- **Undo**: administrative states need reverse transitions (Bahmni allows undoing CheckedIn back to Scheduled); clinical/terminal ones (Completed) are irreversible.
- **Queue mechanics** (OpenMRS O3): a queue entry = (patient, queue, **priority**, **status**, sort weight); status changes and inter-queue transfers end one QueueEntry and start another at the same timestamp, giving a full audit trail of waits per stage; "no show on call" pushes the patient back into the same queue flagged.

### FHIR mapping
- `Encounter.status` (R4): `planned → arrived → triaged → in-progress → onleave → finished`, exits `cancelled | entered-in-error | unknown`; `statusHistory` records each status+period so wait times are computable; `Encounter.appointment` links back; `class` with classHistory for ED→IP conversions. **R5 note**: `arrived`/`triaged` moved into `Encounter.subjectStatus`.
- Eligibility: `CoverageEligibilityRequest`/`CoverageEligibilityResponse`; `Coverage`; `Account` + guarantor.
- Queuing: no core FHIR queue resource in R4 — OpenMRS models QueueEntry natively; a FHIR-pure design uses `Encounter.status` + `Task`.

### Sources
[HL7 R4 Encounter](https://hl7.org/fhir/R4/encounter.html) · [UIowa Epic Check In/Check Out](https://epicsupport.sites.uiowa.edu/epic-resources/check-incheck-out) · [athenahealth Appointment Check-In API](https://docs.athenahealth.com/api/api-ref/appointment-check-in) · [MEDITECH Expanse Practice Management](https://ehr.meditech.com/ehr-solutions/expanse-practice-management) · [O3 Service Queues](https://o3-docs.openmrs.org/docs/configure-o3/configure-service-queues)

---

## 4. Walk-In / Urgent Flows vs Scheduled Visits; Triage Handoff

### Actors
- **Receptionist** — registers/looks up the walk-in, creates a same-day appointment or direct encounter, assigns queue + **priority**.
- **Triage nurse** — first clinical touch; assesses acuity, re-prioritizes the queue, escalates emergencies out of the front-office flow entirely.
- **Provider** — pulls from the prioritized queue.

### State machine / lifecycle
Two production patterns:
1. **Same-day-appointment pattern** (Epic/Cerner/athena): the walk-in is booked into a walk-in/overbook slot on today's schedule and immediately checked in — reusing the entire scheduled-visit machinery (eligibility, copay, DAR visibility, billing linkage). Epic templates reserve color-coded **urgent/walk-in blocks** for exactly this.
2. **Direct-encounter pattern** (OpenMRS/Bahmni, ED flows): skip Appointment entirely — registration "starts a visit" (Encounter `arrived`), and the patient enters a **triage queue** with priority (*Not urgent / Priority / Emergency*); status runs *Waiting for triage → Calling → In Service*; after triage the patient is **transferred to the next queue** (consultation, lab, pharmacy).

**Triage handoff at the front desk**: the receptionist performs *administrative* sorting only; clinical acuity assignment is the triage nurse's, recorded as `arrived → triaged` (R4) with `Encounter.priority`. The front desk must have a **bypass path**: an unstable patient goes straight to clinical care with registration completed retroactively ("quick reg").

### Business rules & edge cases
- **Interleaving**: queue position is a function of (priority, appointment time, arrival time) — scheduled patients keep slot precedence; walk-ins fill gaps; emergencies preempt everything.
- **Called but absent**: mark "no show on call," push back into the same queue flagged — don't discard.
- **Walk-in billing**: the same-day-appointment pattern exists largely so the walk-in inherits visit-type→billing mapping and eligibility checks.
- **Quick registration debt**: any quick-reg record must land in a completion work queue.

### FHIR mapping
- Walk-in with same-day appointment: `Appointment` (created `booked`, immediately checked in) → `Encounter`.
- Direct walk-in: `Encounter` created at `arrived` with **no** appointment reference; `Encounter.priority` for urgency.
- Triage output: `Observation`s (vitals) + `Encounter.priority`; queue movement as QueueEntry (or `Task`).
- Emergency escalation: `Encounter.class = EMER`, with `classHistory`.

### Sources
[HL7 R4 Encounter](https://hl7.org/fhir/R4/encounter.html) · [O3 Service Queues](https://o3-docs.openmrs.org/docs/configure-o3/configure-service-queues) · [OpenMRS queue module](https://github.com/openmrs/openmrs-module-queue)

---

## Cross-cutting design takeaways

1. **Appointment and Encounter are separate state machines** joined at check-in: Appointment is administrative (booked→fulfilled), Encounter is clinical (arrived→finished). Ordering constraints are enforced (no check-out without check-in; no charge entry without check-out).
2. **Availability is template-driven, not ad hoc**: recurring provider templates generate slots; slot-level constraints encode "what can be booked here"; template editing is a privileged role.
3. **No-show is an explicit human decision**; cancelled/no-show records are retained for analytics and waitlist backfill.
4. **Registration creates identity; HIM corrects it.** Front-end staff flag duplicates; merges run through a review queue with probabilistic scoring and dual thresholds.
5. **Financial clearance (eligibility, copay) is fused into check-in** but runs as a parallel gate that never blocks urgent clinical care.
6. **Booking must be atomic** under concurrency (Medplum's `$book` with serializable isolation is the reference open implementation).
7. **Administrative transitions need undo; clinical/terminal ones don't.**
