# MQTT Implementation Guide - Smart Urban Farming Aquaponics

## Overview

This document outlines the MQTT implementation for the Smart Urban Farming Powered by Aquaponics project. The system uses MQTT for wireless communication between a master controller and multiple row controllers, enabling remote monitoring and control of environmental parameters for different plant types.

## System Architecture

### Components
- **Master Controller (M5Stack)**: Central control unit that manages plant profiles and sends configuration data
- **Secondary Controllers (M5Stack)**: Row-specific controllers that monitor sensors and receive configuration updates
- **MQTT Broker**: Public broker (test.mosquitto.org) for message routing
- **ESP-NOW**: Backup communication protocol for direct device-to-device communication

## MQTT Configuration

### Connection Settings
```python
# MQTT Broker Configuration
MQTT_BROKER = 'test.mosquitto.org'
MQTT_PORT = 1883
MQTT_USER = ''  # No authentication required for test broker
MQTT_PASSWORD = ''
MQTT_KEEPALIVE = 60
CLIENT_ID_MASTER = 'TacoMaster'
CLIENT_ID_SECONDARY = 'Subscriber'
```

### WiFi Configuration
```python
SSID = 'WIFI'
WLAN_PW = 'WIFI_PASSWORD'
```

## Topic Structure

The system uses a hierarchical topic structure to organize communication:

### Master to Secondary Communication
- **Topic Pattern**: `m5stack/row{ROW_NO}/dataList`
- **Purpose**: Send plant configuration parameters from master to specific rows
- **Example**: `m5stack/row1/dataList`, `m5stack/row2/dataList`

### Secondary to Master Communication  
- **Topic Pattern**: `m5stack/data/row{ROW_NO}/dataList`
- **Purpose**: Send sensor data from rows back to monitoring system
- **Example**: `m5stack/data/row1/dataList`, `m5stack/data/row2/dataList`

### Subscription Patterns
- **Secondary Controllers Subscribe To**: `m5stack/row{ROW_NO}/#`
- **This allows receiving**: All messages for their specific row number

## Message Formats

### Plant Configuration Message (Master → Secondary)
```json
{
  "plantName": "Lettuce",
  "airTemp": 22,
  "waterTemp": 18,
  "humidity": 70,
  "lIntensity": 400,
  "lDuration": 16,
  "co2Level": 400,
  "flowRate": 1.0
}
```

### Sensor Data Message (Secondary → Master)
```json
{
  "airTemp": 24.5,
  "waterTemp": 19.2,
  "humidity": 68.3,
  "lIntensity": 450,
  "lDuration": 16,
  "co2Level": 420.1,
  "flowRate": 1.1
}
```

## Master Controller Implementation

### MQTT Client Setup
```python
def setup_mqtt():
    global mqtt_client, wlan
    
    # Connect to WiFi
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(SSID, WLAN_PW)
    
    while not wlan.isconnected():
        print("Connecting to Wi-Fi...")
        time.sleep(1)
    
    # Initialize MQTT client
    mqtt_client = MQTTClient('TacoMaster', 'test.mosquitto.org', 
                           port=1883, user='', password='', keepalive=60)
    mqtt_client.connect()
    print("MQTT connected")
```

### Publishing Plant Configurations
```python
def send_data(rowNo, plantName, airTemp, waterTemp, humidity, 
              lightIntensity, lightDuration, co2Level, flowRate):
    
    # Create data dictionary
    rowData = {
        "plantName": plantName,
        "airTemp": airTemp,
        "waterTemp": waterTemp,
        "humidity": humidity,
        "lIntensity": lightIntensity,
        "lDuration": lightDuration,
        "co2Level": co2Level,
        "flowRate": flowRate,
    }
    
    # Convert to JSON and publish
    json_data = json.dumps(rowData)
    topic = f'm5stack/row{rowNo}/dataList'
    publish_with_retry(topic, json_data)
```

### Retry Logic for Reliability
```python
def publish_with_retry(topic, message, retries=3):
    global mqtt_client
    
    for attempt in range(retries):
        try:
            mqtt_client.publish(topic, message, qos=1)
            print(f"Published: {message} to {topic}")
            return
        except Exception as e:
            print(f"Publish failed ({attempt + 1}/{retries}): {e}")
            if not reconnect_mqtt():
                break
    
    print("Failed to publish message after retries")

def reconnect_mqtt():
    global mqtt_client
    try:
        mqtt_client.connect()
        print("MQTT reconnected")
        return True
    except Exception as e:
        print(f"Failed to reconnect MQTT: {e}")
        return False
```

## Secondary Controller Implementation

### MQTT Client Setup and Subscription
```python
def setup_mqtt():
    global mqtt_client
    
    try:
        mqtt_client = MQTTClient('Subscriber', 'test.mosquitto.org', port=1883)
        mqtt_client.set_callback(mqtt_callback)
        mqtt_client.connect()
        mqtt_client.subscribe(f'm5stack/row{ROW_NO}/#')
        print(f"Subscribed to topic: m5stack/row{ROW_NO}/#")
    except Exception as e:
        print(f"MQTT connection error: {str(e)}")
```

### Message Processing
```python
def mqtt_callback(topic, msg):
    try:
        topic = topic.decode('utf-8')
        msg = msg.decode('utf-8')
        print(f"Received MQTT message on topic {topic}: {msg}")
        
        # Parse topic to identify row and parameter
        topic_parts = topic.split('/')
        if len(topic_parts) >= 3 and topic_parts[1] == f"row{ROW_NO}":
            param_name = topic_parts[2]
            
            # Handle JSON payloads
            if msg.startswith('{') and msg.endswith('}'):
                try:
                    json_data = json.loads(msg)
                    stored_params.update(json_data)
                    print(f"Updated parameters: {json_data}")
                except json.JSONDecodeError as e:
                    print(f"JSON decoding error: {e}")
            else:
                # Handle single parameter updates
                if param_name in stored_params:
                    stored_params[param_name] = (
                        float(msg) if msg.replace('.', '', 1).isdigit() else msg
                    )
                    print(f"Updated {param_name} to {stored_params[param_name]}")
            
            # Update display with new parameters
            DataDisplay()
            
    except Exception as e:
        print(f"MQTT callback error: {e}")
```

### Sensor Data Publishing
```python
def timer0_cb(t):
    """Timer callback to publish sensor data regularly"""
    try:
        json_data = json.dumps(sensor_data)
        topic = f'm5stack/data/row{ROW_NO}/dataList'
        publish_with_retry(topic, json_data)
    except Exception as e:
        print(f"Publish error: {e}")
```

## Plant Profile Management

### Predefined Plant Profiles
```python
plant_profiles = {
    'Lettuce': {
        'plantName': 'Lettuce', 
        'airTemp': 22, 
        'waterTemp': 18, 
        'humidity': 70, 
        'lightIntensity': 400, 
        'lightDuration': 16, 
        'co2Level': 400, 
        'flowRate': 1
    },
    'Basil': {
        'plantName': 'Basil', 
        'airTemp': 25, 
        'waterTemp': 22, 
        'humidity': 65, 
        'lightIntensity': 500, 
        'lightDuration': 14, 
        'co2Level': 450, 
        'flowRate': 1.2
    },
    'Strawberry': {
        'plantName': 'Strawberry', 
        'airTemp': 20, 
        'waterTemp': 19, 
        'humidity': 75, 
        'lightIntensity': 350, 
        'lightDuration': 12, 
        'co2Level': 350, 
        'flowRate': 1.5
    },
    'CUSTOM': {
        'plantName': 'CUSTOM', 
        'airTemp': 0, 
        'waterTemp': 0, 
        'humidity': 0, 
        'lightIntensity': 0, 
        'lightDuration': 0, 
        'co2Level': 0, 
        'flowRate': 0
    }
}
```

## Error Handling and Reliability Features

### Connection Monitoring
```python
def check_mqtt_connection():
    global mqtt_client, wlan
    
    # Check WiFi connection
    if not wlan.isconnected():
        print("Wi-Fi not connected")
        return False
    
    # Attempt to reconnect MQTT if needed
    try:
        mqtt_client.ping()
        return True
    except:
        return reconnect_mqtt()
```

### Dual Communication Strategy
The system implements both MQTT and ESP-NOW protocols:
- **MQTT**: Primary communication method for internet-connected operation
- **ESP-NOW**: Backup direct communication for local operation when internet is unavailable

### Quality of Service
- **QoS Level 1**: Used for critical plant configuration messages to ensure delivery
- **Retain**: Not used in this implementation, but could be added for persistent parameter storage

## Timing and Scheduling

### Master Controller Timing
- **Parameter Updates**: Triggered by user interaction (button presses)
- **Transmission**: 500ms timer checks for pending data to send

### Secondary Controller Timing
- **Sensor Reading**: Every 10 seconds in main loop
- **MQTT Publishing**: Every 5 seconds via timer callback
- **Display Updates**: After receiving new configuration data

## Security Considerations

### Current Implementation
- Uses public MQTT broker (test.mosquitto.org)
- No authentication or encryption
- Suitable for development and testing only

### Production Recommendations
- Use private MQTT broker with authentication
- Implement TLS/SSL encryption
- Add device certificates for authentication
- Use unique client IDs and topic prefixes per deployment

## Troubleshooting Common Issues

### Connection Problems
1. **WiFi Connection Failures**
   - Verify SSID and password
   - Check signal strength
   - Ensure 2.4GHz network compatibility

2. **MQTT Connection Failures**
   - Verify broker address and port
   - Check internet connectivity
   - Monitor broker availability

3. **Message Delivery Issues**
   - Check topic subscription patterns
   - Verify JSON message format
   - Monitor QoS settings

### Debugging Tools
```python
# Enable detailed logging
def debug_mqtt_status():
    print(f"WiFi Connected: {wlan.isconnected()}")
    print(f"MQTT Client: {mqtt_client}")
    print(f"Subscribed Topics: m5stack/row{ROW_NO}/#")
```

## Future Enhancements

### Potential Improvements
1. **Message Authentication**: Add HMAC signatures to prevent tampering
2. **Data Persistence**: Store configuration in non-volatile memory
3. **Over-the-Air Updates**: Use MQTT for firmware updates
4. **Advanced Analytics**: Send historical data for trend analysis
5. **Mobile App Integration**: Create smartphone interface using MQTT
6. **Multi-Broker Support**: Implement broker failover for redundancy

### Scalability Considerations
- **Topic Namespacing**: Add farm/greenhouse identifiers for multi-site deployments
- **Load Balancing**: Distribute MQTT load across multiple brokers
- **Message Compression**: Reduce bandwidth usage for large deployments

## Conclusion

The MQTT implementation provides a robust, scalable foundation for the smart aquaponics system. The combination of reliable messaging, automatic retry logic, and dual communication protocols ensures consistent operation while maintaining flexibility for future enhancements. The hierarchical topic structure and JSON message format make the system easy to extend and integrate with other IoT platforms.