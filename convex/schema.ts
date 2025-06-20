import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("operator"), v.literal("viewer")),
    organizationId: v.optional(v.id("organizations")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  organizations: defineTable({
    name: v.string(),
    brandingConfig: v.object({
      primaryColor: v.string(),
      logo: v.optional(v.string()),
      systemName: v.string(), // "AquaSense" or custom
    }),
    subscriptionTier: v.union(
      v.literal("diy"),
      v.literal("commercial"),
      v.literal("enterprise")
    ),
  }).index("by_name", ["name"]),

  systems: defineTable({
    name: v.string(),
    organizationId: v.id("organizations"),
    location: v.string(),
    masterControllerMAC: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  rows: defineTable({
    systemId: v.id("systems"),
    rowNumber: v.number(),
    controllerMAC: v.string(),
    currentPlantProfile: v.id("plantProfiles"),
    isActive: v.boolean(),
    lastSeen: v.number(),
  }).index("by_system_row_number", ["systemId", "rowNumber"]),

  plantProfiles: defineTable({
    name: v.string(),
    organizationId: v.id("organizations"),
    isDefault: v.boolean(),
    parameters: v.object({
      airTemp: v.number(),
      waterTemp: v.number(),
      humidity: v.number(),
      lightIntensity: v.number(),
      lightDuration: v.number(),
      co2Level: v.number(),
      flowRate: v.number(),
      pH: v.optional(v.number()),
      dissolvedOxygen: v.optional(v.number()),
      waterLevel: v.optional(v.number()),
      nutrients: v.optional(v.object({ n: v.number(), p: v.number(), k: v.number() })),
    }),
    createdAt: v.number(),
  }).index("by_organization_name", ["organizationId", "name"]),

  sensorReadings: defineTable({
    rowId: v.id("rows"),
    timestamp: v.number(),
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
  }).index("by_row_timestamp", ["rowId", "timestamp"]),

  alerts: defineTable({
    systemId: v.id("systems"),
    rowId: v.optional(v.id("rows")),
    type: v.union(v.literal("warning"), v.literal("critical"), v.literal("info")),
    parameter: v.string(),
    message: v.string(),
    value: v.number(),
    threshold: v.number(),
    isResolved: v.boolean(),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  }).index("by_system_createdAt", ["systemId", "createdAt"]),

  alertRules: defineTable({
    systemId: v.id("systems"),
    parameter: v.string(),
    minThreshold: v.optional(v.number()),
    maxThreshold: v.optional(v.number()),
    severity: v.union(v.literal("warning"), v.literal("critical")),
    isEnabled: v.boolean(),
    notificationMethods: v.array(v.union(v.literal("push"), v.literal("sound"), v.literal("email"))),
  }).index("by_system_parameter", ["systemId", "parameter"]),
}); 