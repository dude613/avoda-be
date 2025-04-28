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
# Fetch latest changes
git fetch origin
git checkout origin/staging -b feature/your-branch-name
```

> This ensures your feature branch only includes changes not yet in `staging`.

---

## 2. Rebase, Never Merge

### ❌ Do NOT merge `staging` into your feature:

```bash
# Bad — this pollutes history
git checkout feature/xyz
git merge staging
```

### ✅ Rebase instead:

```bash
# Good — this keeps your commits clean and linear
git fetch origin
git rebase origin/staging
```

> Rebase re-applies your work on top of the latest `staging`, avoiding merge commits that clutter PRs.

---

## 3. Clean Up Commits Using Interactive Rebase

To reword, re-order, or drop commits — but **never squash**:

```bash
# Interactive rebase
git rebase -i origin/staging
```

- Use `pick` to keep as-is
- Use `reword` to rename commit
- Use `edit` to pause and amend commit
- Never use `squash` or `fixup`

---

## 4. Preview Commits Before Pushing

To see what commits exist between your branch and staging:

```bash
git log origin/staging..HEAD --oneline
```

This helps catch:
- Unintended merge commits
- WIP or experimental commits
- Out-of-order history

---

## 5. Use `pull --rebase` Globally

Avoid accidental merge commits on `git pull`:

```bash
# Global config
git config --global pull.rebase true
```

> This makes `git pull` behave like `git pull --rebase`, keeping history linear.

---

## 6. Don’t Push Directly to `staging` or `main`

Those branches should always be **protected** via GitHub rules:

- No direct pushes
- No force pushes
- PRs required
- Status checks required

Always open a PR from your feature branch → `staging`

---

## 7. Force Pushes Are OK on Feature Branches

It’s safe (and encouraged) to rebase and `--force` push your **own feature branches** to keep commit history clean:

```bash
# Force push
git push origin feature/xyz --force-with-lease
```

> Use `--force-with-lease` to avoid clobbering others' work by accident.

If force-push is blocked, push to a new branch:

```bash
# Create new branch
git checkout -b feature/xyz-cleaned
git push origin feature/xyz-cleaned
```

Open a fresh PR, and close the old one.

---

## 8. TL;DR Workflow Summary

```bash
# Start feature branch
git checkout origin/staging -b feature/add-client-override

# Work & commit frequently

# Keep up to date
git fetch origin
git rebase origin/staging

# Review commits
git log origin/staging..HEAD --oneline

# Clean up if needed
git rebase -i origin/staging

# Push
git push origin feature/add-client-override --force-with-lease
```

---

## Why This Matters

- Keeps PRs small, reviewable, and focused
- Makes production rollbacks easier
- Helps future team members understand *why* a commit exists
- Prevents “rebase debt” from accumulating and causing conflicts

---

**Consistency matters more than speed. Be kind to your future self and teammates.**  
Happy Git-ing!