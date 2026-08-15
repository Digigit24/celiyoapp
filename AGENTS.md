# celiyoapp — DigiHMS Admin Mobile App

See [CLAUDE.md](./CLAUDE.md) for the full project contract (backends, theme,
auth, permissions, conventions, phase plan). Key rules:

- Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing Expo-specific code.
- Auth: SuperAdmin at `https://admin.celiyo.com`; HMS API at `https://hms.celiyo.com/api/`.
- Tokens only in expo-secure-store; never AsyncStorage.
- Permission logic in `src/lib/auth/permissions.ts` is a 1:1 port of
  `celiyohms/src/lib/auth.ts` — keep them in sync; run `npm test` after changes.
- Verify with `npm run typecheck` and `npm test`.
