# Workforce REA evidence ledger

## Identity and scope

Observed source: https://github.com/GoWorld-Digital/agency-agents at `8ae6164602c95ca78828b148b9052460ee426885`. MIT copyright retained. The official morluto/rea skill's source-analysis route recommends normal source tools for complete repositories; its staged questions/evidence/findings/unknowns workflow is applied here. Parent integration records official CLI evidence separately. No claim of binary decompilation or runtime interoperability is made.

## Findings

- `divisions.json` is the canonical division set; `scripts/check-divisions.sh` cross-checks directories, converter arrays, linter arrays and CI filters. Atlas adds atlashub to all four locations.
- `tools.json` records format, install mechanism, scope and destination; the installer dispatch and converter list must agree. Existing 17 integrations are retained; Atlas and the OpenBot interchange profile add two. Claude/Copilot identity conversion is now explicit.
- Existing Hermes output is a real lazy-router Python plugin built by `scripts/build-hermes-plugin.py`; it is not replaced with a fake per-agent file. Generating output does not install or alter any Hermes runtime.
- Agent files have YAML name/description/color plus Markdown instructions. Identity evolution is separated into Vault souls; three CRM examples are marked fictional.

## Unknowns and limits

No unspecified OpenBot repository is asserted as canonical. The Atlas profile is documented explicitly and requires an external runtime adapter. Generation verifies output contracts; it does not prove every third-party tool version's live behavior. No external messages are sent.
