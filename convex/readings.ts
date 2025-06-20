import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSensorReadings = query({
  args: { rowId: v.id("rows"), timeRange: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // For simplicity, we'll just return the latest 100 readings for the given rowId
    // In a real application, timeRange would be used to filter by time.
    return ctx.db
      .query("sensorReadings")
      .withIndex("by_row_timestamp", (q) => q.eq("rowId", args.rowId))
      .order("desc")
      .take(100);
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