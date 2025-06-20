import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getAlerts = query({
  args: {
    systemId: v.optional(v.id("systems")),
    rowId: v.optional(v.id("rows")),
    isResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let alertsQuery;

    if (args.systemId) {
      alertsQuery = ctx.db.query("alerts").withIndex("by_system_createdAt", (q) =>
        q.eq("systemId", args.systemId as Id<"systems">)
      );
    } else {
      alertsQuery = ctx.db.query("alerts");
    }

    if (args.rowId) {
      alertsQuery = alertsQuery.filter((q) => q.eq(q.field("rowId"), args.rowId));
    }

    if (args.isResolved !== undefined) {
      alertsQuery = alertsQuery.filter((q) =>
        q.eq(q.field("isResolved"), args.isResolved)
      );
    }

    return alertsQuery.order("desc").collect();
  },
});

export const getAlertRules = query({
  args: {
    systemId: v.optional(v.id("systems")),
  },
  handler: async (ctx, args) => {
    if (args.systemId) {
      return ctx.db
        .query("alertRules")
        .withIndex("by_system_parameter", (q) =>
          q.eq("systemId", args.systemId as Id<"systems">)
        )
        .collect();
    } else {
      return ctx.db.query("alertRules").collect();
    }
  },
});

export const createAlert = mutation({
  args: {
    systemId: v.id("systems"),
    rowId: v.optional(v.id("rows")),
    type: v.union(v.literal("warning"), v.literal("critical"), v.literal("info")),
    parameter: v.string(),
    message: v.string(),
    value: v.number(),
    threshold: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alerts", {
      systemId: args.systemId,
      rowId: args.rowId,
      type: args.type,
      parameter: args.parameter,
      message: args.message,
      value: args.value,
      threshold: args.threshold,
      isResolved: false,
      createdAt: Date.now(),
    });
  },
});

export const updateAlertRule = mutation({
  args: {
    alertRuleId: v.id("alertRules"),
    minThreshold: v.optional(v.number()),
    maxThreshold: v.optional(v.number()),
    severity: v.optional(v.union(v.literal("warning"), v.literal("critical"))),
    isEnabled: v.optional(v.boolean()),
    notificationMethods: v.optional(v.array(v.union(v.literal("push"), v.literal("sound"), v.literal("email")))),
  },
  handler: async (ctx, args) => {
    const { alertRuleId, ...rest } = args;
    await ctx.db.patch(alertRuleId, rest);
  },
});

export const resolveAlert = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { isResolved: true, resolvedAt: Date.now() });
  },
}); 