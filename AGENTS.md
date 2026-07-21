# AGENTS.md

## Project

This repository contains `Idea Flux`, a Nuxt-based MVP that generates three types of associations from one user-supplied idea.

Read `docs/spec.md` before making changes.

`docs/spec.md` is the source of truth for product behavior, API contracts, implementation phases, and completion criteria.

## Package manager

Use npm only.

Do not use pnpm, yarn, or bun.

Use the existing `package-lock.json`.

Do not delete or regenerate the lockfile unless required by a deliberate dependency change.

## General rules

- Inspect the repository before editing.
- Preserve existing user changes.
- Do not overwrite unrelated work.
- Keep implementation within the MVP scope.
- Prefer the simplest implementation that satisfies `docs/spec.md`.
- Keep frontend and server responsibilities separated.
- Use `shared/types/association.ts` as the shared contract when it exists.
- Do not change the public API contract without explicit user approval.
- Do not add a database, authentication system, or persistent session storage.
- Do not introduce ADK into the Idea Flux application unless explicitly requested.
- The directory structure in `docs/spec.md` is a target structure, not an absolute requirement.
- During the dummy API phase, files may be consolidated when responsibilities remain clear.
- Do not prioritize file splitting over working behavior.

## Parent-agent controlled files

Only the parent agent may edit:

```text
package.json
package-lock.json
nuxt.config.ts
shared/types/association.ts
AGENTS.md
docs/spec.md
Dockerfile
.dockerignore
.env.example
README.md
```

A subagent that needs one of these changed must report:

1. the requested change;
2. the reason;
3. the exact dependency or configuration involved.

## Frontend subagent scope

May edit only:

```text
app/app.vue
app/components/**
app/composables/**
app/assets/**
```

Must:

- implement the UI from `docs/spec.md`;
- call `POST /api/associations`;
- use shared API types;
- preserve current cards and history when regeneration fails;
- update history only after API success;
- support basic mobile and desktop layouts;
- keep Gemini details out of frontend code.

Must not:

- edit `server/**`;
- edit shared contracts;
- edit Nuxt configuration;
- install dependencies;
- access secrets;
- call Gemini from the browser;
- add `NUXT_PUBLIC_` secrets;
- change the API contract.

## Dummy API subagent scope

May edit only:

```text
server/api/**
server/services/**
```

Must:

- implement `POST /api/associations`;
- trim and validate the prompt;
- accept only documented request data;
- return exactly three items;
- return `direct`, `distant`, `alternative` in that order;
- guarantee the application-specific error response format;
- avoid Gemini integration during the dummy phase.

Must not:

- edit `app/**`;
- edit shared contracts;
- edit Nuxt configuration;
- install dependencies;
- change the API contract;
- expose stack traces or secrets;
- rely on the default Nitro error shape when it would violate the documented contract.

## Gemini subagent scope

May edit only:

```text
server/prompts/**
server/schemas/**
server/services/gemini-association.ts
server/api/associations.post.ts
```

Must:

- keep internal instructions on the server;
- separate internal instructions and user input;
- use structured output supported by the selected SDK;
- validate model output at runtime;
- create IDs on the server;
- return the shared `AssociationResponse`;
- map Gemini failures to the documented API error;
- keep the dummy provider working;
- enforce output length limits.

Must not:

- edit frontend files;
- hardcode or log an API key;
- expose model-native responses;
- put secrets in `runtimeConfig.public`;
- add secrets to source control;
- change the public API contract;
- require a specific validation library without parent-agent approval.

## Review subagent scope

Read-only unless the parent agent explicitly delegates a narrow fix.

Check:

- compliance with `docs/spec.md`;
- shared type usage;
- API contract consistency;
- history updates only after successful API responses;
- regeneration failure preserving current cards;
- secret exposure;
- frontend calls to Gemini;
- unnecessary complexity;
- build or type errors;
- accidental changes outside assigned scope.

Report findings with file paths and actionable recommendations.

## Parallel and sequential execution

Do not start parallel implementation until:

1. Nuxt is initialized;
2. dependencies are installed;
3. shared API types exist;
4. the API contract is stable.

Parallel work is allowed only for non-overlapping file scopes.

Do not allow two agents to edit the same file concurrently.

Subagents are optional, not mandatory.

If subagent functionality is unavailable, unstable, or would create overlapping edits, the parent agent must perform the same phases sequentially:

1. initialize and define shared contracts;
2. implement the dummy API;
3. implement the UI;
4. integrate;
5. review;
6. build.

The parent agent owns integration, conflict resolution, dependency changes, and final verification.

## State model

Use these application statuses:

```ts
type AppStatus =
  | 'idle'
  | 'loading'
  | 'showing-results'
  | 'confirming'
```

Do not add `error` as an exclusive application status.

Manage errors separately, for example:

```ts
const errorMessage = ref('')
```

This allows the application to keep showing the current cards after a failed regeneration.

## Error response contract

The API must return the documented application-specific error shape:

```json
{
  "error": {
    "code": "INVALID_PROMPT",
    "message": "入力内容を確認してください。"
  }
}
```

Do not assume Nitro's default error serialization matches this contract.

Use an explicit response strategy that preserves the required HTTP status and JSON body.

Never expose stack traces, provider-native errors, internal prompts, or secrets.

## Secret handling

Never read aloud, print, copy, commit, or expose secret values.

Secrets include:

```text
.env
.env.*
NUXT_GEMINI_API_KEY
GEMINI_API_KEY
Google Cloud credentials
service-account keys
access tokens
refresh tokens
```

`.env.example` may contain variable names with empty or placeholder values.

Do not place secrets under:

```text
runtimeConfig.public
NUXT_PUBLIC_*
app/**
public/**
client-side JavaScript
```

Do not ask the user to paste an API key into chat.

Ask the user to configure it locally and report only whether configuration is complete.

## User-controlled operations

The user controls:

- Google account login;
- Gemini API key creation;
- billing activation;
- Google Cloud project selection;
- browser-based `gcloud` authentication;
- permission grants;
- public Cloud Run access;
- budget alert configuration.

Continue all independent work before reporting that user action is required.

## Stop-and-report conditions

Report instead of guessing when:

- login is required;
- billing or terms acceptance is required;
- the API key is missing;
- no Google Cloud project is selected;
- public access requires user judgment;
- existing user changes may be overwritten;
- the specification and existing implementation conflict materially;
- a destructive operation is required;
- a secret might be displayed.

## Commands and validation

Check `package.json` before running scripts.

Run only applicable existing scripts:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Do not claim a check passed unless it was executed successfully.

If a script does not exist, report it as unavailable.

For the dummy milestone, manually verify:

1. prompt submission;
2. three displayed cards;
3. direct/distant/alternative types;
4. selection confirmation;
5. regeneration;
6. initial history is created only after the first API succeeds;
7. selected labels are appended only after regeneration succeeds;
8. failed regeneration preserves previous cards and history;
9. mobile layout remains usable.

## Git safety

- Do not discard user changes.
- Do not run destructive Git commands.
- Do not force push.
- Do not rewrite history.
- Do not commit `.env` or credentials.
- Do not create a commit unless explicitly requested.
- Review `git diff` before finishing.

Never run without explicit approval:

```bash
git reset --hard
git clean -fd
git checkout -- .
git restore .
git push --force
```

## Completion report

At task end, report:

- implemented work;
- changed files;
- added dependencies;
- commands executed;
- validation results;
- unresolved issues;
- user actions still required;
- next recommended phase.

Do not report success if required behavior or build status was not verified.
