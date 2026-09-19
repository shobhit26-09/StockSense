// OAuth provider buttons render only for providers that are actually
// configured and verified in the Supabase project. Flip a flag on only
// after the provider is live end to end — never show a dead button.
export const ENABLED_OAUTH_PROVIDERS = {
  google: false,
} as const;
