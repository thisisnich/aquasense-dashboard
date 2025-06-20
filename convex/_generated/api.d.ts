/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as alerts from "../alerts.js";
import type * as mqtt from "../mqtt.js";
import type * as organizations from "../organizations.js";
import type * as plantProfiles from "../plantProfiles.js";
import type * as readings from "../readings.js";
import type * as sensorReadings from "../sensorReadings.js";
import type * as systems from "../systems.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  mqtt: typeof mqtt;
  organizations: typeof organizations;
  plantProfiles: typeof plantProfiles;
  readings: typeof readings;
  sensorReadings: typeof sensorReadings;
  systems: typeof systems;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
