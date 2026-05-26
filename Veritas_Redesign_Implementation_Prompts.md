# Veritas AI — Redesign Implementation Prompt Pack

## Recommended execution strategy

Do **not** build a separate throwaway HTML landing page first. You already have a Next.js application and a backend workflow. The fastest route to a coherent product is:

1. Put `DESIGN.md` in the repository root.
2. Ask the coding agent to inspect the existing frontend and produce a route/component migration plan.
3. Implement the design foundation and application shell first.
4. Rebuild the product workflow screen-by-screen using real navigation and existing API boundaries.
5. Generate the marketing landing page after the app shell is visually stable, so the preview shown on the landing page matches the actual product.

Run one prompt at a time. Review the UI after each phase before moving on.

---

## Global instruction to prepend to every coding-agent prompt

Read `/DESIGN.md` in full before changing any UI. Treat its YAML tokens and visual rules as mandatory. Use the first two supplied Kintsugi-style screenshots only as the visual direction: light surfaces, fine borders, soft sky-blue depth, structured dashboard layout, high whitespace discipline. Reject the old dark neon/cyber language in all new student-facing UI.

Keep the existing Next.js + TypeScript structure and existing backend API boundaries unless this prompt explicitly says otherwise. Do not invent successful API states, real sources, verified citations, DOI records, or user accounts. Label any seed content as demo data. Work in reusable components and keep the application runnable after each phase.

After implementation, report:
- Files created or modified.
- Routes that can be tested.
- Any data/API assumptions.
- Any remaining old UI still requiring migration.

---

## Prompt 00 — Audit and migration plan only

You are redesigning Veritas AI, an evidence-first Socratic thesis mentor. Do a read-only inspection of the current frontend and backend interface surface.

Tasks:
1. Inspect `frontend/src/app`, shared components, styling files, package dependencies, routes, and API calls.
2. Identify where the current dark theme, Outfit font, login/setup/loading/workspace screens, and user-facing “Shadow Thesis / swarm / verified DOI” labels are implemented.
3. Map current functionality to this new workflow:
   `Start project → Define question → Discover sources → Understand sources → Evidence map → Draft → Audit → Export`.
4. Propose the exact component tree and route migration plan.
5. Identify anything that should remain backend-internal rather than appear in UI.

Do not modify code yet. Deliver a concise implementation plan and the order of files you will update.

Acceptance criteria:
- No code changes.
- Every current screen has a proposed redesigned destination.
- API dependencies and risks are identified before styling begins.

---

## Prompt 01 — Design foundation and reusable UI primitives

Implement the Veritas Daylight foundation from `DESIGN.md`.

Tasks:
1. Replace the default presentation with the light token system in `globals.css` using CSS variables.
2. Replace Outfit with Inter through the root Next.js layout.
3. Build reusable UI primitives using existing project conventions:
   - `Button` variants: primary, accent, secondary, tertiary
   - `Panel`
   - `Badge` states: source-linked, needs-review, evidence-gap, neutral
   - `TextField`, `TextArea`, and `SelectField`
   - `ProgressStepper`
   - `EmptyState`
   - `LoadingRows`
4. Build an `AppShell` with:
   - 248px desktop sidebar
   - flexible content area
   - optional 312px contextual inspector
   - mobile collapsible navigation behavior
5. Create a small internal `/design-preview` route, or a component preview section if routes are tightly constrained, showing every primitive and state.

Constraints:
- No page redesign beyond what is needed to prove the foundation.
- No cyan/purple gradient buttons.
- No unlabelled sample verification claims.
- Keyboard focus states and 44px targets are required.

Acceptance criteria:
- Light canvas and white panels closely match the supplied inspiration.
- Tokens are reused rather than repeated as arbitrary values.
- The foundation works at 1440px and 375px.

---

## Prompt 02 — Replace authentication, setup, and loading flow

Redesign the entry workflow using existing auth/project creation functionality.

Create or refactor:
1. `/sign-in`: bright, minimal sign-in page with product context and a simple card. Use “Continue to Veritas”; remove “Authentication Gate” and “Authorize Secure Port.”
2. `/app/projects/new`: guided four-step setup container with visible stepper: `Topic → Question → Sources → Workspace`.
3. Project setup fields: working title, subject area, initial research problem/question, deadline, citation style, preferred sources.
4. Loading/discovery behavior inside the project shell: staged loading rows and progressively appearing source candidates. Remove fullscreen dark spinner/loading screen.
5. Replace all visible “Shadow Thesis” terminology with “Evidence Map” or “Literature Search.” Backend filenames do not need to change.

Use demo data only when visibly labelled `Demo` or `Sample source`.

Acceptance criteria:
- The user never enters a cyber/security-themed screen.
- The transition from project creation into literature review feels continuous.
- Errors and empty results have clear next actions.

---

## Prompt 03 — Research home and project overview dashboard

Build the main dashboard aligned with the second inspiration screenshot.

Create/refactor:
1. `/app`: Research Home with recent projects, reading queue, and next actions.
2. `/app/projects/[projectId]`: Project Overview showing:
   - project title and research question
   - workflow stepper
   - source coverage summary
   - recent drafts/sections
   - mentor’s next question
   - outstanding evidence tasks
3. Sidebar groups: Home, Projects, Library, Reports, Settings.
4. Context inspector panel: deadline, citation style, source count, latest activity and pinned tasks.
5. Selected project cards use a soft pale-blue state; all other cards remain white with fine borders.

Acceptance criteria:
- Layout uses a three-column desktop shell and sensible tablet/mobile collapse.
- Dashboard density and visual hierarchy are comparable to the clean reference dashboard.
- No fake verification or invented citation records appear in the UI.

---

## Prompt 04 — Literature library and evidence map

Build the research intelligence surfaces.

Create/refactor:
1. `/app/projects/[projectId]/library`:
   - table/list of source results
   - search and filter controls
   - reading status
   - paper metadata
   - side inspector for abstract/notes/citation details
2. `/app/projects/[projectId]/evidence`:
   - claim-to-source evidence table
   - columns: Claim, Support, Counter-evidence, Coverage, Next action
   - expandable source links and note drawer
3. Use only these student-facing statuses:
   - `Source linked`
   - `Needs review`
   - `Evidence gap`
   - `Citation missing`
4. Create empty, loading, populated, and error examples with clearly labelled demo data until APIs are connected.

Acceptance criteria:
- Every evidence status has a visible explanation and source action.
- No numeric “AI confidence” substitutes for inspectable source coverage.
- Sources and claims feel connected to the upcoming writing experience.

---

## Prompt 05 — Writing Studio and Socratic Mentor

Redesign the current workspace as the central Veritas product experience.

Create/refactor `/app/projects/[projectId]/draft` with:
1. Left outline rail for chapters and section completion.
2. Center editor with section goal, writing canvas, highlighted claims, and citation controls.
3. Right switchable panel: `Mentor` and `Evidence`.
4. Mentor response format:
   - Question
   - Why this matters
   - Sources to inspect
   - Next action
5. Evidence panel shows linked sources and evidence gaps related to the active paragraph.
6. Actions: `Insert citation`, `Link source`, `Run section audit`, `Save draft`.

Replace:
- “Advisor Feedback” with `Review tasks`.
- “Indexed Literature Shelf” with `Connected sources`.
- “Socratic fact-verification gating” with `Claim review`.
- “Submit Section for Audit” with `Run section audit`.
- Mock DOI labels with real source links or visibly labelled sample citations only.

Acceptance criteria:
- The editor is the visual center of gravity.
- Mentor does not look like a generic chat messenger.
- A student can understand how a claim is connected to a source without leaving the screen.

---

## Prompt 06 — Audit, export, and landing page

Finish the redesigned MVP surface.

Create/refactor:
1. `/app/projects/[projectId]/audit`:
   - grouped issues for unsupported claims, citation gaps, counter-evidence and clarity
   - resolve/review actions
   - source drawer
2. `/app/projects/[projectId]/export`:
   - citation style and bibliography preview
   - export format options
   - provenance/review checklist
3. `/` landing page:
   - headline: `Research with proof. Write with confidence.`
   - product preview based on the real redesigned workspace components
   - workflow/features/integrity/report preview/testimonial/footer sections
   - thin navigation with a compact primary CTA

Acceptance criteria:
- Landing preview matches the actual in-app UI, not a separate visual fiction.
- Export/audit screens never overclaim AI verification.
- Light premium presentation remains consistent across marketing and app routes.

---

## Prompt 07 — Quality, accessibility, and responsiveness pass

Run a final product-quality review and correct all issues.

Tasks:
1. Review every redesigned route at 1440px, 1024px, 768px, and 375px.
2. Check focus visibility, keyboard navigation, control sizes, empty states, error states, loading states, and reduced motion.
3. Search the frontend for forbidden/retired phrases:
   - `Authentication Gate`
   - `Authorize Secure Port`
   - `Initialize Shadow Thesis`
   - `Compiling Shadow Thesis`
   - `multi-agent swarm`
   - `ground-truth`
   - `verified DOI`
   - `DOIs gate`
4. Remove unapproved gradient/glow styles and inconsistent spacing.
5. Confirm that all visible citation/source claims are real or explicitly labelled sample/demo data.
6. Produce a final route-by-route screenshot checklist and list of remaining functional integrations.

Acceptance criteria:
- The product feels like one calm, premium research workspace.
- No old dark-neon product language remains in the default experience.
- The UI is usable on desktop and mobile.
- All claims of evidence status are transparent and inspectable.

---

## Optional Stitch visual exploration prompt

Use this only to generate visual alternatives before coding, not as a substitute for implementation:

Design a high-fidelity multi-screen web application for **Veritas AI**, an evidence-first Socratic research and thesis mentor. Follow the attached `DESIGN.md` exactly. The visual direction is light, premium, and structured: white card surfaces, cool near-white canvas, hairline borders, subtle sky-blue ambient illumination, precise Inter typography, restrained blue accent, and spacious Kintsugi-inspired dashboard composition. Do not use dark mode, neon gradients, glassmorphism, cyber terminology, AI swarms, fictional verification badges, or fake DOI data.

Generate these seven desktop screens at 1440px with coherent shared components:
1. Landing page with hero product preview.
2. Sign-in page.
3. New research project setup with stepper.
4. Project overview dashboard with sidebar and inspector.
5. Literature library with source inspector.
6. Writing studio with outline, editor, and Mentor/Evidence panel.
7. Claim audit and export view.

Visible product language must use: Evidence Map, Literature Search, Source linked, Needs review, Evidence gap, Run section audit, Research with proof. Write with confidence.
