# ADR 006 — Permission keys

Authorisation checks a permission key such as `finance.reconcile`, never a role name. Roles are database bundles of keys. Scope is platform, organisation, branch, portfolio, or record. Missing key means deny. An organisation admin cannot grant a platform super-admin key.
