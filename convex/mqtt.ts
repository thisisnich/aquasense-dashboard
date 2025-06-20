import { action, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

const MQTT_BROKER_URL = "ws://test.mosquitto.org:8080";
const MQTT_TOPIC_PREFIX = "m5stack";

// Define a mutation to add sensor readings from MQTT
export const addMqttSensorReading = internalMutation({
  args: {
    rowId: v.id("rows"),
    data: v.object({
      airTemp: v.number(),
      waterTemp: v.number(),
      humidity: v.number(),
      lightIntensity: v.number(),
      lDuration: v.number(),
      co2Level: v.number(),
      flowRate: v.number(),
    }),
    mqttTopicPrefix: v.string(),
  },
  handler: async (ctx, args) => {
    const { rowId, data, mqttTopicPrefix } = args;
    const timestamp = Date.now();

    await ctx.db.insert("sensorReadings", { rowId, timestamp, data, mqttTopicPrefix });
  },
});

// Define an action to start the MQTT listener
export const startMqttListener = action({
  handler: async (ctx) => {
    // This part requires a Node.js environment to run an MQTT client.
    // In a real Convex application, you would typically use a separate service
    // or a scheduled action that triggers an external service to listen to MQTT.
    // For demonstration purposes, we'll simulate the MQTT client here.
    // This code will not actually connect to an MQTT broker in the current Convex environment
    // as direct persistent TCP connections are not supported in standard actions.

    console.log(`Attempting to connect to MQTT broker: ${MQTT_BROKER_URL}`);
    console.log(`Subscribing to topic: ${MQTT_TOPIC_PREFIX}/data/row+/dataList`);

    // Placeholder for actual MQTT client logic (e.g., using `mqtt` npm package)
    // if (typeof window === 'undefined') {
    //   // This code would run on the server/Node.js environment
    //   const mqtt = require('mqtt');
    //   const client = mqtt.connect(MQTT_BROBROKER_URL);

    //   client.on('connect', () => {
    //     console.log('Connected to MQTT broker');
    //     client.subscribe(`${MQTT_TOPIC_PREFIX}/data/row+/dataList`, (err) => {
    //       if (!err) {
    //         console.log('Subscribed to MQTT topic');
    //       }
    //     });
    //   });

    //   client.on('message', async (topic, message) => {
    //     console.log(`Received message on topic ${topic}: ${message.toString()}`);
    //     try {
    //       const sensorData = JSON.parse(message.toString());
    //       // Extract rowId from topic if needed, or associate with a default row
    //       // For simplicity, we'll assume a predefined rowId or handle association logic here
    //       const defaultRowId = "YOUR_DEFAULT_ROW_ID"; // <<< REPLACE WITH ACTUAL ROW ID

    //       // Call the internal mutation to add the sensor reading
    //       await ctx.runMutation(api.mqtt.addMqttSensorReading, {
    //         rowId: defaultRowId,
    //         data: sensorData,
    //         mqttTopicPrefix: MQTT_TOPIC_PREFIX,
    //       });
    //     } catch (e) {
    //       console.error(`Error processing MQTT message: ${e}`);
    //     }
    //   });

    //   client.on('error', (err) => {
    //     console.error(`MQTT Client Error: ${err}`);
    //   });
    // }

    return "MQTT Listener initiated (simulated).";
  },
}); 