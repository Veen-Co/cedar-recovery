import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Declare your Neon services here
  auth: false,
  preview: {
    buckets: {
      // Bucket name isn't an env var — it's also a literal in payload.config.ts's s3Storage() call.
      "cedar-bucket": { access: "private" },
    },
  },
  // Branch policy, applied when `neon checkout <name>` creates a branch
  branch: (branch) => {
    if (branch.isDefault) return {};
    // New throwaway branches (previews, experiments) auto-expire.
    if (branch.name.startsWith("preview/")) return { ttl: "14d" };
    // Exempt long-lived ones like `staging`.
    if (branch.name === "staging") return {};
    return {};
  },
});
