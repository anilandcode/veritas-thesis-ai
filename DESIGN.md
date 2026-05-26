---
version: alpha
name: Veritas Daylight
description: Evidence-first Socratic research workspace with a calm, premium, light interface for long-form academic work.
colors:
  primary: "#101828"
  primary-soft: "#344054"
  accent: "#2563EB"
  accent-hover: "#1D4ED8"
  accent-soft: "#EAF2FF"
  canvas: "#F6F8FC"
  surface: "#FFFFFF"
  surface-subtle: "#F8FAFC"
  surface-blue: "#F3F7FF"
  border: "#E4E7EC"
  border-strong: "#D0D5DD"
  text-primary: "#101828"
  text-secondary: "#475467"
  text-tertiary: "#667085"
  text-muted: "#667085"
  success: "#067647"
  success-soft: "#ECFDF3"
  warning: "#B54708"
  warning-soft: "#FFFAEB"
  danger: "#B42318"
  danger-soft: "#FEF3F2"
  focus: "#84CAFF"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.05em
  display-sm:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: -0.045em
  heading-1:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.04em
  heading-2:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.035em
  heading-3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.025em
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: -0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0.01em
  metadata:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0.02em
rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
  16: 64px
  20: 80px
  page-max: 1280px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  navigation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
  navigation-selected:
    backgroundColor: "{colors.surface-blue}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 12px
  app-canvas:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    padding: 24px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 20px
  panel-subtle:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 20px
  information-callout:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 16px
  source-confirmed:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 8px
  source-review:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 8px
  evidence-gap:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 8px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  metadata-muted:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.metadata}"
    rounded: "{rounded.xs}"
    padding: 4px
  metadata-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-tertiary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: 4px
  divider:
    backgroundColor: "{colors.border}"
    rounded: "{rounded.xs}"
    height: 1px
  focus-ring:
    backgroundColor: "{colors.focus}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 4px
  accent-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  border-strong:
    backgroundColor: "{colors.border-strong}"
    textColor: "{colors.primary-soft}"
    typography: "{typography.metadata}"
    rounded: "{rounded.sm}"
    padding: 1px
---

# Veritas AI — Daylight Research Workspace

## Overview

### Design intent

Veritas AI is a Socratic research and thesis mentor. Its redesigned interface must feel like a calm, premium academic workspace: precise, transparent, breathable, and quietly intelligent. It should not feel like a cyber-security console, an autonomous-agent control room, or an AI writing shortcut.

The target visual language is derived from the two supplied inspiration screens: clean white surfaces, generous whitespace, soft daylight-blue ambient backgrounds, thin borders, carefully proportioned cards, a restrained single blue accent, and a highly structured product workspace. The product should feel trustworthy before it says it is trustworthy.

**Brand line:** Research with proof. Write with confidence.

**Core product promise:** Veritas helps students build a defensible argument by linking every important claim to literature, exposing evidence gaps, and using Socratic questions to improve reasoning.

### Redesign decision

The current screens use a nearly black canvas, fluorescent cyan-to-purple actions, “Authentication Gate,” “Initialize Shadow Thesis,” “multi-agent swarm,” and high-confidence verification language. This makes the tool appear technical and dramatic but not academically calm or credible.

The new system is **Daylight-first**:

- Replace dark-neon presentation with an airy, paper-like workspace and soft blue depth.
- Replace secretive/agent-heavy labels with transparent research language.
- Keep the intelligence in the workflow, not in intimidating terminology.
- Use badges only for states the system can prove, such as “Source linked,” “Needs review,” or “Evidence gap.”
- Reserve dark mode for a later optional theme, not the MVP default.

### Experience principles

1. **Evidence before assertion.** The interface never presents a claim as verified without a traceable source record.
2. **Mentor, not ghostwriter.** The AI asks clarifying questions, maps reasoning, checks claims, and suggests revision paths; it does not impersonate student authorship.
3. **Progress is visible.** Users always know what stage they are in, what is complete, and what needs attention.
4. **Reading and writing stay connected.** Sources, notes, claims, and the draft are linked without forcing users through separate disconnected tools.
5. **Quiet confidence.** White space, readable typography, careful borders, and restrained blue highlights replace spectacle.

### Product information architecture

#### Public experience

- **Landing page:** value proposition, product preview, workflow explanation, integrity promise, testimonial/proof area, final call-to-action.
- **Sign in / create account:** a minimal light card with SSO and email entry. No “authorization gate” terminology.

#### Authenticated experience

- **Research Home:** recent projects, new thesis button, reading queue, upcoming tasks, last mentor activity.
- **Project Overview:** thesis question, stage progress, source count, evidence status, recent writing sections, suggested next task.
- **Question Builder:** topic narrowing, problem statement, research question, method/scope decisions.
- **Library:** discovered papers, uploaded PDFs, reading status, tags, source inspector, citation metadata.
- **Evidence Map:** claims, supporting/contradicting evidence, gaps, source links, confidence based on coverage rather than fictional scores.
- **Writing Studio:** section outline, editor, connected sources, Socratic mentor, claim audit.
- **Audit & Export:** unsupported claims, citation completeness, revision checklist, bibliography export, document export.

### Core research workflow

The complete workflow replaces the current “login → initialize shadow thesis → compile → chat” sequence.

| Stage | User goal | Veritas action | Primary screen | Completion signal |
| --- | --- | --- | --- | --- |
| 1. Start | Create a research workspace | Capture degree, topic, deadline, citation style | New Project | Project created |
| 2. Define | Form a focused question | Socratic narrowing prompts and scope checks | Question Builder | Approved research question |
| 3. Discover | Locate relevant literature | Search/import sources with transparent provenance | Library | Core sources selected |
| 4. Understand | Extract what literature actually says | Notes, findings, methodology, limitations | Source Inspector | Reading notes captured |
| 5. Map | Build an argument from evidence | Connect claims to support, contradiction, and gaps | Evidence Map | Core claims supported or flagged |
| 6. Draft | Write student-authored sections | Inline source panel and mentor questions | Writing Studio | Section submitted for audit |
| 7. Audit | Test the draft | Detect unsupported claims and missing citations | Audit & Export | Issues resolved or acknowledged |
| 8. Export | Deliver work | Bibliography/document export and provenance log | Export | Downloaded submission package |

### Routing model

Use routes that communicate the workflow explicitly:

- `/` — marketing landing page.
- `/sign-in` — authentication.
- `/app` — research home.
- `/app/projects/new` — new research project.
- `/app/projects/[projectId]` — project overview.
- `/app/projects/[projectId]/question` — question builder.
- `/app/projects/[projectId]/library` — literature library.
- `/app/projects/[projectId]/evidence` — evidence map.
- `/app/projects/[projectId]/draft` — writing studio.
- `/app/projects/[projectId]/audit` — claim/citation audit.
- `/app/projects/[projectId]/export` — export and submission package.

### Recommended screen redesigns

#### 1. Landing page

Match the composition quality of the supplied SaaS landing inspiration while making the product unmistakably academic.

- Slim navigation with Veritas mark, Product, How it works, Academic integrity, Pricing, Sign in, and a compact primary CTA.
- Centered hero:
  - Eyebrow: `Evidence-first thesis mentoring`
  - Headline: `Research with proof. Write with confidence.`
  - Supporting line: `Build a stronger thesis with connected literature, transparent evidence maps, and Socratic guidance.`
  - CTAs: `Start a research project` and `Explore the workflow`.
- Hero product preview: a light, slightly elevated workspace mockup with Library, Evidence Map, and Draft panels.
- Lower sections: three-step workflow, writing/evidence feature cards, integrity section, sample report preview, testimonials, footer.
- Use soft sky-blue radial illumination behind the hero preview only; the rest is clean white.

#### 2. Sign-in and onboarding

Do not begin the product journey with a centered dark login modal.

- Full-height light canvas with a subtle blue gradient at top.
- Left column: one sentence of product positioning and a minimal product preview.
- Right column: clean sign-in card.
- Labels: `Continue to Veritas`, `Academic or personal email`, `Continue with Google`, `Continue with email`.
- After sign-in, show a guided New Project page rather than a second isolated authentication-looking card.

#### 3. New research project

Replace “Initialize Shadow Thesis” with a real research setup experience.

- Title: `Start a research project`.
- A four-step horizontal progress indicator: `Topic → Question → Sources → Workspace`.
- Fields:
  - Working title
  - Subject area / degree level
  - Research problem or initial question
  - Deadline, citation style, preferred source databases
- CTA: `Create project and refine question`.
- Supporting note: `Veritas will suggest literature after you confirm your research question.`

#### 4. Source discovery state

Remove the black, empty loading screen and orbital animation.

- Keep the user inside the new project shell.
- Display staged progress rows:
  - Preparing search terms
  - Searching selected databases
  - Importing metadata
  - Ready for source review
- As sources arrive, list them progressively with title, year, journal/database, abstract excerpt, and `Review source` action.
- Never say `verified`, `ground truth`, or provide a confidence number before the user has inspectable sources.

#### 5. Research home and project overview

Adopt the clean dashboard layout from the second supplied inspiration image.

- Left navigation at 240–256px: Home, Projects, Library, Templates, Reports, Settings.
- Main canvas: project title, progress stepper, focus card, recent sources, writing sections.
- Right inspector at 300–320px: deadline, citation style, source coverage, tasks, latest mentor question.
- Project cards are white on a near-white canvas with fine borders and 16px radii; selected cards receive pale-blue fill, not glow.

#### 6. Writing studio

This is the primary product screen.

- Left rail: thesis outline and completion indicators; optional collapse.
- Center: calm document editor with section objective, draft body, inline claim highlights, citation inserts.
- Right rail: switchable `Mentor` and `Evidence` tabs.
  - Mentor asks one useful question at a time.
  - Evidence displays linked source cards and gap warnings relevant to the current paragraph.
- Below the editor or inside right panel: `Run section audit`, not `Submit Section for Audit`.
- Empty-editor prompt: `Begin your introduction: what problem does your research address, and why does it matter?`

#### 7. Evidence map and audit report

- Evidence Map uses a structured table/board, not cyber-security badges.
- Columns: Claim, Support, Counter-evidence, Coverage, Next action.
- Evidence states:
  - `Source linked` — green, only when a source is attached.
  - `Needs review` — amber, when extraction or interpretation needs user confirmation.
  - `Evidence gap` — red, when a claim is unsupported.
- Audit page presents issues as a professional review checklist with a source drawer and revision actions.

### Product language rules

Use academic, user-centered language:

| Avoid | Use instead |
| --- | --- |
| Shadow Thesis | Evidence Map, Research Reference Model, or Evidence Brief |
| Authentication Gate | Sign in |
| Authorize Secure Port | Continue |
| Initialize Shadow Thesis | Create research project |
| Compiling Shadow Thesis | Finding relevant literature |
| Multi-agent swarm | Veritas is searching selected sources |
| Ground-truth literature | Selected literature / source-backed evidence |
| Verified citation | Source linked / citation metadata found |
| Confidence: 2 DOIs | Supported by 2 linked sources |
| Blocked | Evidence needed |

Use “Evidence Map” in visible UI. “Shadow Engine” may remain an internal backend/service name only.

## Colors

### Palette direction

The system uses a daylight-neutral canvas and one functional blue accent. The interface should be mostly white and ink; blue is reserved for actions, selected states, links, focus rings, and gentle hero illumination. Avoid decorative neon gradients inside product screens.

- **Primary Ink (`#101828`):** navigation emphasis, headings, primary dark action.
- **Accent Blue (`#2563EB`):** active links, selected state, progress, primary highlighted actions.
- **Canvas (`#F6F8FC`):** page background; cool, near-white, not gray-heavy.
- **Surface (`#FFFFFF`):** panels, cards, editor pages.
- **Border (`#E4E7EC`):** thin structural separation.
- **Secondary text (`#475467`):** body/supporting text.
- **Muted text (`#667085`):** placeholders and disabled metadata only.
- **Semantic colors:** success, warning, and danger are functional evidence/audit statuses; never decorative.

### Usage limits

- No cyan/purple gradient buttons in the product workspace.
- No black full-screen backgrounds in the default theme.
- Blue illumination can appear in the landing hero and selected project preview only, at low opacity.
- Status color must always appear with text and an icon; never rely on color alone.

## Typography

### Font family

Use **Inter** throughout the MVP. It is neutral, precise, highly readable at small UI sizes, and fits the supplied reference style. Remove Outfit from the new interface to avoid the rounded, promotional character of the current product.

Implementation: use `next/font/google` with weights `400`, `500`, and `600`. Avoid 700 except for the wordmark if needed.

### Hierarchy rules

- Landing hero: `display-lg`, never exceed two lines on desktop.
- Product page title: `heading-2` or `heading-1`; do not use oversized marketing typography inside the app.
- Card titles: `title-sm`; supporting metadata uses `body-sm` or `metadata`.
- Body copy: use `body-md` for UI and `body-lg` for long-form guidance/editor content.
- Buttons and navigation: `label-md`.
- Labels should be sentence case. Do not use long uppercase technical headings.
- Academic drafting text should have a maximum comfortable measure of `68ch–76ch`.

## Layout & Spacing

### Responsive baseline

Design for a **1440px desktop reference viewport** and a **375px mobile reference viewport**.

### Grid

- Marketing maximum content width: `1200px`; hero preview may extend to `1280px`.
- App shell: full width with `24px` exterior inset on desktop.
- Dashboard shell: `248px` navigation / flexible main / `312px` inspector.
- Writing studio shell: `232px` outline / flexible editor (`min-width: 560px`) / `360px` Mentor/Evidence panel.
- Gutter between main panels: `16px`.
- Main card/panel padding: `20px–24px`.
- Marketing section vertical rhythm: `80px–112px`.
- App screen vertical rhythm: `24px–32px`.

### Breakpoints

- `>= 1280px`: three-panel workspace visible.
- `1024px–1279px`: inspector becomes a drawer; left navigation remains.
- `768px–1023px`: compact sidebar with icons and labels on expansion; editor prioritised.
- `< 768px`: one-column layout; navigation becomes bottom/tab drawer; mentor and evidence become full-screen sheets.

### Spacing behavior

Use the spacing tokens rather than arbitrary margins. Large empty areas should appear only in marketing pages; app screens should feel structured and useful rather than sparse.

## Elevation & Depth

The inspiration design uses almost-flat hierarchy. Follow it:

- Structural panels use `1px` borders rather than visible shadows.
- Primary floating preview cards may use one soft shadow: `0 16px 40px rgba(16, 24, 40, 0.06)`.
- Popovers/dialogs may use: `0 12px 32px rgba(16, 24, 40, 0.10)`.
- Hero background may use a pale blue radial wash; never simulate glowing neon.
- Editor remains a crisp white surface so reading feels like paper.

## Shapes

- Buttons and inputs: `10px` radius.
- Cards and panels: `16px` radius.
- Large hero preview container: `20px–24px` radius.
- Pills/status badges: full rounded.
- Avoid overly rounded chat bubbles, giant capsule controls, or sharp zero-radius cyber panels.
- Use fine 1px separators to structure sidebars, panels, rows, tables, and tabs.

## Components

### Brand and navigation

- **Wordmark:** compact Veritas `V` monogram in an ink rounded square or white square with ink mark. Avoid gradient-logo emphasis.
- **Top navigation:** 64px marketing header; minimal, evenly spaced, with one primary CTA.
- **App sidebar:** white surface, hairline border, active state in `surface-blue`, icons in neutral gray.

### Buttons

- **Primary dark:** for main conversion actions on marketing and final confirmations.
- **Accent blue:** for in-product next-step actions and selected workflow progression.
- **Secondary:** white fill with thin border.
- **Tertiary:** text button with hover background.
- One screen should rarely contain more than one visually dominant CTA.

### Inputs and forms

- Inputs are white with a light border, 44–48px height, readable labels above.
- Focus uses a blue ring with high contrast, not outer glow.
- Onboarding should use guided field groups and explanatory microcopy; do not present a security terminal style form.

### Cards and tables

- Source, project, and report cards are white surfaces with concise metadata.
- Use table rows for dense literature and claim lists; use cards only when a scan-friendly summary is valuable.
- A selected source row gains pale blue fill and a visible left accent or border.
- Every paper card should show title, authors, year, source/database, reading status, and citation action.

### Progress and status

- Project progress is a horizontal stepper on wider screens and stacked progress summary on mobile.
- Search/import operations use progressive rows with timestamps/status rather than a blocking fullscreen loader.
- Badge terminology must be traceable:
  - `Source linked`
  - `Needs review`
  - `Evidence gap`
  - `Draft ready for audit`
  - `Citation missing`

### Socratic mentor

- The Mentor panel is a structured assistant, not a general chat app.
- Use a small sequence of question cards, suggested actions, and references to highlighted paragraphs.
- Each mentor response should distinguish:
  - **Question**
  - **Why this matters**
  - **Sources to inspect**
  - **Next action**
- The mentor never displays invented authors, mock DOI values, or unsupported certainty.

### Evidence map

- Use a clean table, expandable rows, or column board for claim-to-source relationships.
- A source drawer opens with bibliographic information, relevant notes, and link/open actions.
- Coverage indicators reflect linked evidence status and user review, not arbitrary numerical confidence.

### Empty, loading, and error states

- Empty state: direct next step plus helpful explanation.
- Loading state: remain inside the current shell and show which source operation is running.
- Error state: state what failed and what the user can retry; preserve form/draft work.
- Never leave a user watching an unexplained central spinner on an otherwise empty page.

### Accessibility and interaction

- Minimum interactive target size: `44px`.
- Keyboard navigation and visible focus states are required for all major controls.
- All icon-only actions include accessible labels and tooltips.
- Text/background pairings must meet WCAG AA.
- Respect reduced motion: ambient hero motion and progress animation should become static.

### Implementation guidance for the existing Next.js frontend

- Keep the MVP in Next.js and TypeScript; apply this system through CSS variables in `globals.css`.
- Replace the existing Outfit font integration with Inter.
- Create reusable components before rebuilding screens:
  - `AppShell`
  - `MarketingHeader`
  - `SidebarNav`
  - `InspectorPanel`
  - `Panel`
  - `Button`
  - `Badge`
  - `TextField`
  - `ProgressStepper`
  - `SourceRow`
  - `ClaimAuditRow`
  - `MentorCard`
- Use mock data only if explicitly labelled as demo/sample in the UI.
- Do not change backend API contracts while performing the first visual redesign pass.
- Keep backend service names such as `shadow_engine.py` internal; expose “Evidence Map” and “Literature Search” terminology in the UI.

### Minimum redesigned screens for the first complete pass

1. Marketing landing page.
2. Sign-in page.
3. New research project flow.
4. Project overview dashboard.
5. Literature library with source inspector.
6. Writing studio with Mentor/Evidence panel.
7. Claim audit/export view.

## Do's and Don'ts

### Do

- Use the supplied light Kintsugi-style references as the visual quality bar: calm whitespace, clean grid, quiet blue accent, precise dashboard structure.
- Build the research workflow around inspectable sources and student decisions.
- Show progress and evidence states with honest terminology.
- Keep the writing surface prominent and distraction-free.
- Create a cohesive component system before implementing all routes.
- Test at 1440px and 375px in every significant iteration.

### Don't

- Do not reproduce the existing dark cyber dashboard as the default product identity.
- Do not use fluorescent gradients, extensive glassmorphism, glowing borders, or sci-fi loading experiences.
- Do not put backend/agent language in student-facing UI.
- Do not show mock DOI values or “verified” evidence without a real attached source.
- Do not turn the mentor into a generic chatbot or automatic thesis generator.
- Do not generate seven unrelated page styles; all screens must use the same tokens, spacing, and shell patterns.
