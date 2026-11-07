# Shared extraction candidate 0.1.0

Single implementation extracted from BBM-Produktiv/main bc380fc. Existing imports delegate here, no independent host copy. No product release. Source package remains in BBM-Produktiv.

Project-firms: existing createProjectFirmsService requires the existing projects/projectFirms/projectPersons repository ports. Database/schema, global-firm/Bauherr SQL and migration transactions remain in existing repositories and are NOT claimed to be portable yet. This is the first extracted service boundary, not a complete replacement project datastore.

Entitlements: existing feature normalisation and requireFeature/requireValidLicense policy. Host injects a freshly VERIFIED license status; file reading, signature verification, clock/device binding and cached status remain with the existing verifier. No license issuer or permissive fallback inside this package.
