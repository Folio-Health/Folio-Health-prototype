# Clinical Workflow Design in Production EMR/EHR Systems

Research synthesis covering Epic, Oracle Cerner (Millennium/PowerChart), MEDITECH Expanse, OpenMRS, and Medplum, mapped to FHIR R4/R5 and the regulatory rules (CMS CoPs, Joint Commission NPSGs, ISMP) that shape production logic.

---

## 1. Encounter / Consultation Documentation

### Actors
- **Attending physician / LIP (licensed independent practitioner)** — authors and signs notes, owns the encounter diagnosis, attests to resident/student documentation.
- **Resident / medical student / scribe** — may author; note is *pended* until the supervising physician edits, attests, and cosigns (CMS allows teaching physicians to bill from a student's note only after editing and cosigning).
- **Nurse / MA** — rooming, intake vitals, chief complaint capture (contributes structured data to the note, not the attestation).
- **HIM / compliance** — deficiency tracking (unsigned-note queues), amendment governance.

### State machine / lifecycle
**FHIR Encounter.status (R4):** `planned → arrived → triaged → in-progress → onleave → finished` (+ `cancelled`, `entered-in-error`, `unknown`). **R5 revised this to:** `planned → in-progress → on-hold → discharged → completed` (+ `cancelled`, `discontinued`, `entered-in-error`), with history moved into the separate **EncounterHistory** resource. A patient is considered admitted at minimum when status = `in-progress`.

**Note lifecycle (the document, distinct from the encounter):**

```
draft/pended → (preliminary) → signed/final → addended | amended | corrected
                                    ↘ entered-in-error (retract, never delete)
```

FHIR `Composition.status`: `preliminary → final → amended/appended/corrected`; the spec states status only moves *down* the list — never back to a less-final state. `DocumentReference.docStatus` mirrors this for indexed notes.

**Production behavior:**
- **Epic**: notes are "pended" (shared draft) or "signed"; a signed note is immutable — changes create an **addendum** appended with its own author/timestamp; cosign deficiencies route to the attending's In Basket.
- **Cerner PowerChart**: documents move `In Progress → Auth (Verified)`; "Modify" on a signed doc produces a new version with the prior version retained and marked.
- **OpenMRS**: an `Encounter` belongs to a `Visit`; it holds 0..n `Obs` and 0..n `Orders`.
- **Medplum**: recommends the visit chart as structured resources — S/O as `Observation`s from `QuestionnaireResponse`s, A as `ClinicalImpression` (+ `Condition` for coded dx), P as `ServiceRequest`/`MedicationRequest`/`CarePlan` — and *signing = setting ClinicalImpression to `completed` and writing a `Provenance` record that locks the note*.

### Business rules & safety logic
1. **Immutability after signature**: once e-signed, the record may only change via a separately signed, dated, timestamped addendum/amendment; the original is never overwritten. Late entries, addenda, amendments, and attestations are four distinct constructs, each labeled as such.
2. **Attestation**: the attester may differ from the author (FHIR `Composition.attester`); teaching-physician attestations must state presence/participation.
3. **Problem list vs. encounter diagnosis**: an encounter diagnosis is a point-in-time assertion tied to a visit; the problem list is longitudinal and curated — systems require an explicit clinician action to *promote* an encounter diagnosis to the problem list.
4. **Signing deadlines**: medical staff bylaws set note-completion windows (commonly 24–72h); HIM deficiency queues suspend privileges for chronic delinquency.
5. **Unsigned orders/notes never drive billing**; charge capture is gated on final signature.

### FHIR mapping
| Concept | Resource / element |
|---|---|
| Visit | `Encounter` (status, class, period, participant, location) + `EncounterHistory` (R5) |
| Note document | `Composition` (status, attester, section) / `DocumentReference` (docStatus) |
| Assessment | `ClinicalImpression` (status: in-progress → completed) |
| Encounter dx | `Condition` category = `encounter-diagnosis`; also `Encounter.diagnosis` |
| Problem list | `Condition` category = `problem-list-item`, `clinicalStatus`, `verificationStatus` |
| Signature | `Provenance` (+ `Signature` datatype), `Composition.attester` |

### Sources
[FHIR R5 Encounter](https://www.hl7.org/fhir/encounter.html) · [FHIR Composition](http://hl7.org/fhir/composition.html) · [UTHealth: Late Entry, Addendum, Amendment, or Attestation](https://med.uth.edu/mshbc/coding-compliance-overview/late-entry-addendum-amendment-or-attestation/) · [Medplum SOAP notes](https://www.medplum.com/docs/charting/soap-notes) · [Medplum chart data model](https://www.medplum.com/docs/charting/chart-data-model)

---

## 2. CPOE — Lab & Imaging Order Lifecycle

### Actors
- **Ordering provider (physician/NP/PA)** — only LIPs within scope of practice may place & sign orders; verbal/telephone orders may be enacted by authorized licensed staff but must be authenticated by a practitioner within **48 hours** (CMS CoP 42 CFR 482.24).
- **Nurse / phlebotomist** — specimen collection, order acknowledgement on the unit.
- **Lab tech / radiology tech** — performs; **only the performing lab (CLIA-certified) may result**; a pathologist/radiologist verifies and finalizes reports.
- **Ordering/covering provider** — must review and acknowledge results; **critical results require a closed acknowledgement loop**.

### State machine / lifecycle
**Canonical (matches Cerner's literal statuses):**

```
draft (unsigned/held) → signed/active ("Ordered")
  → specimen collected ("In Process")           [labs]
  → performed/exam completed                    [imaging]
  → preliminary result → final result ("Completed")
  → reviewed/acknowledged by provider
Terminal alternates: cancelled (before start) | discontinued (after start) | entered-in-error
```

- **Cerner**: blank → `Ordered` → `In Process` → `Completed` / `Discontinued` / `Canceled`; allowable actions (Modify, Activate, Cancel/DC, Cancel-and-Reorder, Complete) depend on current status.
- **Epic**: order signed → released → collected → in lab → prelim → final; results route to the ordering provider's **In Basket Results folder**.
- **OpenMRS**: immutable order rows linked by `previousOrder` — actions are `NEW`, `REVISE`, `DISCONTINUE`, `RENEW`.
- **Medplum**: `ServiceRequest` updated as it moves through workflow; `DiagnosticReport.basedOn` → ServiceRequest; Subscriptions + Bots emit HL7 ORM/ORU.

**Result side:** `Observation.status`: `registered → preliminary → final → amended/corrected`. `DiagnosticReport.status`: `registered → partial → preliminary → final → amended/corrected/appended`. `Specimen.status`: `available | unavailable | unsatisfactory | entered-in-error` — "unsatisfactory" drives redraw/recollect loops.

### Business rules & safety logic
1. **Order signature gating**: unsigned orders execute nothing; cosign-required orders sit in a cosign queue (48h CMS rule).
2. **Critical results (Joint Commission NPSG.02.03.01)**: the org defines critical values, who reports to whom, and the maximum time from availability to report; the lab calls the responsible caregiver directly, documents read-back, and the loop of **receipt → acknowledgement → action** must close — with escalation if unacknowledged within a timeout.
3. **Specimen integrity**: positive patient ID at collection (barcode wristband scan); mislabeled/hemolyzed specimens flip to unsatisfactory and force reorder, never relabel.
4. **Duplicate order checking**, **corollary orders** (e.g., creatinine before contrast), and **indication requirements** on imaging (reason-for-exam mandatory).
5. **Result → order provenance**: results always link back to the placer order; amended results re-trigger provider notification.
6. **Separation of duties**: ordering ≠ resulting. Nurses can *collect* and *acknowledge receipt* but not author results.

### FHIR mapping
| Step | Resource / status |
|---|---|
| Order | `ServiceRequest.status`: draft → active → completed (revoked, on-hold, entered-in-error); `intent`: order; `category`: laboratory/imaging |
| Fulfillment tracking | `Task` basedOn ServiceRequest: requested → accepted → in-progress → completed / rejected / failed |
| Specimen | `Specimen` (status; collection details) |
| Result values | `Observation.status` + `interpretation` (H/L/HH/LL critical flags) |
| Report | `DiagnosticReport.status`; `basedOn` → ServiceRequest; `result` → Observations |
| Acknowledgement | `Communication` / `Task` (ack task on critical result) + `Provenance` |

### Sources
[FHIR ServiceRequest](https://hl7.org/fhir/servicerequest.html) · [CST Cerner Help: Review Order Statuses](https://cstcernerhelp.healthcarebc.ca/Patient_Chart/Orders/Review_Order_Statuses.htm) · [Joint Commission NPSG](https://digitalassets.jointcommission.org/api/public/content/3c7a110c215943bc80d9ce87e9d9ee9d?v=aef80e14) · [CMS verbal orders](https://www.cms.gov/regulations-and-guidance/guidance/eog/downloads/eo-0040-request-verbalorders.pdf) · [Medplum lab solutions](https://www.medplum.com/solutions/lab) · [OpenMRS Order Model](https://openmrs.atlassian.net/wiki/spaces/projects/pages/27009146/Order+Model)

---

## 3. Closed-Loop Medication Management

### Actors
- **Prescriber (LIP)** — creates MedicationRequest; responds to pharmacist clarifications.
- **Pharmacist** — *verifies every inpatient med order before first dose* (except ED stat/override); may reject/clarify; performs therapeutic substitution per formulary policy.
- **Pharmacy tech** — fills, compounds, stocks ADCs; pharmacist checks the fill.
- **Nurse** — administers via BCMA/MAR; documents given/held/refused/wasted; second-nurse cosign for high-alert meds.
- **CDS engine** — interaction/allergy/dose-range checking at both prescribing and verification.

### State machine / lifecycle (the closed loop)

```
PRESCRIBE   MedicationRequest: draft → active (signed)
                └ pharmacist verification gate ─ verify → order releases to MAR/ADC
                                               ─ reject/clarify → back to prescriber (order held)
DISPENSE    MedicationDispense: preparation → in-progress → completed
                (cancelled | on-hold | declined | stopped | entered-in-error)
ADMINISTER  MedicationAdministration: in-progress → completed | not-done (reason) | stopped
MONITOR     Observation (levels, vitals), AdverseEvent; MedicationStatement for reconciliation
END         MedicationRequest: completed | stopped | cancelled | on-hold
```

- **Epic (Willow)**: signed orders land on the pharmacist **Verify queue**; unverified orders don't appear as due tasks on the nurse's MAR (auto-verify exceptions for ED/override pulls).
- **Cerner**: PharmNet verification; medication order actions Modify/Cancel-DC/Suspend/Resume/Complete.
- **FHIR medications module**: MedicationRequest = intent; Dispense and Administration are created by fulfillment workflow and may deliberately differ from the order where the dispenser exercised clinical judgment.

### Business rules & safety logic
1. **No administration without pharmacist verification** (first-dose review) — bypass exists only as a formal *override pull* from the ADC for emergencies, which generates a retrospective pharmacist review queue.
2. **Five rights enforced by BCMA**: nurse scans **patient wristband** then **medication barcode**; system validates right patient, drug, dose, route, time against the *verified* order and blocks/warns on mismatch.
3. **Timing windows (ISMP, adopted by CMS)**: **time-critical** meds ±30 min; **non-time-critical** ±1 hour (q4h–q24h) / ±2 hours (daily+). The MAR colors/flags due, early, late, overdue; nurses must document the *exact* administration time.
4. **High-alert medications** (heparin, insulin, concentrated electrolytes, chemo): independent double-check / second-nurse cosign in the MAR.
5. **CDS at two points**: prescriber sees allergy/interaction/dose-range/duplicate alerts at entry; pharmacist sees them again at verification with override-reason documentation.
6. **Formulary & stock**: order entry constrains to formulary; ADC stock is patient-profile-restricted; controlled-substance returns/wastes require witnessed countersign.
7. **Rejection loop**: pharmacist rejection puts the order in a held state and pushes a message to the prescriber; nothing silently disappears.
8. **Not-given documentation**: a due MAR task can only be resolved as given, held (reason), refused (reason), or missed — blank boxes are compliance findings.

### FHIR mapping
| Step | Resource / status |
|---|---|
| Prescription | `MedicationRequest.status`: draft → active → completed/stopped/cancelled/on-hold; `dispenseRequest`, `dosageInstruction` |
| Verification | `Task` (verify) on the MedicationRequest, or Provenance of pharmacist action; rejection = Task rejected + Communication |
| Dispense | `MedicationDispense.status`; `substitution` element records interchange |
| Administration | `MedicationAdministration.status`; `not-done` with `statusReason`; `performer` |
| MAR schedule | Derived from `dosageInstruction.timing` → per-dose `Task`s |
| Home meds | `MedicationStatement` (basis for reconciliation) |
| Allergy/CDS | `AllergyIntolerance`, `DetectedIssue` (with override reason) |

### Sources
[FHIR Medications module](http://hl7.org/FHIR/medications-module.html) · [ISMP Timely Administration Guidelines](https://www.ismp.org/sites/default/files/attachments/2018-02/tasm.pdf) · [CMS S&C 12-05 (med timing)](https://www.cms.gov/medicare/provider-enrollment-and-certification/surveycertificationgeninfo/downloads/scletter12_05.pdf) · [Epic Willow verification](https://pharmacystandards.org/chppc/module-18-epic-willow-inpatient-order-entry-and-verification/) · [BCMA overview (TechTarget)](https://www.techtarget.com/searchhealthit/definition/Bar-Coded-Medication-Administration)

---

## 4. Nursing Workflows

### Actors
- **Charge nurse** — makes **patient assignments** (nurse↔patient/bed mapping per shift, acuity-balanced); owns the unit status board.
- **Bedside RN** — task list execution: assessments, vitals, MAR, intake/output, care-plan interventions, handoff.
- **Nursing assistant / PCT** — delegated vitals, ADLs; documents within their permitted scope.
- **Off-going / on-coming RN** — structured shift handoff.

### State machine / lifecycle
**Task list** (the nurse's work queue is generated, not hand-built): active orders + care-plan interventions + med schedule project into time-bucketed tasks:

```
scheduled/due → overdue (escalating visual state) → done (documented) | not done (reason)
```

- **MEDITECH Expanse**: the **Status Board/Tracker** is the entry point; the **Worklist** documents Interventions, Outcomes, and Medications; status boards exist per role.
- **Epic**: Brain (nurse narrator timeline), Work List, Rover mobile; **Cerner**: CareCompass task list + iView flowsheets.

**Vitals capture:** device/manual entry → flowsheet row → `Observation` (category vital-signs, LOINC-coded). Out-of-range values trigger early-warning scores (MEWS/NEWS) and rapid-response triggers.

**Shift handoff:** structured **SBAR** or **I-PASS** templates embedded in the EHR; every patient, every shift change, with receiver read-back/synthesis.

### Business rules & safety logic
1. **Assignment gates documentation**: you chart on patients on your list; access to non-assigned patients is break-the-glass with audit.
2. **MAR timing windows** render due/late states; overdue time-critical meds escalate visually and via notification.
3. **Delegation boundaries**: PCTs can file vitals but not assess; abnormal vitals filed by a PCT route a review task to the RN.
4. **Scope-locked flowsheets**: restraint documentation q15min timers, pain reassessment post-PRN, turn schedules — recurring tasks with mandatory completion or exception reason.
5. **Handoff standardization** is a Joint Commission communication requirement; I-PASS adoption measurably reduces preventable adverse events.
6. **Early warning scoring**: threshold crossings force an "RN notified / provider notified" documentation loop.

### FHIR mapping
| Concept | Resource |
|---|---|
| Task list item | `Task` (basedOn order/CarePlan activity; owner; restriction.period = due window) |
| Vitals | `Observation` (category vital-signs, hasMember for panels) |
| Care plan interventions | `CarePlan.activity` → Tasks |
| Assignment | `Encounter.participant` or `CareTeam` per shift |
| Handoff | `Composition` (handoff note type); I-PASS/SBAR as section structure |
| MAR row | scheduled `MedicationAdministration` / Task per dose |

### Sources
[FHIR Task](https://www.hl7.org/FHIR/task.html) · [MEDITECH Expanse for Nurses](https://ehr.meditech.com/ehr-solutions/expanse-for-nurses) · [I-PASS, Joint Commission Journal](https://www.jointcommissionjournal.com/article/S1553-7250(24)00073-4/fulltext) · [AHRQ structured handoff review](https://effectivehealthcare.ahrq.gov/sites/default/files/related_files/structured-handoff-rapid-research.pdf)

---

## 5. Admission / Transfer / Discharge (ADT) & Bed Management

### Actors
- **Admitting provider** — writes the **admission order** (inpatient vs observation, level of care, admitting dx, attending) — nothing is an admission without this signed order.
- **Bed manager / patient placement** (Epic Grand Central, Cerner Capacity Management) — matches bed requests to beds using unit, level of care, isolation, sex, telemetry needs.
- **Charge nurse (sending & receiving units)** — accepts transfers, nurse-to-nurse handoff.
- **EVS (environmental services)** — bed turnover; **case management** — discharge planning from day 1.
- **Discharging provider** — discharge order, discharge summary, discharge med reconciliation.

### State machine / lifecycle
**Encounter:** `planned (preadmit) → arrived → in-progress (admitted) → [onleave] → discharged → finished`, with each physical move appended to `Encounter.location` history.

**HL7 v2 event backbone:** `A01` admit, `A02` transfer, `A03` discharge, `A04` register outpatient, `A05` preadmit, `A06/A07` change patient class (obs↔inpatient), `A08` update, `A11/A12/A13` cancel admit/transfer/discharge.

**Bed lifecycle:**

```
clean/available → assigned/reserved → occupied → (patient discharged/transferred)
   → dirty → cleaning-in-progress → clean/available     (+ blocked/maintenance)
```

In Epic, discharge/transfer *automatically* fires the bed-clean request to EVS; terminal cleans auto-prioritize when a waiting patient is assigned.

**Transfer logic:** transfer order (level of care change) → bed request → placement assigns target bed → receiving RN accepts (handoff) → patient moves → A02 fires → **level-of-care-dependent orders (drips, monitoring, restraints) require review/reorder on transfer**.

**Discharge workflow:** discharge planning in parallel → provider signs **discharge order** → discharge checklist gates: discharge med reconciliation, prescriptions, patient instructions (AVS), follow-up appointments, pending-results flagging → nurse completes discharge documentation → A03 → bed to dirty → **discharge summary** signed (CMS CoP: within 30 days; bylaws usually far sooner).

### Business rules & safety logic
1. **Admission requires a signed order from a practitioner with admitting privileges**; patient class changes are formal orders with regulatory consequences.
2. **Bed assignment constraints**: sex-segregated rooms, isolation compatibility, telemetry/negative-pressure capability, age, acuity vs unit staffing.
3. **Orders don't silently survive transitions**: transfer triggers order reconciliation; many systems auto-suspend or force review of all active orders on level-of-care change.
4. **Discharge med reconciliation is a hard gate** (NPSG.03.06.01); admission reconciliation is the mirror-image gate at entry.
5. **Pending-at-discharge results** route to a responsible-provider queue so nothing is orphaned.
6. **Leave of absence** (`onleave`) is distinct from discharge — the bed is held, meds are suspended, not discontinued.
7. **Discharge is not chart closure**: the encounter stays open for late documentation until HIM analysis marks it complete.

### FHIR mapping
| Concept | Resource |
|---|---|
| Stay | `Encounter` (class = IMP/OBSENC; hospitalization: admitSource, dischargeDisposition; location[] with period + status) |
| Bed/unit | `Location` (physicalType: bed/room/ward; operationalStatus: occupied, unoccupied, housekeeping, closed, contaminated, isolated) |
| ADT orders | `ServiceRequest` (admit/transfer/discharge) or Task; v2 ADT events on the wire |
| Discharge summary | `Composition` (LOINC 18842-5) / DocumentReference |
| Med rec | `MedicationStatement` (home) vs `MedicationRequest` (inpatient/discharge) + `List` (reconciled) |
| Discharge dx | `Encounter.diagnosis` (use = discharge), Condition |

### Sources
[FHIR R5 Encounter](https://www.hl7.org/fhir/encounter.html) · [HL7 ADT event reference](https://mirth.support/blog/hl7-adt-messages-complete-reference) · [Epic Grand Central (IntuitionLabs)](https://intuitionlabs.ai/software/healthcare-provider-operations/bed-management-and-patient-flow/epic-grand-central) · [Joint Commission med-rec NPSG](https://www.cureatr.com/resources/joint-commissions-medication-reconciliation-npsg) · [AHRQ MATCH toolkit](https://www.ahrq.gov/patient-safety/settings/hospital/match/chapter-1.html)

---

## 6. Referrals & In-Hospital Handoffs (Consults)

### Actors
- **Referral initiator** (PCP / attending) — creates referral/consult request with reason + supporting info.
- **Referral recipient** (specialist / consulting service) — accepts or declines, performs, returns findings.
- **Referral coordinator / scheduler** — insurance auth, appointment booking (ambulatory).
- **Consulting service resident/fellow → attending** — in-hospital consult chain; consult note requires attending attestation.

### State machine / lifecycle
**Cross-organization closed-loop referral (IHE 360X / HL7 BSeR):** the referral is a `ServiceRequest` whose progress is tracked on a **Task**:

```
requested → (recipient) received → accepted | rejected/declined
  accepted → scheduled → in-progress (patient seen)
  → completed (consult report/outcome returned to initiator)  ← the "closed loop"
  cancelled (initiator withdraws) | failed (patient no-show → notify initiator)
```

360X exists precisely because most referrals historically died silently — every state change generates a notification back to the requester.

**In-hospital consult:**

```
consult order (ServiceRequest, priority stat/routine) → consult service notified
 → acknowledged → patient seen → consult note (recommendations)
 → recommendations actioned by primary team (consultant recommends, primary team orders)
 → sign-off or co-management continues
```

### Business rules & safety logic
1. **Closed-loop mandate**: a referral without a returned outcome is an open patient-safety item; systems track "referral aging" queues and auto-remind.
2. **Consultant vs. primary authority**: the consultant *recommends*; the primary team *orders* (except co-management).
3. **Required content**: reason, urgency, relevant results/meds/allergies; "reason for consult" is a mandatory field.
4. **Timeliness SLAs**: stat consults acknowledged within defined minutes; routine within 24h — tracked on Task timestamps.
5. **Declines must be communicated**, never silent.
6. **Transitions of care** require an accompanying document (C-CDA referral note / FHIR document).

### FHIR mapping
| Concept | Resource |
|---|---|
| Referral/consult request | `ServiceRequest` (intent = order; category = referral; priority; reasonCode; supportingInfo) |
| Loop tracking | `Task` (basedOn ServiceRequest): requested → received → accepted/rejected → in-progress → completed/failed/cancelled |
| Consult report | `Composition`/`DocumentReference` (consult note LOINC 11488-4) |
| Care responsibility | `CareTeam`, `Encounter.participant` (consultant role) |

### Sources
[IHE 360X Closed Loop Referral](https://wiki.ihe.net/index.php/Closed_Loop_Referral_360X) · [HL7 BSeR IG](https://hl7.org/fhir/us/bser/Introduction.html) · [ONC transitions of care](https://www.healthit.gov/isp/support-a-transition-care-or-referral-another-health-care-provider)

---

## Cross-cutting design principles (what all five production systems share)

1. **Orders are the spine.** Every clinical action originates from a signed order by an authorized role; execution artifacts always link back to the order, and status is tracked on *both* the request (intent) and a fulfillment record (Task/event resource).
2. **Nothing is deleted.** Wrong entries become `entered-in-error`; signed documents get addenda; OpenMRS makes orders fully immutable rows chained by `previousOrder`.
3. **Gates, not vibes.** Safety is enforced as hard state-transition gates: no MAR task without pharmacist verification; no administration without wristband scan; no discharge without med rec; no billing without signature; verbal orders expire into deficiency queues at 48h.
4. **Every loop must close with an acknowledgement by a named human** — critical results, referrals, cosigns, clarifications — and unclosed loops escalate on timers.
5. **Role separation is structural**: orderer ≠ verifier ≠ administrator ≠ resulter, each transition stamped with performer + time (`Provenance`).
