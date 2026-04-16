# E-School AI Safety Protocol (MANDATORY FOR AI AGENTS)

This document outlines the mandatory safety procedures for any AI Agent or developer working on this project. Failure to follow these rules may result in file loss or UI corruption.

---

## 🛑 1. BACKUP BEFORE EDITING
Before making any changes to HTML, CSS, JS, or Backend files, you **MUST** run the safety check:
```bash
npm run safety
```
This command will:
-   Automatically commit staged and unstaged changes to Git as a checkpoint.
-   Create a physical copy of core files in the `_backups/` directory.

## 🧪 2. ENCODING & VIETNAMESE CHARACTERS
To prevent the common "L?i" (mojibake) error:
-   All files MUST be saved in **UTF-8** encoding.
-   After editing, run `npm run safety validate` to scan for broken characters or corrupted text.

## 🎨 3. UI INTEGRITY
When modifying styles:
-   Prefer CSS variables (defined in `index.html` or `design-system.css`) over hardcoded hex colors.
-   Always verify UI changes using a browser tool to ensure labels, sidebars, and layouts aren't broken.
-   Never use `git checkout` or `git reset` on files with uncommitted manual work.

## 📋 4. HOW TO RESTORE
If an edit goes wrong:
-   Use `git restore <file>` to revert to the last stable checkpoint.
-   Check the `_backups/` directory for the most recent physical copy of the file.

---
**STATUS: ACTIVE**
*Last Updated: April 16, 2026*
