# Ahold Delhaize — Onboarding Questions

Working list for the first 30 days as Senior Release Engineer. Grouped by
theme in rough priority order. Don't dump the whole list on anyone; take 3–5
per meeting and route each section to the right audience (see **Guardrails**
at the bottom).

## 1. Team, role, expectations (first 1:1 with your manager)
- What does "successful in 30 / 60 / 90 days" look like for this role, concretely?
- Which teams/products am I release engineer *for*? Is scope one platform, one BU, or global?
- What's the biggest release-engineering pain that made you open this req?
- Who is my closest peer? Who's the go-to for tribal knowledge on the pipeline?
- What's currently on fire that I should stay away from until I'm ramped?
- How do you feel about me spending week one reading and asking questions vs. shipping?

## 2. Codebase, repos, conventions
- Where do the "golden" reusable workflows / composite actions live? Who owns them?
- Is there a `platform-` or `releng-` org, or is everything under product orgs?
- What's the branching model — trunk-based, GitFlow, release branches?
- Is there an ADR / RFC repo? Any doc I should read *before* opening my first PR?
- What linting/formatting/pre-commit is expected? Any commit-message convention (Conventional Commits, ticket prefix)?
- Are there internal `AGENTS.md` / Copilot instructions I should mirror in my local setup?

## 3. GitHub Actions specifically (your daily driver)
- Enterprise or org-level GHA? What's pinned at org level (SHA pinning policy, allowed actions list)?
- Are we using GitHub-hosted runners at all, or 100% self-hosted?
- ARC (Actions Runner Controller) or classic self-hosted? Which K8s cluster hosts the runners?
- Runner labels & scaling policy — how do I request a new runner class?
- What secrets are org-level vs. repo-level? Is OIDC-to-Azure the norm, or are there still long-lived creds?
- What's the required-workflow / repository-ruleset story? Who can bypass?
- Do we author actions in TS with `@vercel/ncc` bundling, or JS, or Docker actions?

## 4. Argo CD & GitOps
- How many Argo CD instances, and how are they sharded (per BU, per region, per env)?
- ApplicationSet generators in use — `git`, `cluster`, `pull_request`, matrix? Which is preferred here?
- One gitops repo or repo-per-team? Where does *my* team's manifest tree live?
- Sync policy defaults — auto-sync, prune, self-heal? Any exceptions in prod?
- Kustomize, Helm, or both? Is there a chart library?
- How is drift alerted (Slack, PagerDuty, Argo notifications)?

## 5. Promotion & release flow
- Walk me through a code change from PR merge to prod. What's automated, what's human?
- Who approves prod promotion — release engineer, product owner, both?
- Do we promote by image-tag PR to `values-<env>.yaml`, by Artifactory repo promotion, or both?
- Freeze windows, change-advisory board, blackout periods? Around holidays especially.
- What's the rollback playbook — `git revert`, `argocd app rollback`, or image tag pin?
- Release cadence: continuous, per sprint, scheduled trains?

## 6. Artifactory
- Which repo types are in use — Docker, Helm, npm, Maven, generic?
- Local / remote / virtual naming convention?
- Retention & cleanup policies — who owns them, how often do they fire?
- Is build-promotion (properties-based) actually used, or is promotion just a re-tag/copy?
- Where do dev vs. prod-approved images live?
- Any Xray policies gating what can pass into prod?

## 7. Azure / identity
- Tenant layout: single tenant, multiple? Which AAD groups gate what?
- Are we on AKS, ACR, Key Vault (CSI), Log Analytics, Front Door? Any hard "no" services?
- Federated credentials (OIDC) or Service Principals with secrets? For which repos?
- Managed identities on AKS — workload identity or pod identity (deprecated)?
- Who owns the subscriptions and RG naming convention?
- Is there an Azure landing-zone doc I should read?

## 8. Supply chain / security
- Cosign / SLSA attestations / SBOM — required, aspirational, or off?
- Trivy or Xray or both? Blocking or advisory?
- Kyverno / OPA Gatekeeper at admission? What policies are enforced today?
- Dependabot / Renovate?
- Security team contact and their SLA for me needing a policy change?

## 9. Runtime, on-call, incidents
- Am I on the release/on-call rotation? From when, and what's the pager?
- Where do runbooks live? Are they current?
- What monitoring / alerting stack — Prometheus, Grafana, Datadog, Azure Monitor?
- Post-incident review culture — blameless, template, cadence?
- What was the last big release incident, and what changed because of it?

## 10. People, rituals, tools
- Standup / demo / retro cadence for my team and the wider platform group?
- Which Slack/Teams channels are non-optional? Which are noise?
- Is there a platform-engineering guild / community of practice?
- Who are the staff+ engineers I should introduce myself to in week one?
- Any internal training or certs the company will fund (Azure, CKA, GitHub certs)?
- Laptop, IDE conventions, VPN, MFA, VDI — anything unusual?

## 11. Practicalities (HR / office)
- Onsite days pattern — fixed days or team-negotiated?
- Any reimbursement quirks for the NL commute (OV-chipkaart, mileage)?
- 30-60-90 review — is it formal, and when?
- PTO approval flow, especially around release freeze periods.

---

## Guardrails

- **Don't dump the whole list on day one.** Take 3–5 per meeting.
  - Manager → §1 + §5
  - Peer engineer → §2, §3, §4
  - Security lead → §8
  - Ops / SRE lead → §9
  - HR / People → §11
- **Write down every answer**, even the ones that sound obvious — they won't in month two.
- **Prefer "how do you do X here" over "have you considered Y"** for the first four weeks. You're mapping the terrain, not redesigning it.
- **When someone says "we've always done it that way", ask when the last time was someone questioned it.** Cheap signal for where the improvement gaps sit.
