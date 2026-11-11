# Atlas Workforce

AI-Native specialists, living identity and an Obsidian knowledge Vault for **Atlas-Agent OS**. [Atlas](https://atlas-si.com) · [Desktop](https://agents.atlas-si.com) · [Architecture](https://github.com/sergiomonteiro-atlas/atlas-blueprint)

## Catalog

The complete MIT Agency Agents catalog is preserved, extended with five AtlasHub specialists: architect, Sales OS commander, gbrain curator, editorial engine and mandatory reality auditor. `divisions.json` and `tools.json` are canonical. Original attribution remains in LICENSE and [REA provenance](docs/REA.md).

## Convert and install

Prerequisites: Node.js 22+ and Python 3 for the Hermes router. The Bash entrypoint uses the portable Node renderer by default; Git Bash is supported on Windows. Legacy Bash renderers remain available with `ATLAS_LEGACY_CONVERTER=1` and require coreutils and Perl.

```bash
bash scripts/convert.sh                 # all 19 integrations
bash scripts/convert.sh --tool atlas-agent
bash scripts/install.sh --tool atlas-agent --division atlashub --dry-run
bash scripts/install.sh --tool atlas-agent --division atlashub
```

Generation writes only to integrations. Installation is a separate explicit command; it can update tool configuration, so inspect --dry-run first. Atlas agents install to `~/.atlas/vault/agents/<division>/<source-slug>.md`. The starter souls and CRM are copied separately; they are never silently merged over an existing Vault. Existing Hermes/OpenClaw/Claude Code/Cursor/Gemini CLI/Antigravity formats remain available. `openbot` is an Atlas Markdown interchange profile, with runtime compatibility stated in tools.json rather than assumed.

## Start a Vault

Open `vault-starter` in Obsidian, or copy it to a new `~/.atlas/vault/`. The starter contains graph colors, five agent instructions, five living SOUL files, one project, one episodic memory and **three fictional CRM examples**. See [Sales OS schema](vault-starter/packs/crm-sales-os/README.md). All monetary values are examples in BRL, not revenue.

## Validate

```bash
git add .
bash scripts/check-divisions.sh
bash scripts/check-tools.sh
bash scripts/lint-agents.sh
node --test tests/atlas-workforce.test.mjs
```

The runtime and desktop consume the same WikiLink graph contracts defined by atlas-blueprint. A task cannot close without the Atlas Reality Auditor verdict.
