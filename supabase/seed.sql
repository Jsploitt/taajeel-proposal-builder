-- seed.sql — Taajeel Proposal Builder reference data.
--
-- SOURCE OF EVERY ROW BELOW
--   P1  proposal/Proposal to HAVENSTONE CONSULTING W.L.L foreign company set up.pptx
--   P2  proposal/Proposal to FlyAkeed _ Annual Confirmation v02.pdf
--   P3  proposal/Proposal to HCP Architecture & Engineering HRO & GRO V03.pdf
--
-- Nothing here was estimated, rounded, translated or reworded. Where a value
-- could not be read off a slide it is NULL and listed in supabase/README.md
-- under "Still needs a human decision". NULL means UNCONFIRMED.
--
-- Idempotent: fixed UUIDs + ON CONFLICT, safe to re-run.

begin;

-- ================================================================ services

insert into public.services
  (id, name, engagement_type, subject_template, service_description, default_sections)
values
  -- ---------------------------------------------------------------- P1
  ( 'a1000000-0000-4000-8000-000000000001',
    'Foreign Company Formation in Saudi Arabia',
    'project',
    $t$Proposal for Professional Services of Foreign Company Formation in Saudi Arabia$t$,
    $t$professional services of foreign company formation in Saudi Arabia$t$,
    $j$
    {
      "_source": "P1 Havenstone (.pptx), slides 3, 5, 14, 17-18, 20-22, 24, 25",
      "timeFrame":  { "show": true },
      "additional": { "show": true },
      "nonCovered": { "show": false, "items": [] },
      "rateCard":   { "show": true },
      "govFees":    { "show": true },
      "fees": {
        "currency": "SAR",
        "paymentSplit": [
          { "pct": 50, "when": "Advance payment when signing the approval of the proposal." },
          { "pct": 35, "when": "When we have approval from MISA." },
          { "pct": 15, "when": "When we have a Commercial Register." }
        ],
        "notes": [
          "Government Fees are not included in Taajeel fees, Government Fees page attached in separate slide.",
          "Payments paid within five days of the maturity date.",
          "Payments to be made are non-refundable and payable upon signing the contract.",
          "We will issue the invoices based on the maturity date payments as described in the above method of payment.",
          "VAT will be charged (15%) of the total fees paid by the Client to obtain the Value Added Tax (VAT) issued by Zakat, Tax, and Customs Authority “ZATCA”."
        ]
      }
    }
    $j$::jsonb ),

  -- ---------------------------------------------------------------- P2
  ( 'a1000000-0000-4000-8000-000000000002',
    'Annual Confirmation (Amending the Articles of Association and Updating the CR)',
    'project',
    $t$Proposal of Professional Services for Annual Confirmation.$t$,
    $t$Professional Services for Amending the Articles of Association and Updating the CR$t$,
    $j$
    {
      "_source": "P2 FlyAkeed (.pdf), pages 3, 5, 14, 16, 18, 20",
      "timeFrame":  { "show": true },
      "additional": { "show": true },
      "nonCovered": { "show": false, "items": [] },
      "rateCard":   { "show": false },
      "govFees":    { "show": false },
      "fees": {
        "currency": "SAR",
        "paymentSplit": [
          { "pct": 50, "when": "Advance payment upon signing and approval of the proposal." },
          { "pct": 35, "when": "Upon receipt of approval from the Saudi Business Center (SBC)." },
          { "pct": 15, "when": "Upon issuance of the updated Commercial Registration for the company." }
        ],
        "notes": [
          "Government Fees are not included in Taajeel fees.",
          "Payments paid within five days of the maturity date.",
          "Payments to be made are non-refundable and payable upon signing the contract.",
          "We will issue the invoices based on the maturity date payments as described in the above method of payment.",
          "VAT will be charged (15%) of the total fees paid by the Client to obtain the Value Added Tax (VAT) issued by Zakat, Tax, and Customs Authority “ZATCA”."
        ]
      }
    }
    $j$::jsonb ),

  -- ---------------------------------------------------------------- P3
  ( 'a1000000-0000-4000-8000-000000000003',
    'HRO & GRO with National Address and Office Services',
    'retainer',
    $t$Proposal for Professional Services in HRO  and GRO & National Address with office services.$t$,
    $t$Professional Services in HRO and GRO$t$,
    $j$
    {
      "_source": "P3 HCP (.pdf), pages 3, 5, 14, 15, 17, 19",
      "_note": "P3 is the only proposal with NO Time Frame section and the only one WITH a Non-covered section. template/FORENSICS.md flags that n=1: do not treat either as a rule for all retainers.",
      "timeFrame":  { "show": false },
      "additional": { "show": false },
      "rateCard":   { "show": false },
      "govFees":    { "show": false },
      "nonCovered": {
        "show": true,
        "intro": "The scope of work  not covered the below matters, But we do it with additional fees that will be discussed with you upon request (case by case):",
        "items": [
          "Any government fees or subscriptions to government platforms",
          "Amended or renewal of the commercial register",
          "Investment license renewal",
          "Renew an Entrepreneur Project Support Letter",
          "lawsuit or Cases (commercial / labor / personal / commercial fraud)",
          "Submit income tax or value added tax returns",
          "Amending the articles of association",
          "Structuring",
          "Prepare the organizational structure",
          "Prepare job description",
          "Preparation of internal regulations (example of internal work regulations)",
          "Recruitment",
          "Paying salaries to employees",
          "Providing personnel management software",
          "Cancellation or objection to violations of the HRSD"
        ],
        "groups": [
          { "title": "Government Relation Operations (GRO)",
            "items": [
              "Any government fees or subscriptions to government platforms",
              "Amended or renewal of the commercial register",
              "Investment license renewal",
              "Renew an Entrepreneur Project Support Letter",
              "lawsuit or Cases (commercial / labor / personal / commercial fraud)",
              "Submit income tax or value added tax returns",
              "Amending the articles of association"
            ] },
          { "title": "Human Resources Operation (HRO)",
            "items": [
              "Structuring",
              "Prepare the organizational structure",
              "Prepare job description",
              "Preparation of internal regulations (example of internal work regulations)",
              "Recruitment",
              "Paying salaries to employees",
              "Providing personnel management software",
              "Cancellation or objection to violations of the HRSD"
            ] }
        ]
      },
      "fees": {
        "currency": "SAR",
        "period": "monthly subscription",
        "paymentSplit": [],
        "paymentMethodNote": "Advance payment every 6 months for the monthly subscription.",
        "coverageNote": "The GRO&HRO is for cover from 1-5 employees",
        "notes": [
          "Payments Should paid within five days of the maturity date.",
          "Regarding the provisions related to proving the national address, the Client shall pay for the virtual address service at least six (6) months in advance and may not cancel this service unless proof of updating the national address has been provided in both the Commercial Register and the Saudi Post (SPL), and the Client has the right to cancel the service by notifying 30 days before the end of the subscription period or renewal.",
          "The Fees does not include any other services Taajeel provides Except for those for which it is billed.",
          "Payments to be made are non-refundable and payable upon signing the contract.",
          "We will issue the invoices based on the maturity date payments as described in the above method of payment.",
          "VAT will be charged (15%) of the total fees paid by the Client to obtain the Value Added Tax (VAT) issued by Zakat, Tax, and Customs Authority “ZATCA”."
        ]
      }
    }
    $j$::jsonb )
on conflict (id) do update set
  name                = excluded.name,
  engagement_type     = excluded.engagement_type,
  subject_template    = excluded.subject_template,
  service_description = excluded.service_description,
  default_sections    = excluded.default_sections;

-- ================================================================ scope_steps
--
-- P1 — read off the journey graphic (slide 14 of the Havenstone .pptx, rendered
-- at build/renders/taajeel_master/14.png). Labels are the live text runs,
-- verbatim. Order follows the numbered badges 01..16. `agency` is the mark the
-- SOURCE DECK actually draws beside that gear, not what the wording implies:
--   * step 04 "Get approval from MOC" names MOC but carries NO mark in the deck.
--   * the single MOC mark sits above step 06 "Pay the fees".
--   * step 05 "Company name reservation" carries no mark.
-- Leaving those NULL removes the mark; guessing would print the wrong logo.
--
-- default_duration_days is NULL for every row — see README, "Durations".

insert into public.scope_steps
  (service_id, ordinal, label, default_duration_days, agency, block_ordinal, block_title, block_intro)
values
  ('a1000000-0000-4000-8000-000000000001',  1, $t$Workshop with Client$t$,                                                      null, null,               1, $t$Setup the Company$t$, $t$According to Assignment to Setup Foreign Company in Saudi Arabia, So the scope of work is delivered into the following sixteen steps:$t$),
  ('a1000000-0000-4000-8000-000000000001',  2, $t$Applying for the MISA License$t$,                                             null, 'misa',             1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001',  3, $t$Submit the AOA in platform SBC$t$,                                            null, 'sbc',              1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001',  4, $t$Get approval from MOC$t$,                                                     null, null,               1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001',  5, $t$Company name reservation$t$,                                                  null, null,               1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001',  6, $t$Pay the fees$t$,                                                              null, 'moc',              1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001',  7, $t$Notarizing the Articles of Association$t$,                                    null, 'notary',           1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001',  8, $t$Advertising the Articles of Association$t$,                                   null, 'aamaly',           1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001',  9, $t$Open company file in HRSD$t$,                                                 null, 'hrsd',             1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001', 10, $t$Registration in QIWA Platform for management the engagement with Employees$t$, null, 'qiwa',            1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001', 11, $t$Registration in Muqeem platform for completing procedures for foreign residents$t$, null, 'muqeem',     1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001', 12, $t$Open file for company to Issuing the Certificate of GOSI.$t$,                 null, 'gosi',             1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001', 13, $t$Registration of the company address on the national address platform$t$,      null, 'national_address', 1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001', 14, $t$Issuing a TAX Certificate$t$,                                                 null, 'zatca',            1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001', 15, $t$Issuing a VAT Certificate$t$,                                                 null, 'zatca',            1, $t$Setup the Company$t$, null),
  ('a1000000-0000-4000-8000-000000000001', 16, $t$Ratification the signatures of the partners$t$,                               null, 'riyadh_chamber',   1, $t$Setup the Company$t$, null),

-- P2 — FlyAkeed page 14, gear journey, badges 01..09. Agency keys are the logos
-- actually printed beside each gear (Taajeel mark on 01/02, the client wordmark
-- on 03, none on 08 -> NULL).
  ('a1000000-0000-4000-8000-000000000002',  1, $t$Workshop with Client$t$,                                    null, null,     1, $t$Annual Confirmation$t$, $t$According to Assignment of the annual confirmation, So, the scope of work is delivered into the following 9 steps:$t$),
  ('a1000000-0000-4000-8000-000000000002',  2, $t$Drafting the Resolution$t$,                                 null, null,     1, $t$Annual Confirmation$t$, null),
  ('a1000000-0000-4000-8000-000000000002',  3, $t$Issuance the Required Documents$t$,                         null, null,     1, $t$Annual Confirmation$t$, null),
  ('a1000000-0000-4000-8000-000000000002',  4, $t$Submit Amendments on the AOA in platform SBC$t$,            null, 'sbc',    1, $t$Annual Confirmation$t$, null),
  ('a1000000-0000-4000-8000-000000000002',  5, $t$Get approval from MOC$t$,                                   null, 'moc',    1, $t$Annual Confirmation$t$, null),
  ('a1000000-0000-4000-8000-000000000002',  6, $t$Pay the fees to MOC$t$,                                     null, 'moc',    1, $t$Annual Confirmation$t$, null),
  ('a1000000-0000-4000-8000-000000000002',  7, $t$Advertising the Amendments Articles of Association$t$,      null, 'aamaly', 1, $t$Annual Confirmation$t$, null),
  ('a1000000-0000-4000-8000-000000000002',  8, $t$Receive the Amendment AOA$t$,                               null, null,     1, $t$Annual Confirmation$t$, null),
  ('a1000000-0000-4000-8000-000000000002',  9, $t$Receive a Commercial Register$t$,                           null, 'moc',    1, $t$Annual Confirmation$t$, null),

-- P3 block 1 — HCP page 14. Two sub-diagrams on one slide: a hexagon chain of
-- five government-platform compliances (GRO) and a three-segment wheel (HRO).
-- The wheel segments each carry a heading and a caption in separate text boxes;
-- both lines are kept, separated by a newline, so nothing is lost. The wheel is
-- a cycle with no numbered start -- order below is clockwise from the top-right
-- segment and is NOT asserted to be the intended sequence (see README).
  ('a1000000-0000-4000-8000-000000000003',  1, $t$active company file in HRSD.$t$,            null, 'hrsd',   1, $t$Compliances with Government regulations in Saudi Arabia for GRO&HRO:$t$, $t$The scope of work is the management of  Compliances with Government and delivering into the following steps (implemented in the following steps):$t$),
  ('a1000000-0000-4000-8000-000000000003',  2, $t$Compliance in QIWA Platform$t$,             null, 'qiwa',   1, $t$Compliances with Government regulations in Saudi Arabia for GRO&HRO:$t$, null),
  ('a1000000-0000-4000-8000-000000000003',  3, $t$active file for company in GOSI.$t$,        null, 'gosi',   1, $t$Compliances with Government regulations in Saudi Arabia for GRO&HRO:$t$, null),
  ('a1000000-0000-4000-8000-000000000003',  4, $t$Payroll submission in MUDAD a platform$t$,  null, null,     1, $t$Compliances with Government regulations in Saudi Arabia for GRO&HRO:$t$, null),
  ('a1000000-0000-4000-8000-000000000003',  5, $t$compliance in MUQEEM platform$t$,           null, 'muqeem', 1, $t$Compliances with Government regulations in Saudi Arabia for GRO&HRO:$t$, null),
  ('a1000000-0000-4000-8000-000000000003',  6, $t$Personal
Organizing relationships with employees$t$,                                              null, null,     1, $t$Compliances with Government regulations in Saudi Arabia for GRO&HRO:$t$, null),
  ('a1000000-0000-4000-8000-000000000003',  7, $t$Sponsorship and Transfer the Sponsorship
Employee registration$t$,                                                                null, null,     1, $t$Compliances with Government regulations in Saudi Arabia for GRO&HRO:$t$, null),
  ('a1000000-0000-4000-8000-000000000003',  8, $t$Issuing working visas and Business visas
Support and Issuing$t$,                                                                  null, null,     1, $t$Compliances with Government regulations in Saudi Arabia for GRO&HRO:$t$, null),

-- P3 block 2 — HCP page 15. An unnumbered funnel/Venn of three circles; ordered
-- top to bottom because the source gives no sequence.
  ('a1000000-0000-4000-8000-000000000003',  9, $t$Saudi Address$t$,     null, null, 2, $t$National Address and office services:$t$, $t$We provide National Address and Offices Services, a professional subscription that covers the registration, activation, and ongoing management of your company’s National Address along with associated office-related solutions. This ensures full government compliance, enhances delivery accuracy and efficiency, saves time by managing all registrations and updates, prevents fines or service interruptions, and includes continuous expert support with official documentation.$t$),
  ('a1000000-0000-4000-8000-000000000003', 10, $t$Receive Documents$t$, null, null, 2, $t$National Address and office services:$t$, null),
  ('a1000000-0000-4000-8000-000000000003', 11, $t$Send Documents$t$,    null, null, 2, $t$National Address and office services:$t$, null)
on conflict (service_id, ordinal) do update set
  label                 = excluded.label,
  default_duration_days = excluded.default_duration_days,
  agency                = excluded.agency,
  block_ordinal         = excluded.block_ordinal,
  block_title           = excluded.block_title,
  block_intro           = excluded.block_intro;

-- ================================================================ rate_card
--
-- P1 Havenstone, slide 24, the "Taajeel Fees (Additional & Optional)" grid,
-- verified against build/renders/taajeel_master/24.png. Badges 1 and 2 on that
-- slide are the engagement fee itself (40,000 + VAT 6,000) and are NOT rate-card
-- items -- a headline fee is typed per proposal and has no default. The grid is
-- badges 3..12, reproduced here with the source numbering in `ordinal`.
--
-- Amounts are SAR. The template draws the riyal glyph, so no currency is stored.

insert into public.rate_card (id, ordinal, label, amount, unit, active)
values
  ('c1000000-0000-4000-8000-000000000003',  3, $t$Open Bank Account:$t$,                   $t$4,500$t$,  $t$Per Bank$t$,                                 true),
  ('c1000000-0000-4000-8000-000000000004',  4, $t$Address and office services:$t$,         $t$2,500$t$,  $t$Monthly subscriptions$t$,                    true),
  ('c1000000-0000-4000-8000-000000000005',  5, $t$HRO&GRO Operations:$t$,                  $t$4,800$t$,  $t$Monthly subscriptions$t$,                    true),
  ('c1000000-0000-4000-8000-000000000006',  6, $t$Structure the Policies & procedures:$t$, $t$9,600$t$,  $t$Per subject$t$,                              true),
  ('c1000000-0000-4000-8000-000000000007',  7, $t$Recruitment Services:$t$,                $t$1$t$,      $t$Month Salary Per Employee$t$,                true),
  ('c1000000-0000-4000-8000-000000000008',  8, $t$Registration of Trademark:$t$,           $t$18,000$t$, $t$Per Trademark or Registering Category$t$,    true),
  ('c1000000-0000-4000-8000-000000000009',  9, $t$Issuance activity License:$t$,           $t$15,000$t$, $t$Per License$t$,                              true),
  ('c1000000-0000-4000-8000-000000000010', 10, $t$Translation:$t$,                         $t$150$t$,    $t$for every 250 words$t$,                      true),
  ('c1000000-0000-4000-8000-000000000011', 11, $t$Attestation:$t$,                         $t$850$t$,    $t$Per Document$t$,                             true),
  ('c1000000-0000-4000-8000-000000000012', 12, $t$Temporary General Manager:$t$,           $t$8,000$t$,  $t$For a period of three months, and if necessary to extend the period        4,000/ month$t$, true)
on conflict (id) do update set
  ordinal = excluded.ordinal,
  label   = excluded.label,
  amount  = excluded.amount,
  unit    = excluded.unit,
  active  = excluded.active;

-- ================================================================ boilerplate
--
-- Prose that already exists in a sent proposal. Every row is verbatim = true:
-- byte-for-byte, never reworded, reflowed or translated on the way into a deck.
-- Where the three proposals differ by so much as a capital letter, ONE variant
-- is stored, source_proposal names it, and README lists the others.

insert into public.boilerplate (key, body, style, source_proposal, verbatim) values

  ('about_taajeel.narrative',
   $t$Taajeel stands as a beacon of excellence in the business solutions landscape, seamlessly merging innovation with expertise to empower organizations to reach their full potential. Rooted in a commitment to unparalleled quality, we provide comprehensive management consulting, administrative optimization, and strategic insights that drive success. At Taajeel, our mission transcends delivering services—we aspire to transform challenges into opportunities, fostering growth, resilience, and sustainable excellence for our clients in an ever-evolving Saudi market.$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('about_taajeel.logo_heading',
   $t$The Inspiration Behind Taajeel's Logo$t$,
   'subhead', 'P1, P2, P3 (identical)', true),

  ('about_taajeel.logo_intro',
   $t$The Taajeel logo draws inspiration from elements deeply rooted in Saudi culture and values, reflecting the essence of the company's mission and vision:$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('about_taajeel.logo_book',
   $t$A symbol of clarity, knowledge dissemination, and transparency, the book reflects Taajeel’s commitment to empowering clients through clear communication, shared insights, and expertise that drive their growth and success.$t$,
   'small', 'P1, P2, P3 (identical)', true),

  ('about_taajeel.logo_falcon',
   $t$A powerful cultural symbol in Saudi Arabia, the falcon represents speed, precision, and excellence. This aligns seamlessly with Taajeel's promise of swift execution and outstanding performance, embodying the agility and cultural connection at the heart of its client relationships.$t$,
   'small', 'P1, P2, P3 (identical)', true),

  ('about_taajeel.logo_open_hands',
   $t$Representing hospitality and care, the open hands symbolize Taajeel's welcoming approach and its dedication to nurturing and supporting clients, ensuring a sense of trust and partnership in every interaction.$t$,
   'small', 'P1, P2, P3 (identical)', true),

  ('about_taajeel.logo_closing',
   $t$Each element of the logo is thoughtfully designed to embody Taajeel's core values while emphasizing its unique identity as a leader in the consulting and professional services landscape.$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('about_taajeel.mission',
   $t$At Taajeel, our mission is to become the preferred partner for businesses in the fields of consulting and professional services. We aim to deliver high-quality solutions tailored to meet our clients’ needs and support them in achieving their objectives.$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('about_taajeel.vision',
   $t$To be a pioneer in consulting and professional services by offering innovative solutions that address client needs and contribute to the economic development of Saudi Arabia.$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('about_taajeel.strategy_intro',
   $t$Our strategy is built on three key pillars:$t$,
   'subhead', 'P1, P2, P3 (identical)', true),

  -- All three decks carry this sentence with a DIFFERENT pronoun. P1 is stored.
  ('about_taajeel.adding_value',
   $t$By choosing Taajeel, You are partnering with a leader dedicated to delivering results-driven solutions that align with your goals, backed by a proven track record of success and a commitment to innovation and excellence.$t$,
   'body', 'P1 Havenstone (P2 reads "the are partnering", P3 reads "you are partnering")', true),

  ('brand.tagline_en',
   $t$We accelerate your steps to build your company,,,$t$,
   'emphasis', 'P1, P2, P3 (identical)', true),

  ('brand.tagline_ar',
   $t$نعجل خطوتك، لتبني منظومتك،،،$t$,
   'emphasis', 'P1 Havenstone (same string in P2 and P3)', true),

  -- The letter opening. The compiler splits this across runs and inserts the
  -- Arabic brand run; services.service_description supplies the tail.
  ('letter.opening',
   $t$We would like to thank you for your trust in taajeel | تعجيل$t$,
   'body', 'P1 Havenstone (P2 and P3 title-case it: "We Would Like To Thank You For Your Trust In Taajeel")', true),

  ('letter.accordingly',
   $t$Accordingly, attached to Your Excellency in the Proposal of this scope of work, Project Timeline.$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('letter.close',
   $t$Truly yours,,,$t$,
   'body', 'P2 FlyAkeed; P3 HCP (not present as live text in P1)', true),

  ('letter.close_entity',
   $t$Taajeel Business Solutions LLC$t$,
   'body', 'P2 FlyAkeed; P3 HCP (not present as live text in P1)', true),

  ('signoff.body',
   $t$We hope our Proposal is satisfactory and meets your requirements in overall for the Assignment. This document constitutes an “Engagement Letter” for the Assignment presented, thus, kindly sign off and affix your official stamp.$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('signoff.closing',
   $t$Yours faithfully,
Taajeel Team,$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('signoff.entity',
   $t$Taajeel Business Solutions Co L.L.C.$t$,
   'body', 'P1 Havenstone (P2 and P3 read "Taajeel Business Solutions Co LLC")', true),

  ('signoff.signatory_name',
   $t$Muath Abdullah A AlZahrani$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('signoff.signatory_title',
   $t$General Manager$t$,
   'body', 'P1, P2, P3 (identical)', true),

  ('fees.note.non_refundable',
   $t$Payments to be made are non-refundable and payable upon signing the contract.$t$,
   'small', 'P1, P2, P3 (identical)', true),

  ('fees.note.invoicing',
   $t$We will issue the invoices based on the maturity date payments as described in the above method of payment.$t$,
   'small', 'P1, P2, P3 (identical)', true),

  ('fees.note.vat',
   $t$VAT will be charged (15%) of the total fees paid by the Client to obtain the Value Added Tax (VAT) issued by Zakat, Tax, and Customs Authority “ZATCA”.$t$,
   'small', 'P1, P2, P3 (identical)', true),

  ('fees.note.maturity_five_days',
   $t$Payments paid within five days of the maturity date.$t$,
   'small', 'P1 Havenstone; P2 FlyAkeed (P3 reads "Payments Should paid within five days of the maturity date.")', true),

  ('fees.note.gov_fees_excluded',
   $t$Government Fees are not included in Taajeel fees.$t$,
   'small', 'P2 FlyAkeed', true),

  ('fees.note.gov_fees_excluded_with_slide',
   $t$Government Fees are not included in Taajeel fees, Government Fees page attached in separate slide.$t$,
   'small', 'P1 Havenstone', true)

on conflict (key) do update set
  body            = excluded.body,
  style           = excluded.style,
  source_proposal = excluded.source_proposal,
  verbatim        = excluded.verbatim;

commit;
