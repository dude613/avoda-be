# Git Commit Hygiene & Workflow Guide (No Squash, Clean History)

This document outlines how to maintain a clean, readable, and traceable Git history for feature branches **without ever squashing commits** — while keeping PRs clean, focused, and diffable against `staging`.

## Overview

- Base all work off `staging`, never `main`
- Never squash commits
- Avoid merging `staging` into feature branches — always rebase
- Clean commits early, locally, and often
- Force pushes are only allowed on personal feature branches (never `main` or `staging`)

---

## 1. Branching Strategy

### Always start from `staging`:

```bash
git fetch origin
git checkout origin/staging -b feature/your-branch-name
```

### Rebase strategy 

- Rebase strategy
- Rebase vs merge explanation
- Log preview
- Pre-push cleanup
- Role of `--force-with-lease`
- CI enforcement (optional)
- Pre-push hook (optional but helpful)
- TL;DR summary workflow