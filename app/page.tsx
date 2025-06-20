'use client'
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect, useState, useMemo } from "react";
import { Id } from "../convex/_generated/dataModel";
import { useRouter } from 'next/navigation';

export default function Home() {
  const createDefaultPlantProfiles = useMutation(api.plantProfiles.createDefaultPlantProfiles);
  const createDefaultOrganization = useMutation(api.organizations.createDefaultOrganizationPublic);
  const createSystem = useMutation(api.systems.createSystem);
  const createRow = useMutation(api.systems.createRow);

  const [mqttTopicPrefix, setMqttTopicPrefix] = useState<string>('m5stack'); // Default MQTT topic prefix
  const [selectedSystemId, setSelectedSystemId] = useState<Id<"systems"> | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<Id<"rows"> | null>(null);

  const organizations = useQuery(api.organizations.getOrganizations);
  const systems = useQuery(api.systems.getSystems, { mqttTopicPrefix });
  const plantProfiles = useQuery(api.plantProfiles.getPlantProfiles, {});

  const selectedSystemMqttTopicPrefix = useMemo(() => {
    if (selectedSystemId && systems) {
      const system = systems.find(s => s._id === selectedSystemId);
      return system ? system.mqttTopicPrefix : mqttTopicPrefix;
    }
    return mqttTopicPrefix;
  }, [selectedSystemId, systems, mqttTopicPrefix]);

  const rows = useQuery(
    api.systems.getRowsBySystem,
    selectedSystemId ? { systemId: selectedSystemId } : "skip"
  );

  const sensorReadings = useQuery(
    api.sensorReadings.getSensorReadings,
    selectedRowId
      ? { rowId: selectedRowId }
      : selectedSystemMqttTopicPrefix
        ? { mqttTopicPrefix: selectedSystemMqttTopicPrefix }
        : "skip"
  );

  const alerts = useQuery(
    api.alerts.getAlerts,
    selectedSystemId ? { systemId: selectedSystemId, isResolved: false } : { isResolved: false }
  );

  const alertRules = useQuery(
    api.alerts.getAlertRules,
    selectedSystemId ? { systemId: selectedSystemId } : {}
  );

  const updatePlantProfile = useMutation(api.readings.updatePlantProfile);
  const resolveAlert = useMutation(api.alerts.resolveAlert);
  const addSimulatedReading = useMutation(api.sensorReadings.addSimulatedSensorReading);
  const router = useRouter();

  // Initialize default organization and plant profiles
  useEffect(() => {
    const initializeData = async () => {
      let orgId: Id<"organizations">;
      if (!organizations || organizations.length === 0) {
        orgId = await createDefaultOrganization();
      } else {
        orgId = organizations[0]._id;
      }

      if (orgId) {
        // Create default system if none exists
        if (!systems || systems.length === 0) {
          const systemId = await createSystem({
            name: "My First Farm",
            location: "Urban Greenhouse",
            masterControllerMAC: "00:1A:2B:3C:4D:5E",
            organizationId: orgId,
            mqttTopicPrefix: mqttTopicPrefix,
          });
          setSelectedSystemId(systemId);

          // Create default plant profiles
          await createDefaultPlantProfiles();

          // No need to call api.plantProfiles.getPlantProfiles() directly here
          // The plantProfiles variable from useQuery will be available via useEffect dependency
          if (systemId && (!rows || rows.length === 0) && plantProfiles && plantProfiles.length > 0) {
            await createRow({
              systemId: systemId,
              rowNumber: 1,
              controllerMAC: "AA:BB:CC:DD:EE:FF",
              currentPlantProfile: plantProfiles[0]._id, // Assign first default profile
            });
          }
        }
      }
    };

    if (organizations !== undefined && systems !== undefined && plantProfiles !== undefined) {
      initializeData();
    }
  }, [organizations, systems, plantProfiles, createDefaultOrganization, createSystem, createDefaultPlantProfiles, createRow, rows]);

  useEffect(() => {
    if (systems && systems.length > 0 && selectedSystemId === null) {
      setSelectedSystemId(systems[0]._id);
    }
  }, [systems, selectedSystemId]);

  useEffect(() => {
    if (rows && rows.length > 0 && selectedRowId === null) {
      setSelectedRowId(rows[0]._id);
    }
  }, [rows, selectedRowId]);

  const handlePlantProfileChange = async (newProfileId: Id<"plantProfiles">) => {
    if (selectedRowId) {
      await updatePlantProfile({ rowId: selectedRowId, profileId: newProfileId });
    }
  };

  const handleResolveAlert = async (alertId: Id<"alerts">) => {
    await resolveAlert({ alertId });
  };

  if (organizations === undefined || systems === undefined || plantProfiles === undefined || alerts === undefined || alertRules === undefined) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">AquaSense Dashboard</h1>
        {organizations && organizations.length > 0 && (
          <span className="text-gray-800">Organization: {organizations[0].name}</span>
        )}
      </header>
      <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow col-span-full mb-4">
          <label htmlFor="mqttTopicPrefix" className="block text-sm font-medium text-gray-800">MQTT Topic Prefix:</label>
          <input
            type="text"
            id="mqttTopicPrefix"
            value={mqttTopicPrefix}
            onChange={(e) => setMqttTopicPrefix(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., myfarm"
          />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Systems</h2>
          <ul className="space-y-2">
            {systems.length === 0 ? (
              <li className="text-gray-900">No systems found.</li>
            ) : (
              systems.map((system) => (
                <li
                  key={system._id}
                  className={`cursor-pointer p-2 rounded ${selectedSystemId === system._id ? "bg-blue-100" : "hover:bg-gray-50"}`}
                  onClick={() => setSelectedSystemId(system._id)}
                >
                  {system.name} ({system.location})
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Rows</h2>
          <ul className="space-y-2">
            {rows && rows.length === 0 ? (
              <li className="text-gray-900">No rows found for this system.</li>
            ) : (
              rows && rows.map((row) => (
                <li
                  key={row._id}
                  className={`cursor-pointer p-2 rounded ${selectedRowId === row._id ? "bg-blue-100" : "hover:bg-gray-50"}`}
                  onClick={() => setSelectedRowId(row._id)}
                >
                  Row {row.rowNumber}
                </li>
              ))
            )}
          </ul>
          {selectedRowId && (
            <button
              onClick={() => setSelectedRowId(null)}
              className="mt-4 bg-gray-300 text-gray-800 p-2 rounded shadow hover:bg-gray-400"
            >
              Clear Row Selection
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Sensor Readings</h2>
          {sensorReadings ? (
            <div>
              {sensorReadings.length === 0 ? (
                <p className="text-gray-900">No sensor readings available for this row.</p>
              ) : (
                <div className="space-y-2">
                  {sensorReadings.map((reading: any) => (
                    <div key={reading._id} className="border-b pb-2">
                      <p>Air Temp: {reading.data.airTemp}°C</p>
                      <p>Water Temp: {reading.data.waterTemp}°C</p>
                      <p>Humidity: {reading.data.humidity}%</p>
                      <p>Light Intensity: {reading.data.lightIntensity} µmol/m²/s</p>
                      <p className="text-sm text-gray-800">Timestamp: {new Date(reading.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => router.push('/simulate-mqtt')}
                className="mt-4 bg-green-500 text-white p-2 rounded shadow hover:bg-green-600"
              >
                Add Simulated Reading
              </button>
            </div>
          ) : (
            <p>Select a row to view sensor readings.</p>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow col-span-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Plant Profiles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {plantProfiles && plantProfiles.map((profile) => (
              <div
                key={profile._id}
                className={`border p-4 rounded shadow ${selectedRowId && rows && rows.find(r => r._id === selectedRowId)?.currentPlantProfile === profile._id ? "border-blue-500 ring-2 ring-blue-500" : ""}`}
              >
                <h3 className="font-bold text-lg mb-2">{profile.name}</h3>
                <p>Air Temp: {profile.parameters.airTemp}°C</p>
                <p>Water Temp: {profile.parameters.waterTemp}°C</p>
                <p>Humidity: {profile.parameters.humidity}%</p>
                <p>Light Intensity: {profile.parameters.lightIntensity} µmol/m²/s</p>
                <p>Light Duration: {profile.parameters.lightDuration} hours</p>
                <p>CO2 Level: {profile.parameters.co2Level} ppm</p>
                <p>Flow Rate: {profile.parameters.flowRate} L/min</p>
                <button
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  onClick={() => handlePlantProfileChange(profile._id)}
                  disabled={!selectedRowId || (selectedRowId && rows && rows.find(r => r._id === selectedRowId)?.currentPlantProfile === profile._id)}
                >
                  Apply Profile
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow col-span-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Active Alerts</h2>
          <ul className="space-y-2">
            {alerts && alerts.length === 0 ? (
              <li className="text-gray-900">No active alerts.</li>
            ) : (
              alerts && alerts.map((alert) => (
                <li key={alert._id} className="border-b pb-2 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{alert.type.toUpperCase()}: {alert.message}</p>
                    <p className="text-sm text-gray-900">Parameter: {alert.parameter}, Value: {alert.value}, Threshold: {alert.threshold}</p>
                    <p className="text-sm text-gray-800">System: {systems?.find(s => s._id === alert.systemId)?.name || 'N/A'}</p>
                    {alert.rowId && <p className="text-sm text-gray-800">Row: {rows?.find(r => r._id === alert.rowId)?.rowNumber || 'N/A'}</p>}
                    <p className="text-sm text-gray-800">Time: {new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    className="ml-4 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    onClick={() => handleResolveAlert(alert._id)}
                  >
                    Resolve
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-white p-4 rounded shadow col-span-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Alert Rules</h2>
          <ul className="space-y-2">
            {alertRules && alertRules.length === 0 ? (
              <li className="text-gray-900">No alert rules configured.</li>
            ) : (
              alertRules && alertRules.map((rule) => (
                <li key={rule._id} className="border-b pb-2">
                  <p className="font-semibold">Parameter: {rule.parameter}</p>
                  <p>Severity: {rule.severity}</p>
                  <p>Threshold: {rule.minThreshold !== undefined ? `Min: ${rule.minThreshold}` : ''} {rule.maxThreshold !== undefined ? `Max: ${rule.maxThreshold}` : ''}</p>
                  <p>Enabled: {rule.isEnabled ? 'Yes' : 'No'}</p>
                  <p>Notifications: {rule.notificationMethods.join(', ')}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
