import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const getPlantProfiles = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    if (args.organizationId) {
      return ctx.db
        .query("plantProfiles")
        .withIndex("by_organization_name", (q) => q.eq("organizationId", args.organizationId as Id<"organizations">))
        .collect();
    } else {
      // Return default profiles if no organizationId is provided
      return ctx.db
        .query("plantProfiles")
        .filter((q) => q.eq(q.field("isDefault"), true))
        .collect();
    }
  },
});

export const createDefaultPlantProfiles = mutation({
  handler: async (ctx) => {
    const organizationId = await ctx.runMutation(internal.organizations.createDefaultOrganization);

    const defaultProfiles = [
      {
        name: "Lettuce",
        airTemp: 22,
        waterTemp: 18,
        humidity: 70,
        lightIntensity: 400,
        lightDuration: 16,
        co2Level: 400,
        flowRate: 1,
      },
      {
        name: "Basil",
        airTemp: 25,
        waterTemp: 22,
        humidity: 65,
        lightIntensity: 500,
        lightDuration: 14,
        co2Level: 400,
        flowRate: 1,
      },
      {
        name: "Strawberry",
        airTemp: 20,
        waterTemp: 19,
        humidity: 75,
        lightIntensity: 350,
        lightDuration: 12,
        co2Level: 400,
        flowRate: 1,
      },
    ];

    for (const profile of defaultProfiles) {
      // Check if a profile with the same name already exists for this organization
      const existingProfile = await ctx.db
        .query("plantProfiles")
        .withIndex("by_organization_name", (q) =>
          q.eq("organizationId", organizationId).eq("name", profile.name)
        )
        .first();

      if (!existingProfile) {
        await ctx.db.insert("plantProfiles", {
          name: profile.name,
          organizationId: organizationId,
          isDefault: true,
          parameters: profile,
          createdAt: Date.now(),
        });
      }
    }
  },
}); 