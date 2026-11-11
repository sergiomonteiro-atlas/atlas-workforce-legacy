# Atlas Sales OS

Each lead lives in `leads/<slug>.md` with YAML `name`, `status`, nonnegative numeric `value`, ISO currency `currency`, `owner_agent`, and `next_action`. States: `new`, `qualified`, `proposal`, `won`, `lost`. The three bundled records are fictional fixtures. Monetary totals must be grouped by currency. Record a real acceptance before changing to won.
