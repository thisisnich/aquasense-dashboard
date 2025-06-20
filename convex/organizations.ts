import { internalMutation, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const createDefaultOrganization = internalMutation({
  handler: async (ctx) => {
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_name", (q) => q.eq("name", "Default Organization"))
      .first();

    if (existingOrg) {
      return existingOrg._id;
    }

    const newOrgId = await ctx.db.insert("organizations", {
      name: "Default Organization",
      brandingConfig: {
        primaryColor: "#54ca2c",
        systemName: "AquaSense",
      },
      subscriptionTier: "diy",
    });
    return newOrgId;
  },
});

export const getOrganizations = query({
  handler: async (ctx) => {
    return ctx.db.query("organizations").collect();
  },
});

export const createDefaultOrganizationPublic = mutation({
  handler: async (ctx): Promise<Id<"organizations">> => {
    return await ctx.runMutation(internal.organizations.createDefaultOrganization);
  },
}); 