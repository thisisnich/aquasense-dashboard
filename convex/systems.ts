import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSystems = query({
  args: {
    mqttTopicPrefix: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.mqttTopicPrefix) {
      return ctx.db
        .query("systems")
        .withIndex("by_mqttTopicPrefix", (q) =>
          q.eq("mqttTopicPrefix", args.mqttTopicPrefix!)
        )
        .collect();
    } else {
      return ctx.db.query("systems").collect();
    }
  },
});

export const getRowsBySystem = query({
  args: { systemId: v.id("systems") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("rows")
      .withIndex("by_system_row_number", (q) => q.eq("systemId", args.systemId))
      .collect();
  },
});

export const createSystem = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    masterControllerMAC: v.string(),
    organizationId: v.id("organizations"),
    mqttTopicPrefix: v.string(),
  },
  handler: async (ctx, args) => {
    const newSystemId = await ctx.db.insert("systems", {
      name: args.name,
      location: args.location,
      masterControllerMAC: args.masterControllerMAC,
      mqttTopicPrefix: args.mqttTopicPrefix,
      isActive: true,
      createdAt: Date.now(),
      organizationId: args.organizationId,
    });
    return newSystemId;
  },
});

export const createRow = mutation({
  args: {
    systemId: v.id("systems"),
    rowNumber: v.number(),
    controllerMAC: v.string(),
    currentPlantProfile: v.id("plantProfiles"),
  },
  handler: async (ctx, args) => {
    const newRowId = await ctx.db.insert("rows", {
      systemId: args.systemId,
      rowNumber: args.rowNumber,
      controllerMAC: args.controllerMAC,
      currentPlantProfile: args.currentPlantProfile,
      isActive: true,
      lastSeen: Date.now(),
    });
    return newRowId;
  },
}); 