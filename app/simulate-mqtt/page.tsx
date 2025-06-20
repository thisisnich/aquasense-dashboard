'use client'

import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const MqttSimulatorPage = () => {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [connectStatus, setConnectStatus] = useState('Disconnected');
  const [airTemp, setAirTemp] = useState<string>('');
  const [waterTemp, setWaterTemp] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('');
  const [lIntensity, setLIntensity] = useState<string>('');
  const [lDuration, setLDuration] = useState<string>('');
  const [co2Level, setCo2Level] = useState<string>('');
  const [flowRate, setFlowRate] = useState<string>('');
  const [rowNumber, setRowNumber] = useState<string>('1'); // Default row number
  const [mqttTopicPrefix, setMqttTopicPrefix] = useState('m5stack'); // Configurable prefix
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState('ws://test.mosquitto.org:8080'); // Default public broker

  useEffect(() => {
    setConnectStatus('Connecting');
    let newClient: mqtt.MqttClient | null = null;
    try {
      newClient = mqtt.connect(mqttBrokerUrl);

      newClient.on('connect', () => {
        setConnectStatus('Connected');
        console.log('Connected to MQTT Broker');
      });

      newClient.on('error', (err) => {
        console.error('Connection error: ', err);
        setConnectStatus(`Error: ${err.message}`);
        newClient?.end();
      });

      newClient.on('reconnect', () => {
        setConnectStatus('Reconnecting');
      });

      newClient.on('close', () => {
        setConnectStatus('Disconnected');
        console.log('Disconnected from MQTT Broker');
      });

      setClient(newClient);
    } catch (error: any) {
      setConnectStatus(`Connection Failed: ${error.message}`);
      console.error('MQTT Connection Error:', error);
    }

    return () => {
      if (newClient) {
        newClient.end();
        console.log('MQTT Client disconnected on cleanup');
      }
    };
  }, [mqttBrokerUrl]); // Depend only on mqttBrokerUrl to trigger re-connection

  const handleSendReading = () => {
    if (client && client.connected) {
      const payload = JSON.stringify({
        airTemp: parseFloat(airTemp),
        waterTemp: parseFloat(waterTemp),
        humidity: parseFloat(humidity),
        lIntensity: parseFloat(lIntensity),
        lDuration: parseFloat(lDuration),
        co2Level: parseFloat(co2Level),
        flowRate: parseFloat(flowRate),
        timestamp: new Date().toISOString(),
      });
      const topic = `${mqttTopicPrefix}/${rowNumber}/sensor/readings`;
      client.publish(topic, payload, (err) => {
        if (err) {
          console.error('Failed to publish message: ', err);
          alert(`Failed to publish message: ${err.message}`);
        } else {
          console.log(`Message published to ${topic}: ${payload}`);
          alert('Sensor reading sent successfully!');
        }
      });
    } else {
      alert('Not connected to MQTT broker. Please wait or check the URL.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg text-black">
        <h1 className="text-2xl font-bold mb-4 text-black">Simulate MQTT Sensor Readings</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black">MQTT Broker URL:</label>
          <input
            type="text"
            value={mqttBrokerUrl}
            onChange={(e) => {
              setMqttBrokerUrl(e.target.value);
              // The useEffect will handle disconnecting the old client and connecting a new one
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., wss://broker.hivemq.com:8884/mqtt"
          />
          <p className="text-sm text-black">Status: {connectStatus}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black">MQTT Topic Prefix:</label>
          <input
            type="text"
            value={mqttTopicPrefix}
            onChange={(e) => setMqttTopicPrefix(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., myfarm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black">Row Number:</label>
          <input
            type="number"
            value={rowNumber}
            onChange={(e) => setRowNumber(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., 1"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black">Air Temperature (°C):</label>
          <input
            type="number"
            value={airTemp}
            onChange={(e) => setAirTemp(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., 25.5"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black">Water Temperature (°C):</label>
          <input
            type="number"
            value={waterTemp}
            onChange={(e) => setWaterTemp(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., 20.0"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black">Humidity (%):</label>
          <input
            type="number"
            value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., 60"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black">Light Intensity (µmol/m²/s):</label>
          <input
            type="number"
            value={lIntensity}
            onChange={(e) => setLIntensity(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., 400"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black">Light Duration (hours):</label>
          <input
            type="number"
            value={lDuration}
            onChange={(e) => setLDuration(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., 16"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black">CO2 Level (ppm):</label>
          <input
            type="number"
            value={co2Level}
            onChange={(e) => setCo2Level(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., 420"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-black">Flow Rate (L/min):</label>
          <input
            type="number"
            value={flowRate}
            onChange={(e) => setFlowRate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., 1.0"
          />
        </div>

        <button
          onClick={handleSendReading}
          disabled={!client || !client.connected || airTemp === '' || waterTemp === '' || humidity === '' || lIntensity === '' || lDuration === '' || co2Level === '' || flowRate === '' || rowNumber === ''}
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send Simulated Reading
        </button>
      </div>
    </div>
  );
};

export default MqttSimulatorPage; 