import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const getSensorReadings = query({
  args: { 
    rowId: v.optional(v.id("rows")),
    mqttTopicPrefix: v.optional(v.string()),
    timeRange: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.rowId) {
      return ctx.db
        .query("sensorReadings")
        .withIndex("by_row_timestamp", (q) => q.eq("rowId", args.rowId as Id<"rows">))
        .order("desc")
        .take(100);
    } else if (args.mqttTopicPrefix) {
      return ctx.db
        .query("sensorReadings")
        .withIndex("by_mqttTopicPrefix_timestamp", (q) =>
          q.eq("mqttTopicPrefix", args.mqttTopicPrefix as string)
        )
        .order("desc")
        .take(100);
    } else {
      // If neither rowId nor mqttTopicPrefix is provided, return an empty array or handle as per business logic
      return [];
    }
  },
});

export const updatePlantProfile = mutation({
  args: { rowId: v.id("rows"), profileId: v.id("plantProfiles") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.rowId);
    if (!row) {
      throw new Error("Row not found");
    }

    const newProfile = await ctx.db.get(args.profileId);
    if (!newProfile) {
      throw new Error("Plant profile not found");
    }

    await ctx.db.patch(args.rowId, { currentPlantProfile: args.profileId });

    // In a real system, this would also trigger an MQTT command to the device
    // For now, we'll just log it.
    console.log(
      `Updated row ${row.rowNumber} (${row._id}) to plant profile ${newProfile.name} (${newProfile._id})`
    );

    return true;
  },
}); 