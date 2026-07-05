import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoAmI from "./tools/who-am-i";
import listMyOrganizations from "./tools/list-my-organizations";
import listOrgProducts from "./tools/list-org-products";
import listMyPurchases from "./tools/list-my-purchases";
import getOrgAnalytics from "./tools/get-org-analytics";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "siteviral-mcp",
  title: "SiteViral MCP",
  version: "0.1.0",
  instructions:
    "Tools for SiteViral — the creator/organization platform. Use `who_am_i` to verify connectivity, `list_my_organizations` to discover the user's orgs, then `list_org_products`, `get_org_analytics`, or `list_my_purchases` for data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoAmI, listMyOrganizations, listOrgProducts, listMyPurchases, getOrgAnalytics],
});
