'use client'

import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const MqttSimulatorPage = () => {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [connectStatus, setConnectStatus] = useState('Disconnected');
  const [mqttTopicPrefix, setMqttTopicPrefix] = useState('m5stack'); // Configurable prefix
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState('ws://test.mosquitto.org:8080'); // Default public broker

  interface SystemData {
    id: number;
    rowNumber: string;
    airTemp: string;
    waterTemp: string;
    humidity: string;
    lIntensity: string;
    lDuration: string;
    co2Level: string;
    flowRate: string;
  }

  const [systems, setSystems] = useState<SystemData[]>([
    {
      id: 1,
      rowNumber: '1',
      airTemp: '',
      waterTemp: '',
      humidity: '',
      lIntensity: '',
      lDuration: '',
      co2Level: '',
      flowRate: '',
    },
  ]);

  const addSystem = () => {
    setSystems((prevSystems) => [
      ...prevSystems,
      {
        id: prevSystems.length > 0 ? Math.max(...prevSystems.map(s => s.id)) + 1 : 1,
        rowNumber: String(prevSystems.length > 0 ? Math.max(...prevSystems.map(s => parseInt(s.rowNumber))) + 1 : 1),
        airTemp: '',
        waterTemp: '',
        humidity: '',
        lIntensity: '',
        lDuration: '',
        co2Level: '',
        flowRate: '',
      },
    ]);
  };

  const updateSystem = (id: number, field: keyof SystemData, value: string) => {
    setSystems((prevSystems) =>
      prevSystems.map((system) =>
        system.id === id ? { ...system, [field]: value } : system
      )
    );
  };

  const removeSystem = (id: number) => {
    setSystems((prevSystems) => prevSystems.filter(system => system.id !== id));
  };

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

  const handleSendReading = (system: SystemData) => {
    if (client && client.connected) {
      const payload = JSON.stringify({
        airTemp: parseFloat(system.airTemp),
        waterTemp: parseFloat(system.waterTemp),
        humidity: parseFloat(system.humidity),
        lIntensity: parseFloat(system.lIntensity),
        lDuration: parseFloat(system.lDuration),
        co2Level: parseFloat(system.co2Level),
        flowRate: parseFloat(system.flowRate),
        timestamp: new Date().toISOString(),
      });
      const topic = `${mqttTopicPrefix}/${system.rowNumber}/sensor/readings`;
      client.publish(topic, payload, (err) => {
        if (err) {
          console.error('Failed to publish message: ', err);
          alert(`Failed to publish message: ${err.message}`);
        } else {
          console.log(`Message published to ${topic}: ${payload}`);
          alert(`Sensor reading sent successfully for row ${system.rowNumber}!`);
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

        <div className="space-y-8 mt-8">
          {systems.map((system) => (
            <div key={system.id} className="p-4 border rounded-lg shadow-sm bg-gray-50 relative">
              <h2 className="text-xl font-semibold mb-4 text-black">System Row {system.rowNumber}</h2>
              {systems.length > 1 && (
                <button
                  onClick={() => removeSystem(system.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black">Row Number:</label>
                  <input
                    type="number"
                    value={system.rowNumber}
                    onChange={(e) => updateSystem(system.id, 'rowNumber', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                    placeholder="e.g., 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black">Air Temperature (°C):</label>
                  <input
                    type="number"
                    value={system.airTemp}
                    onChange={(e) => updateSystem(system.id, 'airTemp', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                    placeholder="e.g., 25.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black">Water Temperature (°C):</label>
                  <input
                    type="number"
                    value={system.waterTemp}
                    onChange={(e) => updateSystem(system.id, 'waterTemp', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                    placeholder="e.g., 20.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black">Humidity (%):</label>
                  <input
                    type="number"
                    value={system.humidity}
                    onChange={(e) => updateSystem(system.id, 'humidity', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                    placeholder="e.g., 60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black">Light Intensity (µmol/m²/s):</label>
                  <input
                    type="number"
                    value={system.lIntensity}
                    onChange={(e) => updateSystem(system.id, 'lIntensity', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                    placeholder="e.g., 400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black">Light Duration (hours):</label>
                  <input
                    type="number"
                    value={system.lDuration}
                    onChange={(e) => updateSystem(system.id, 'lDuration', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                    placeholder="e.g., 16"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black">CO2 Level (ppm):</label>
                  <input
                    type="number"
                    value={system.co2Level}
                    onChange={(e) => updateSystem(system.id, 'co2Level', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                    placeholder="e.g., 420"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black">Flow Rate (L/min):</label>
                  <input
                    type="number"
                    value={system.flowRate}
                    onChange={(e) => updateSystem(system.id, 'flowRate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                    placeholder="e.g., 1.0"
                  />
                </div>
              </div>
              <button
                onClick={() => handleSendReading(system)}
                disabled={!client || !client.connected || system.airTemp === '' || system.waterTemp === '' || system.humidity === '' || system.lIntensity === '' || system.lDuration === '' || system.co2Level === '' || system.flowRate === '' || system.rowNumber === ''}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Simulated Reading for Row {system.rowNumber}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addSystem}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New System Row
        </button>
      </div>
    </div>
  );
};

export default MqttSimulatorPage; 