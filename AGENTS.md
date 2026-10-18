# AGENTS.md

## Repo state
- Repo on `main`; check `git log` and the working tree at session start — history may be empty or in early phases.
- Confirmed stack: vanilla **HTML + CSS + JavaScript (ES modules)**. No React, TypeScript, or build step in phase 1.
- Project master plan, phases, data model, and conventions: `PLANO.md`. The plan was approved on 18/10/2026; follow its phase order.
- Development environment: Windows + VS Code; Node.js v24 and npm working; Python 3.15 installed. Use the `py` launcher for Python — plain `python` is the Microsoft Store alias stub and does not work. The app runs via a local HTTP server (ES modules do not work over `file://`).
- Zero budget for paid tools: never propose paid services, APIs, or subscriptions.
- Development uses fictional data only; never commit real personal or financial data.

## Working with the maintainer
- Communicate in **Brazilian Portuguese (pt-BR)** in all responses, summaries, and questions.
- Code in Portuguese: variables, functions, comments, and explanations; keep tool-required technical names in English.
- The maintainer is learning to program: explain the goal before work, present a plan before changing files, implement one feature at a time, explain the code and decisions, give manual test steps, fix errors.
- Git: suggest small descriptive commits, show the exact commands, and wait for explicit authorization before running any commit.
- No frameworks or additional services without first explaining why they are needed.
- Mobile access is a future goal (not early phases); keep the architecture ready for it.
