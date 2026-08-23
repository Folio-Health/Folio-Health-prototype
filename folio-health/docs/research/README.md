# EMR Working-Logic Research

How first-world production EMRs (Epic, Oracle Cerner, athenahealth, MEDITECH,
OpenMRS, Medplum) design every day-to-day hospital workflow — from appointments
to sign-out. Each report gives, per workflow: **actors, the canonical state
machine, business/safety rules, the FHIR mapping, and cited sources**. Use these
as the working logic when building or reviewing a Folio module.

| Report | Covers |
|---|---|
| [Front-office](emr-front-office.md) | Appointment scheduling, registration & identity/MRN/merge, check-in & queuing, walk-ins & triage |
| [Clinical](emr-clinical-flows.md) | Encounter/notes & signing, CPOE lab/imaging orders, closed-loop medication (prescribe→verify→dispense→administer/MAR), nursing, ADT/bed management/discharge, referrals & consults |
| [Back-office & security](emr-back-office-security.md) | Revenue cycle/claims, HIM corrections/merge/ROI, security & break-glass & sessions/sign-out, account lifecycle, inventory/pharmacy stock, secure messaging & result acknowledgement |

**Slide deck:** [EMR-Working-Logic-Research.pptx](EMR-Working-Logic-Research.pptx)
— the same three reports, one deck (54 slides). Source citations live in the
markdown files (slides omit the Sources blocks for readability).

Regenerate the deck after editing the markdown: the generator script lives in
the session that produced it; any markdown-to-pptx tool works — keep one slide
per section and monospace the state-machine blocks.
