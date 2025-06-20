import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const getSensorReadings = query({
  args: {
    rowId: v.id("rows"),
    timeRange: v.optional(v.string()), // This can be used to filter by time, e.g., "24h", "7d"
  },
  handler: async (ctx: any, args: { rowId: Id<"rows">; timeRange?: string }) => {
    // For simplicity, let's just fetch the latest 100 readings for the given rowId
    // In a real application, 'timeRange' would be used to filter by timestamp
    return await ctx.db
      .query("sensorReadings")
      .withIndex("by_rowId_timestamp", (q: any) => q.eq("rowId", args.rowId))
      .order("desc")
      .take(100);
  },
});

export const addSensorReading = mutation({
  args: {
    rowId: v.id("rows"),
    data: v.object({
      airTemp: v.number(),
      waterTemp: v.number(),
      humidity: v.number(),
      lightIntensity: v.number(),
      pH: v.optional(v.number()),
      dissolvedOxygen: v.optional(v.number()),
      waterLevel: v.optional(v.number()),
      flowRate: v.optional(v.number()),
    }),
  },
  handler: async (ctx: any, args: { rowId: Id<"rows">; data: any }) => {
    const { rowId, data } = args;
    const timestamp = Date.now();

    // Fetch the row to get the systemId
    const row = await ctx.db.get(rowId);
    if (!row) {
      throw new Error("Row not found");
    }

    // Fetch the system to get the mqttTopicPrefix
    const system = await ctx.db.get(row.systemId);
    if (!system) {
      throw new Error("System not found");
    }

    await ctx.db.insert("sensorReadings", { rowId, timestamp, data, mqttTopicPrefix: system.mqttTopicPrefix });
  },
});

export const addSimulatedSensorReading = mutation({
  args: {
    rowId: v.id("rows"),
    topicPrefix: v.string(),
  },
  handler: async (ctx: any, args: { rowId: Id<"rows">; topicPrefix: string }) => {
    const { rowId, topicPrefix } = args;
    const timestamp = Date.now();

    // Fetch the row to get the systemId
    const row = await ctx.db.get(rowId);
    if (!row) {
      throw new Error("Row not found");
    }

    // Fetch the system to get the mqttTopicPrefix
    const system = await ctx.db.get(row.systemId);
    if (!system) {
      throw new Error("System not found");
    }

    // Generate random data for simulation
    const data = {
      airTemp: parseFloat((Math.random() * (30 - 20) + 20).toFixed(2)), // 20-30°C
      waterTemp: parseFloat((Math.random() * (25 - 15) + 15).toFixed(2)), // 15-25°C
      humidity: parseFloat((Math.random() * (90 - 50) + 50).toFixed(2)), // 50-90%
      lightIntensity: parseFloat((Math.random() * (1000 - 200) + 200).toFixed(2)), // 200-1000 µmol/m²/s
      pH: parseFloat((Math.random() * (7.0 - 5.5) + 5.5).toFixed(2)), // 5.5-7.0
      dissolvedOxygen: parseFloat((Math.random() * (10 - 5) + 5).toFixed(2)), // 5-10 mg/L
      waterLevel: parseFloat((Math.random() * (100 - 20) + 20).toFixed(2)), // 20-100%
      flowRate: parseFloat((Math.random() * (2 - 0.5) + 0.5).toFixed(2)), // 0.5-2 L/min
    };

    await ctx.db.insert("sensorReadings", { rowId, timestamp, data, mqttTopicPrefix: system.mqttTopicPrefix });
  },
}); 