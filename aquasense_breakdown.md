# AquaSense: Smart Urban Farming System
## Technical Architecture & Data Flow Documentation

---

## **System Overview**

AquaSense is an intelligent multi-crop aquaponic system that combines fish farming with hydroponic plant cultivation. The system uses IoT sensors, automated controls, and real-time monitoring to optimize growing conditions for different crops simultaneously within a single stacked-row configuration.

### **Core Philosophy**
- **Sustainability**: Closed-loop water recycling system reduces water consumption by 50%
- **Efficiency**: Automated environmental control eliminates manual monitoring
- **Scalability**: Modular design supports urban farming expansion
- **Multi-crop Support**: Single system grows diverse crops (lettuce, basil, strawberries, custom profiles)

---

## **Hardware Architecture**

### **Master Controller (M5Stack Core)**
- **Function**: Central control hub and user interface
- **Communication**: ESP-NOW for local device communication, MQTT for cloud connectivity
- **User Interface**: Physical buttons (A/B/C) and rotary angle sensor for navigation
- **Display**: Shows plant profiles, environmental parameters, and system status

### **Secondary Controllers (Row Units)**
- **Function**: Individual row monitoring and sensor data collection
- **Sensors Integrated**:
  - Light sensor (LightUnit) - measures ambient light intensity
  - Environmental sensor (ENV III) - tracks humidity and air temperature
  - Angle sensor - for mechanical positioning
- **Communication**: Bi-directional with master controller via ESP-NOW and MQTT

### **Actuators & Controls**
- **LED Lighting System**: Adjustable intensity based on plant requirements
- **Ventilation Fans**: Automated airflow control for temperature regulation
- **Servo Motors**: Rotate plant rows for better accessibility and light distribution
- **Humidifiers**: Maintain optimal moisture levels

---

## **Data Communication Architecture**

### **Primary Communication: ESP-NOW**
```
Master Controller ←→ Row Controllers
- Protocol: ESP-NOW (peer-to-peer, low-latency)
- Data Format: JSON payloads
- MAC Addresses: Pre-configured peer list
- Frequency: Real-time command transmission
```

### **Secondary Communication: MQTT**
```
Controllers → MQTT Broker → Cloud Dashboard
- Broker: test.mosquitto.org (configurable)
- QoS Level: 1 (guaranteed delivery)
- Topic Structure: m5stack/row{N}/dataList
- Frequency: 5-second intervals for sensor data
```

---

## **Data Structures & Formats**

### **Plant Profile Schema**
```json
{
  "plantName": "string",
  "airTemp": "number (°C)",
  "waterTemp": "number (°C)", 
  "humidity": "number (%)",
  "lIntensity": "number (µmol/m²/s)",
  "lDuration": "number (hours)",
  "co2Level": "number (ppm)",
  "flowRate": "number (L/min)"
}
```

### **Sensor Data Schema**
```json
{
  "airTemp": "number (°C)",
  "waterTemp": "number (°C)",
  "humidity": "number (%)",
  "lIntensity": "number (µmol/m²/s)",
  "lDuration": "number (hours)",
  "co2Level": "number (ppm)",
  "flowRate": "number (L/min)"
}
```

### **Pre-configured Plant Profiles**
1. **Lettuce**: 22°C air, 18°C water, 70% humidity, 400 µmol/m²/s light, 16h duration
2. **Basil**: 25°C air, 22°C water, 65% humidity, 500 µmol/m²/s light, 14h duration
3. **Strawberry**: 20°C air, 19°C water, 75% humidity, 350 µmol/m²/s light, 12h duration
4. **Custom**: User-configurable parameters

---

## **MQTT Topic Structure**

### **Outbound Data (Sensors → Cloud)**
- `m5stack/data/row{N}/dataList` - Real-time sensor readings
- Published every 5 seconds with current environmental conditions

### **Inbound Commands (Cloud → Controllers)**
- `m5stack/row{N}/dataList` - Plant profile updates
- `m5stack/row{N}/{parameter}` - Individual parameter updates
- Supports both JSON objects and single parameter values

### **Data Flow Sequence**
1. **Master Interface**: User selects plant profile via physical controls
2. **Parameter Transmission**: Master sends profile data via ESP-NOW to target row
3. **Local Processing**: Row controller updates stored parameters
4. **Sensor Monitoring**: Continuous environmental data collection
5. **Cloud Sync**: Sensor data published to MQTT broker
6. **Dashboard Display**: Real-time visualization of system status

---

## **User Interface Navigation**

### **Master Controller Menu System**
```
Level 0: Home Screen
├── Level 1: Row Selection (Row 1/Row 2)
├── Level 2: Plant Selection (Lettuce/Basil/Strawberry/Custom)
├── Level 3: Parameter Selection
├── Level 4: Parameter Adjustment
└── Level 5: Data Transmission Confirmation
```

### **Control Mapping**
- **Button A**: Navigate forward/confirm selection
- **Button B**: Execute data transmission
- **Button C**: Navigate backward/cancel
- **Angle Sensor**: Parameter selection and value adjustment

---

## **Environmental Control Logic**

### **Automated Responses**
- **Light Control**: LED intensity adjusts based on sensor readings vs. target values
- **Temperature Control**: Fan activation for cooling, heater control for warming
- **Humidity Control**: Humidifier activation when below target threshold
- **Visual Feedback**: Status indicators show active adjustments

### **Control Algorithms**
```python
if sensor_reading < target_value:
    increase_actuator_output()
    display_status("Increasing [Parameter]")
elif sensor_reading > target_value:
    decrease_actuator_output()
    display_status("Decreasing [Parameter]")
else:
    maintain_current_state()
```

---

## **Scalability & Integration**

### **Row Expansion**
- Each row operates independently with unique MAC address
- Master controller maintains peer list for multiple rows
- MQTT topics scale with row numbering convention

### **Custom Dashboard Requirements**
- **WebSocket Connection**: For real-time data streaming
- **MQTT Client**: Subscribe to sensor data topics
- **REST API**: For historical data and configuration management
- **Authentication**: Multi-user system with role-based permissions
- **Database**: Convex backend for real-time data synchronization
- **Notifications**: Push notifications + browser sound alerts
- **Responsive Design**: Mobile-first approach for tablet/phone access

---

## **Database Architecture (Convex)**

### **Schema Design**
```typescript
// users table
{
  _id: Id<"users">,
  email: string,
  name: string,
  role: "admin" | "operator" | "viewer",
  organizationId?: Id<"organizations">,
  createdAt: number
}

// organizations table (for multi-tenant support)
{
  _id: Id<"organizations">,
  name: string,
  brandingConfig: {
    primaryColor: string,
    logo?: string,
    systemName: string // "AquaSense" or custom
  },
  subscriptionTier: "diy" | "commercial" | "enterprise"
}

// systems table
{
  _id: Id<"systems">,
  name: string,
  organizationId: Id<"organizations">,
  location: string,
  masterControllerMAC: string,
  isActive: boolean,
  createdAt: number
}

// rows table
{
  _id: Id<"rows">,
  systemId: Id<"systems">,
  rowNumber: number,
  controllerMAC: string,
  currentPlantProfile: Id<"plantProfiles">,
  isActive: boolean,
  lastSeen: number
}

// plantProfiles table
{
  _id: Id<"plantProfiles">,
  name: string,
  organizationId: Id<"organizations">,
  isDefault: boolean, // for system defaults like Lettuce, Basil
  parameters: {
    airTemp: number,
    waterTemp: number,
    humidity: number,
    lightIntensity: number,
    lightDuration: number,
    co2Level: number,
    flowRate: number,
    // Extensible for future sensors
    pH?: number,
    dissolvedOxygen?: number,
    waterLevel?: number,
    nutrients?: { n: number, p: number, k: number }
  },
  createdAt: number
}

// sensorReadings table (time-series data)
{
  _id: Id<"sensorReadings">,
  rowId: Id<"rows">,
  timestamp: number,
  data: {
    airTemp: number,
    waterTemp: number,
    humidity: number,
    lightIntensity: number,
    // Extensible sensor data
    pH?: number,
    dissolvedOxygen?: number,
    waterLevel?: number,
    flowRate?: number
  }
}

// alerts table
{
  _id: Id<"alerts">,
  systemId: Id<"systems">,
  rowId?: Id<"rows">,
  type: "warning" | "critical" | "info",
  parameter: string,
  message: string,
  value: number,
  threshold: number,
  isResolved: boolean,
  createdAt: number,
  resolvedAt?: number
}

// alertRules table
{
  _id: Id<"alertRules">,
  systemId: Id<"systems">,
  parameter: string,
  minThreshold?: number,
  maxThreshold?: number,
  severity: "warning" | "critical",
  isEnabled: boolean,
  notificationMethods: ("push" | "sound" | "email")[]
}
```

---

## **Technical Specifications**

### **Network Requirements**
- WiFi: 2.4GHz network access for MQTT connectivity
- Bandwidth: Minimal (< 1KB per transmission)
- Latency: ESP-NOW provides <10ms local communication

### **Power Consumption**
- Master Controller: ~200mA active, ~50mA standby
- Row Controllers: ~150mA with sensors active
- Actuators: Variable based on environmental conditions

### **Environmental Operating Range**
- Temperature: 0-60°C
- Humidity: 10-90% RH
- Light Levels: 0-1000 µmol/m²/s measurement range

---

## **User Permission System**

### **Role-Based Access Control**
```typescript
// Permission levels
type UserRole = "admin" | "operator" | "viewer";

interface Permissions {
  admin: {
    systems: ["create", "read", "update", "delete"],
    rows: ["create", "read", "update", "delete"], 
    plantProfiles: ["create", "read", "update", "delete"],
    users: ["create", "read", "update", "delete"],
    alerts: ["create", "read", "update", "delete", "configure"],
    exports: ["full_access"],
    branding: ["update"]
  },
  operator: {
    systems: ["read"],
    rows: ["read", "update"], // Can change plant profiles
    plantProfiles: ["create", "read", "update"], // Can't delete defaults
    alerts: ["read", "resolve"],
    exports: ["sensor_data_only"]
  },
  viewer: {
    systems: ["read"],
    rows: ["read"],
    plantProfiles: ["read"],
    alerts: ["read"],
    exports: ["sensor_data_only"]
  }
}
```

---

## **Notification System**

### **Push Notifications**
- **Service**: Web Push API + Service Worker
- **Triggers**: Threshold breaches, system offline, profile changes
- **Customization**: Per-user notification preferences
- **Batching**: Group similar alerts to prevent spam

### **Sound Alerts**
- **Browser-based**: Audio cues for critical alerts
- **Customizable**: Different sounds for different alert types
- **Progressive**: Escalating alert sounds for unresolved issues

### **Alert Configuration**
```json
{
  "alertRules": {
    "temperature": {
      "enabled": true,
      "minThreshold": 15,
      "maxThreshold": 35,
      "severity": "warning",
      "notifications": ["push", "sound"]
    },
    "humidity": {
      "enabled": true,
      "minThreshold": 40,
      "maxThreshold": 90,
      "severity": "critical",
      "notifications": ["push", "sound"]
    }
  }
}
```

---

## **Extensible Sensor Architecture**

### **Future Sensor Support**
The system is designed to accommodate additional sensors without breaking changes:

#### **Planned Sensor Expansions**
- **pH Sensors**: Water acidity monitoring (optimal range: 5.5-6.5)
- **Dissolved Oxygen**: Fish health monitoring (minimum 4-5 mg/L)
- **Water Level**: Tank monitoring and automatic refill triggers
- **Nutrient Sensors**: NPK (Nitrogen, Phosphorus, Potassium) levels
- **Water Flow Sensors**: Pump performance and blockage detection
- **Camera Sensors**: Visual plant health monitoring with AI analysis

#### **Sensor Data Schema (Extensible)**
```typescript
interface SensorData {
  // Current sensors
  airTemp: number;
  waterTemp: number;
  humidity: number;
  lightIntensity: number;
  
  // Future sensors (optional)
  pH?: number;
  dissolvedOxygen?: number;
  waterLevel?: number;
  nutrients?: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  flowRate?: number;
  
  // AI-analyzed data
  plantHealth?: {
    leafColor: "healthy" | "yellowing" | "browning";
    growthRate: number;
    pestDetection: boolean;
  };

  // Custom sensor support
  [customSensorKey: string]: any;
}
```

---

## **White-Label & Branding System**

### **Configurable Branding**
```typescript
interface BrandingConfig {
  systemName: string; // "AquaSense", "GrowTech", "FarmBot", etc.
  primaryColor: string; // Hex color for UI theming
  secondaryColor: string;
  logo: {
    url: string;
    darkModeUrl?: string;
    favicon?: string;
  };
  companyName: string;
  supportEmail: string;
  customDomain?: string; // e.g., "dashboard.yourgrowtech.com"
  features: {
    showPoweredBy: boolean; // "Powered by AquaSense"
    allowAPIAccess: boolean;
    maxSystems: number;
    maxRows: number;
  };
}
```

### **Theme System**
```css
:root {
  --brand-primary: var(--custom-primary, #54ca2c);
  --brand-secondary: var(--custom-secondary, #32637e);
  --brand-background: var(--custom-background, #5a2a2a);
  --brand-accent: var(--custom-accent, #8d1a5c);
  --brand-alert: var(--custom-alert, #ce4a4a);
}
```

---

## **Commercial vs DIY Deployment**

### **Feature Differentiation**
```typescript
interface SubscriptionTiers {
  diy: {
    maxSystems: 1;
    maxRows: 4;
    apiRateLimit: 100; // requests/hour
    features: ["basic_monitoring", "csv_export"];
    support: "community";
  };
  commercial: {
    maxSystems: 10;
    maxRows: 50;
    apiRateLimit: 1000;
    features: ["advanced_analytics", "custom_alerts", "white_labeling"];
    support: "email";
  };
  enterprise: {
    maxSystems: "unlimited";
    maxRows: "unlimited";
    apiRateLimit: "unlimited";
    features: ["full_api", "custom_integrations", "dedicated_support"];
    support: "phone + dedicated_manager";
  };
}
```

### **Open Source Components**
- **Hardware Schematics**: Fully open for DIY builders
- **Firmware Code**: MIT licensed M5Stack code
- **Basic Web Client**: Open source dashboard for personal use
- **API Documentation**: Complete public API specs
- **3D Models**: Printable enclosures and mounting hardware

---

## **Data Export & Analytics**

### **CSV Export Features**
```typescript
interface ExportOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  systems?: string[]; // Filter by system IDs
  rows?: string[]; // Filter by row IDs
  parameters?: string[]; // Select specific sensor data
  aggregation?: "raw" | "hourly" | "daily" | "weekly";
  format: "csv" | "json"; // Future: Excel, PDF reports
}

// Generated CSV structure
{
  timestamp: "2025-06-20T10:30:00Z",
  system_name: "Greenhouse Alpha",
  row_number: 1,
  plant_profile: "Lettuce",
  air_temp: 23.5,
  water_temp: 19.2,
  humidity: 68,
  light_intensity: 420,
  ph: 6.1, // if available
  dissolved_oxygen: 7.2 // if available
}
```

### **Analytics Dashboard**
- **Trend Analysis**: Growth patterns over time
- **Efficiency Metrics**: Water usage, energy consumption
- **Yield Predictions**: AI-powered harvest forecasting
- **Comparative Analysis**: Performance across different plant profiles
- **Alert History**: Pattern recognition for preventive maintenance

---

## **Integration Points for Development**

### **Frontend Requirements**
- **Framework**: React/Next.js with Convex integration
- **Real-time**: Convex subscriptions for live data
- **Charts**: Recharts or Chart.js for sensor visualizations
- **Notifications**: Service Worker + Web Push
- **PWA**: Installable web app with offline-capable UI
- **Responsive**: Tailwind CSS for mobile-first design

### **Backend Services**
- **Database**: Convex for real-time sync
- **MQTT Bridge**: Service to sync MQTT data to Convex
- **File Storage**: For exports, logos, and documentation
- **Authentication**: Auth0 or similar (integrate with existing system)
- **Push Service**: Firebase Cloud Messaging or OneSignal

### **Deployment Architecture**
```
IoT Devices (M5Stack) 
    ↓ MQTT
MQTT Broker (mosquitto)
    ↓ Bridge Service
Convex Database
    ↓ Real-time sync
Web Dashboard (Vercel/Netlify)
    ↓ API calls
Authentication Service
    ↓ Push notifications
Mobile/Desktop Clients
```

### **API Architecture (Convex + REST)**

#### **Convex Queries & Mutations**
```typescript
// Real-time data subscriptions
export const getSensorReadings = query({
  args: { rowId: v.id("rows"), timeRange: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Return live sensor data with real-time updates
  }
});

export const updatePlantProfile = mutation({
  args: { rowId: v.id("rows"), profileId: v.id("plantProfiles") },
  handler: async (ctx, args) => {
    // Update row configuration and trigger MQTT command
  }
});
```

#### **Public REST API (for DIY/Open Source)**
```
Authentication: Bearer token or API key

# System Management
GET    /api/v1/systems                    # List user's systems
POST   /api/v1/systems                    # Create new system
GET    /api/v1/systems/{id}               # Get system details
PUT    /api/v1/systems/{id}               # Update system config

# Row Management  
GET    /api/v1/systems/{id}/rows          # List system rows
POST   /api/v1/systems/{id}/rows          # Add new row
GET    /api/v1/rows/{id}/status           # Current row status
PUT    /api/v1/rows/{id}/profile          # Update plant profile

# Sensor Data
GET    /api/v1/rows/{id}/readings         # Historical sensor data
GET    /api/v1/rows/{id}/readings/export  # CSV export
POST   /api/v1/rows/{id}/readings         # Bulk import (for testing)

# Plant Profiles
GET    /api/v1/plant-profiles             # List available profiles
POST   /api/v1/plant-profiles             # Create custom profile
PUT    /api/v1/plant-profiles/{id}        # Update profile
DELETE /api/v1/plant-profiles/{id}        # Delete custom profile

# Alerts & Notifications
GET    /api/v1/systems/{id}/alerts        # Active alerts
POST   /api/v1/systems/{id}/alert-rules   # Configure thresholds
PUT    /api/v1/alerts/{id}/resolve        # Mark alert as resolved

# Data Export
GET    /api/v1/export/sensor-data         # CSV export with filters
GET    /api/v1/export/system-report       # Full system report
```

#### **Webhook Support (for Integrations)**
```
POST /webhooks/sensor-data    # Real-time sensor updates
POST /webhooks/alerts         # Alert notifications
POST /webhooks/system-events  # System status changes
```

---

## **Visual Design Guidelines**

### **Color Scheme**
- **Primary**: Green (#54ca2c) - represents growth and sustainability
- **Secondary**: Blue-grey (#32637e) - technical/water elements  
- **Background**: Dark grey (#5a2a2a) - professional interface
- **Accent**: Purple (#8d1a5c) - status highlights
- **Alert**: Red (#ce4a4a) - warnings and adjustments

### **Typography**
- Interface uses DejaVu font family for consistency
- Size hierarchy: 24px (headers), 18px (labels), 12px (data values)

### **UI Patterns**
- Status indicators with color-coded states
- Real-time data updates with smooth transitions
- Card-based layout for modular information display
- Progressive disclosure for complex parameter settings

---

*This documentation provides the foundation for developing custom dashboards, mobile applications, and extended functionality for the AquaSense smart farming system.*