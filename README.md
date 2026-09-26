# rankedin

**Understand where you stand professionally, and decide what to do next.**

rankedin helps with the career questions people actually ask: *What should my next move be? Why isn't my job search working? Should I change careers? AI is changing my job — what now? How do I build a reputation in my field? How strong is my LinkedIn profile, and what should I improve?*

Some of those need no data at all. You get useful direction straight away. When you want answers about **you** specifically, rankedin works from your own LinkedIn data export, which you upload to your rankedin account yourself.

## What you can do with it

**Decide what to do next — no upload needed**

- Work out your next career move, and a concrete first step
- Fix a job search that isn't working, or decide where to start one
- Decide whether to stay in your field or change direction
- Respond to AI changing your role
- Build a professional reputation and become more visible in your industry
- Win more customers through your professional presence

rankedin uses what you tell it plus its four career paths — find a job, attract more customers, build your reputation, and pivot your career — to recommend a direction and a first step.

**Understand your own profile — with your LinkedIn data export**

- Your profile strength across eight areas, such as network, credibility and engagement
- Your strongest areas and your biggest gaps, and what to improve first
- How you compare with other rankedin users
- Your AI resilience score, and which of your skills AI is more or less likely to affect
- How strong your professional network is, and how it has changed between exports
- Which of your real strengths your resume should emphasize

With an analysis, the career-path recommendation also takes your own data into account. A guided, step-by-step version of each path is available on rankedin.app.

## How to use it

Install the plugin, then connect the **rankedin** connector from the plugin's Connectors tab and sign in (or create a free rankedin account). Then just ask, for example:

- "What should my next career move be?"
- "My job search isn't working."
- "AI is changing my job. What should I do?"
- "Analyze my LinkedIn profile."
- "How do I compare with people like me?"
- "What should I emphasize on my resume?"

For personal results, download your data from LinkedIn (Settings → Data privacy → Get a copy of your data) and upload the file at [rankedin.app](https://rankedin.app/dashboard/upload). Analysis usually takes a few minutes.

## What rankedin does not do

rankedin is not a resume writer, job board, interview coach or salary tool, and it does not assess promotion readiness. It never estimates a score it has not measured, and it never names individual people in your network. rankedin is not affiliated with or endorsed by LinkedIn; it analyzes the data export that LinkedIn provides to you.

## Data and privacy

This plugin contains two skills and a reference to one remote connector. It runs no code on your machine.

- The plugin's skills send requests only to the rankedin connector at `https://rankedin.app/api/mcp`, and only after you connect it and sign in to your rankedin account.
- Every connector tool is read-only. It reads the analysis stored in your own rankedin account and returns it to the conversation. Nothing is written, posted or sent anywhere else.
- rankedin has no live access to LinkedIn and never scrapes it. Personal results come only from the LinkedIn data export you choose to upload.

Privacy policy: [rankedin.app/privacy](https://rankedin.app/privacy) · Support: [rahul@rankedin.app](mailto:rahul@rankedin.app)

## For developers

- `skills/` — the two skills, written to the open [Agent Skills](https://agentskills.io/specification) format and free of platform-specific wording, so the same files can be reused on other AI platforms
- `.mcp.json` — the rankedin connector, the same endpoint as the rankedin listing in the connector directory
- `evals/` — routing, discovery, no-analysis and truthfulness evals for `claude plugin eval`, generated from `scripts/eval-spec.mjs`
- `scripts/check-skills.mjs` and `scripts/check-tool-contract.mjs` — CI checks for skill format, shared truthfulness rules, provider-neutral wording, and that every tool the skills name exists on the live server

License: MIT
