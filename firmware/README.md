# Attendee Attendance Terminal Firmware

A comprehensive ESP8266-based RFID attendance tracking system with offline capabilities, real-time clock synchronization, and web-based backend integration.

## Table of Contents

1. [System Overview](#system-overview)
2. [Hardware Components](#hardware-components)
3. [Pin Configuration](#pin-configuration)
4. [Circuit Diagram](#circuit-diagram)
5. [Software Architecture](#software-architecture)
6. [Installation Guide](#installation-guide)
7. [Configuration](#configuration)
8. [Operation Manual](#operation-manual)
9. [API Documentation](#api-documentation)
10. [Troubleshooting](#troubleshooting)
11. [Development](#development)
12. [Maintenance](#maintenance)

## System Overview

The Attendee Attendance Terminal is an IoT-based attendance tracking solution designed for educational institutions, offices, and organizations. It combines RFID technology with WiFi connectivity to provide real-time attendance monitoring with robust offline capabilities.

### Key Features
- **RFID-based attendance**: 13.56MHz MIFARE card support
- **Real-time synchronization**: NTP time sync and backend integration
- **Offline resilience**: Local storage for up to 1000 records
- **Admin interface**: Rotary encoder-based menu system
- **Multi-feedback**: Visual (LCD/LED) and audio (buzzer) indicators
- **WiFi management**: Captive portal for easy network configuration
- **Automatic recovery**: Self-healing network connections

### Technical Specifications
- **Microcontroller**: ESP8266 (32-bit, 80MHz)
- **Memory**: 4MB Flash, 96KB RAM
- **Connectivity**: 802.11 b/g/n WiFi
- **Operating Voltage**: 3.3V (5V input via regulator)
- **Power Consumption**: 
  - Active: ~200mA
  - Standby: ~15mA
  - Deep Sleep: ~20µA (future implementation)
- **Operating Temperature**: -10°C to +60°C
- **Humidity**: 10-90% non-condensing

## Hardware Components

### Core Components

| Component | Model/Type | Specifications | Purpose |
|-----------|------------|----------------|---------|
| **Microcontroller** | ESP8266 NodeMCU v3 | 32-bit, 80MHz, WiFi | Main processing unit |
| **RFID Module** | RC522 | 13.56MHz, SPI interface | Card reading |
| **Display** | 1602 LCD + I2C backpack | 16x2 characters, HD44780 | Status display |
| **RTC Module** | DS3231 | ±2ppm accuracy, I2C | Timekeeping |
| **Rotary Encoder** | EC11 | 20 detents, push button | Admin navigation |
| **LEDs** | 5mm standard | Green/Red, 3.3V compatible | Status indicators |
| **Buzzer** | Active/Passive | 5V tolerant | Audio feedback |

### Power Requirements

```
Component Power Analysis:
├── ESP8266 NodeMCU: 80-200mA @ 3.3V
├── RC522 RFID: 13-26mA @ 3.3V
├── DS3231 RTC: 1.5mA @ 3.3V
├── 1602 LCD: 20-40mA @ 5V
├── LEDs (2x): 20mA @ 3.3V
└── Buzzer: 30mA @ 5V
Total: ~165-317mA (avg ~240mA)
```

**Recommended Power Supply**: 5V, 2A adapter with good regulation

### Bill of Materials (BOM)

| Qty | Component | Part Number | Supplier | Approx Cost |
|-----|-----------|-------------|----------|-------------|
| 1 | ESP8266 NodeMCU v3 | ESP8266-12E | Various | $3-5 |
| 1 | RC522 RFID Module | MFRC522 | Various | $2-3 |
| 1 | 1602 LCD with I2C | HD44780 + PCF8574 | Various | $3-4 |
| 1 | DS3231 RTC Module | DS3231SN | Various | $2-3 |
| 1 | EC11 Rotary Encoder | EC11E | Various | $1-2 |
| 2 | 5mm LEDs | - | Various | $0.20 |
| 1 | Active Buzzer | - | Various | $0.50 |
| 5 | 220Ω Resistors | - | Various | $0.25 |
| 2 | 10kΩ Resistors | - | Various | $0.10 |
| 1 | Breadboard/PCB | - | Various | $2-5 |
| - | Jumper Wires | - | Various | $2-3 |
| 1 | 5V Power Adapter | - | Various | $3-5 |
| **Total** | | | | **$20-35** |

## Pin Configuration

### NodeMCU v3 Pinout

```
NodeMCU Layout:
                    +-----------+
                    |    USB    |
                    +-----------+
                RST |  [ ]   [ ]| VU (5V)
                A0  |  [ ]   [ ]| GND
                GND |  [ ]   [ ]| 3V3
 ENCODER_SW →   D0  |  [ ]   [ ]| D1  ← RED_LED
 GREEN_LED →    D1  |  [ ]   [ ]| D2  ← BUZZER
                D2  |  [ ]   [ ]| D3  ← RST_PIN (RC522)
 RST_PIN →      D3  |  [ ]   [ ]| D4  ← SS_PIN (RC522)
 SS_PIN →       D4  |  [ ]   [ ]| 3V3
               3V3  |  [ ]   [ ]| GND
 ENCODER_CLK →  D5  |  [ ]   [ ]| D6  ← SDA_PIN (I2C)
 SDA_PIN →      D6  |  [ ]   [ ]| D7  ← SCL_PIN (I2C)
 SCL_PIN →      D7  |  [ ]   [ ]| D8  ← ENCODER_DT
 ENCODER_DT →   D8  |  [ ]   [ ]| RX
                TX  |  [ ]   [ ]| GND
               GND  |  [ ]   [ ]| 3V3
                    +-----------+
```

### Detailed Pin Mapping

| Function | NodeMCU Pin | GPIO | Direction | Notes |
|----------|-------------|------|-----------|-------|
| **RC522 RFID Module** |
| RST | D3 | GPIO0 | Output | Reset pin for RC522 |
| SDA/SS | D4 | GPIO2 | Output | Slave Select (Chip Select) |
| MOSI | D7 | GPIO13 | Output | Master Out Slave In (SPI) |
| MISO | D6 | GPIO12 | Input | Master In Slave Out (SPI) |
| SCK | D5 | GPIO14 | Output | Serial Clock (SPI) |
| **LCD Display (I2C)** |
| SDA | D6 | GPIO12 | Bidirectional | I2C Data Line |
| SCL | D7 | GPIO13 | Output | I2C Clock Line |
| **DS3231 RTC (I2C)** |
| SDA | D6 | GPIO12 | Bidirectional | Shared with LCD |
| SCL | D7 | GPIO13 | Output | Shared with LCD |
| **Rotary Encoder** |
| CLK | D5 | GPIO14 | Input | Encoder Clock Signal |
| DT | D8 | GPIO15 | Input | Encoder Data Signal |
| SW | A0 | ADC0 | Input | Push Button (Active Low) |
| **Indicators** |
| Green LED | D0 | GPIO16 | Output | Success Indicator |
| Red LED | D1 | GPIO5 | Output | Error Indicator |
| Buzzer | D2 | GPIO4 | Output | Audio Feedback |

### Alternative Pin Configuration (Wemos D1 Mini)

If using Wemos D1 Mini, update `config.h`:

```cpp
// Wemos D1 Mini Configuration
#define RST_PIN         D0    // GPIO16
#define SS_PIN          D8    // GPIO15
#define GREEN_LED       D1    // GPIO5
#define RED_LED         D2    // GPIO4
#define BUZZER          D3    // GPIO0
#define SDA_PIN         D5    // GPIO14
#define SCL_PIN         D6    // GPIO12
#define ENCODER_CLK     D7    // GPIO13
#define ENCODER_DT      D4    // GPIO2
#define ENCODER_SW      A0    // ADC0
```

## Circuit Diagram

### Schematic Overview

```
ESP8266 NodeMCU Connection Diagram:

                    ┌─────────────────┐
                    │   ESP8266       │
                    │   NodeMCU       │
                    └─────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │   RC522     │ │   DS3231    │ │   1602 LCD  │
     │   RFID      │ │   RTC       │ │   + I2C     │
     └─────────────┘ └─────────────┘ └─────────────┘
            │               │               │
     ┌─────────────┐       │        ┌─────────────┐
     │  Rotary     │       │        │  LEDs +     │
     │  Encoder    │    I2C Bus     │  Buzzer     │
     └─────────────┘       │        └─────────────┘
```

### Detailed Connections

#### RC522 RFID Module
```
RC522    NodeMCU    Notes
VCC   →  3.3V       Power (3.3V only!)
RST   →  D3         Reset control
GND   →  GND        Ground
IRQ   →  (unused)   Interrupt (optional)
MISO  →  D6         SPI Master In
MOSI  →  D7         SPI Master Out
SCK   →  D5         SPI Clock
SDA   →  D4         SPI Slave Select
```

#### 1602 LCD with I2C Backpack
```
I2C Backpack    NodeMCU    Notes
VCC          →  5V         Can use 3.3V but dimmer
GND          →  GND        Ground
SDA          →  D6         I2C Data
SCL          →  D7         I2C Clock
```

#### DS3231 RTC Module
```
DS3231    NodeMCU    Notes
VCC    →  3.3V       Power
GND    →  GND        Ground
SDA    →  D6         I2C Data (shared with LCD)
SCL    →  D7         I2C Clock (shared with LCD)
```

#### Rotary Encoder (EC11)
```
Encoder    NodeMCU    Resistor    Notes
CLK     →  D5         10kΩ pullup Optional, internal pullup used
DT      →  D8         10kΩ pullup Optional, internal pullup used
SW      →  A0         10kΩ pullup Required for button
+       →  3.3V       Power
GND     →  GND        Ground
```

#### LEDs and Buzzer
```
Component    NodeMCU    Resistor    Notes
Green LED+   D0         220Ω        Current limiting
Green LED-   GND        -           Ground
Red LED+     D1         220Ω        Current limiting  
Red LED-     GND        -           Ground
Buzzer+      D2         -           Direct connection
Buzzer-      GND        -           Ground
```

### I2C Address Configuration

Default I2C addresses (configurable in `config.h`):
- **LCD**: `0x27` (common) or `0x3F` (alternative)
- **DS3231**: `0x68` (fixed)

Use I2C scanner to detect actual addresses:
```cpp
// I2C Scanner Code
#include <Wire.h>
void setup() {
  Wire.begin();
  Serial.begin(115200);
  for(byte i = 8; i < 120; i++) {
    Wire.beginTransmission(i);
    if(Wire.endTransmission() == 0) {
      Serial.print("Found: 0x");
      Serial.println(i, HEX);
    }
  }
}
```

## Software Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Attendee Terminal                        │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                          │
│  ├── Admin Menu System                                      │
│  ├── Attendance Processing                                  │
│  ├── Display Management                                     │
│  └── Audio/Visual Feedback                                  │
├─────────────────────────────────────────────────────────────┤
│  Middleware Layer                                           │
│  ├── WiFi Manager                                           │
│  ├── HTTP Client                                            │
│  ├── JSON Processing                                        │
│  ├── Offline Storage                                        │
│  └── Time Synchronization                                   │
├─────────────────────────────────────────────────────────────┤
│  Hardware Abstraction Layer                                 │
│  ├── RFID Interface (SPI)                                   │
│  ├── LCD Interface (I2C)                                    │
│  ├── RTC Interface (I2C)                                    │
│  ├── Encoder Interface (GPIO)                               │
│  └── LED/Buzzer Control (GPIO)                              │
├─────────────────────────────────────────────────────────────┤
│  ESP8266 Hardware                                           │
│  ├── WiFi Radio                                             │
│  ├── SPI Controller                                         │
│  ├── I2C Controller                                         │
│  ├── GPIO Controller                                        │
│  └── SPIFFS File System                                     │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Main Loop Architecture
```cpp
void loop() {
    // Priority 1: Critical Functions
    checkWiFiConnection();      // Network monitoring
    handleRFIDScan();          // Card detection
    handleEncoderInput();      // User input
    
    // Priority 2: System Functions  
    updateLED();               // Status indication
    updateDisplay();           // Screen refresh
    
    // Priority 3: Background Tasks
    syncOfflineLogs();         // Data synchronization
    sendHeartbeat();           // Keep-alive
    handleAdminMenu();         // Menu navigation
    
    delay(100);                // Prevent CPU overload
}
```

#### 2. State Management
```cpp
// System States
enum SystemState {
    STATE_INITIALIZING,    // Startup phase
    STATE_CONNECTING,      // WiFi connection
    STATE_READY,          // Normal operation
    STATE_OFFLINE,        // Network disconnected
    STATE_ADMIN,          // Admin menu active
    STATE_ERROR           // Error condition
};

// LED States
enum LEDState {
    LED_OFF,              // All LEDs off
    LED_GREEN,            // Success indication
    LED_RED,              // Error indication
    LED_YELLOW,           // Offline/warning
    LED_BLINK_GREEN,      // Syncing success
    LED_BLINK_RED,        // Connection error
    LED_BLINK_YELLOW      // Offline mode
};
```

#### 3. Memory Management
```cpp
// Memory Usage Breakdown
EEPROM Storage (512 bytes):
├── Backend URL: 128 bytes (0x00-0x7F)
├── Device ID: 64 bytes (0x80-0xBF)  
├── Configuration: 64 bytes (0xC0-0xFF)
└── Reserved: 256 bytes (0x100-0x1FF)

SPIFFS Storage (~2.8MB):
├── /config.json: Device configuration
├── /offline_logs.txt: Attendance records
├── /wifi_config.json: Network settings
└── System files: ~50KB reserved
```

### Data Flow

#### Attendance Recording Flow
```
RFID Card Detected
        ↓
Validate Card Format
        ↓
Check Admin Tag → [Admin Menu]
        ↓
Generate Timestamp
        ↓
Network Available? 
    ├─ YES → Send to Backend → Success/Retry
    └─ NO  → Store Offline → Queue for Sync
        ↓
Update Display & LEDs
        ↓
Audio Feedback
        ↓
Return to Ready State
```

#### Sync Process Flow
```
Network Connected
        ↓
Check Offline Records
        ↓
Any Records? 
    ├─ NO  → Continue Normal Operation
    └─ YES → Start Sync Process
        ↓
Read Offline File
        ↓
Send Each Record → Success? 
    ├─ YES → Remove from Queue
    └─ NO  → Keep for Retry
        ↓
Update Offline Counter
        ↓
Cleanup Empty Files
```

## Installation Guide

### Prerequisites

#### Software Requirements
1. **Arduino IDE** (v1.8.19 or later)
   - Download from: https://www.arduino.cc/en/software
   - Alternative: VS Code with Arduino extension

2. **ESP8266 Board Support**
   ```
   Arduino IDE → File → Preferences
   Additional Board Manager URLs:
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   
   Tools → Board → Boards Manager
   Search: "esp8266" → Install "ESP8266" by ESP8266 Community
   ```

3. **Required Libraries**
   ```
   Arduino IDE → Tools → Manage Libraries
   Install these libraries:
   ```

| Library | Version | Author | Purpose |
|---------|---------|--------|---------|
| ESP8266WiFi | Built-in | ESP8266 Core | WiFi connectivity |
| ESP8266HTTPClient | Built-in | ESP8266 Core | HTTP requests |
| ESP8266WebServer | Built-in | ESP8266 Core | Web interface |
| WiFiManager | 2.0.16+ | tzapu | WiFi configuration |
| ArduinoJson | 6.21.0+ | Benoit Blanchon | JSON processing |
| MFRC522 | 1.4.10+ | GithubCommunity | RFID interface |
| LiquidCrystal_I2C | 1.1.2+ | Frank de Brabander | LCD control |
| RTClib | 2.1.1+ | Adafruit | RTC management |

#### Hardware Requirements
- ESP8266 development board (NodeMCU v3 recommended)
- Components as listed in BOM section
- Breadboard or custom PCB
- USB cable for programming
- 5V, 2A power supply for final deployment

### Step-by-Step Installation

#### Step 1: Hardware Assembly

1. **Power Connections**
   ```
   Power Distribution:
   NodeMCU VU (5V) → Power Bus (+)
   NodeMCU GND → Power Bus (-)
   
   All VCC pins → 5V Bus (or 3.3V for sensitive components)
   All GND pins → GND Bus
   ```

2. **I2C Bus Setup**
   ```
   I2C Connections:
   NodeMCU D6 (GPIO12) → SDA Bus
   NodeMCU D7 (GPIO13) → SCL Bus
   
   Connect to SDA Bus: LCD SDA, DS3231 SDA
   Connect to SCL Bus: LCD SCL, DS3231 SCL
   
   Add pull-up resistors (4.7kΩ) on SDA and SCL if needed
   ```

3. **SPI Bus Setup**
   ```
   SPI Connections (RC522):
   NodeMCU D5 (GPIO14) → RC522 SCK
   NodeMCU D6 (GPIO12) → RC522 MISO  
   NodeMCU D7 (GPIO13) → RC522 MOSI
   NodeMCU D4 (GPIO2)  → RC522 SDA/SS
   NodeMCU D3 (GPIO0)  → RC522 RST
   ```

4. **Digital I/O**
   ```
   GPIO Connections:
   NodeMCU D0 → Green LED (+ 220Ω resistor)
   NodeMCU D1 → Red LED (+ 220Ω resistor)  
   NodeMCU D2 → Buzzer (+)
   NodeMCU D5 → Encoder CLK
   NodeMCU D8 → Encoder DT
   NodeMCU A0 → Encoder SW (+ 10kΩ pullup)
   ```

#### Step 2: Pre-Upload Configuration

1. **Edit config.h**
   ```cpp
   // Set your backend server URL
   #define DEFAULT_BACKEND_URL "http://YOUR_SERVER_IP:3000"
   
   // Set admin RFID tag (scan a card first to get hex value)
   #define ADMIN_TAG "04A1B2C3"  // Replace with actual tag
   
   // Verify pin assignments match your wiring
   #define RST_PIN         D3
   #define SS_PIN          D4
   // ... check all pin definitions
   
   // Configure I2C address for your LCD
   #define LCD_ADDRESS     0x27  // or 0x3F
   ```

2. **Verify Hardware Connections**
   ```
   Use multimeter to check:
   ├── Power: 5V and 3.3V rails
   ├── Ground: All GND connections
   ├── I2C: SDA/SCL continuity
   ├── SPI: All RC522 connections
   └── GPIO: LED/Buzzer connections
   ```

#### Step 3: Code Upload

1. **Board Selection**
   ```
   Arduino IDE Settings:
   ├── Board: "NodeMCU 1.0 (ESP-12E Module)"
   ├── Upload Speed: "115200"
   ├── CPU Frequency: "80 MHz"
   ├── Flash Size: "4MB (FS:2MB OTA:~1019KB)"
   ├── Debug Port: "Disabled"
   └── Debug Level: "None"
   ```

2. **Compile and Upload**
   ```
   1. Open attendance_terminal.ino
   2. Verify all libraries installed (Sketch → Include Library)
   3. Select correct COM port (Tools → Port)
   4. Compile: Ctrl+R (check for errors)
   5. Upload: Ctrl+U
   6. Monitor serial output: Ctrl+Shift+M (115200 baud)
   ```

#### Step 4: Initial Setup

1. **First Boot Sequence**
   ```
   Expected Serial Output:
   === Attendee Attendance Terminal ===
   Firmware Version: 1.0.0
   Hardware initialized successfully
   Config file not found, using defaults
   Backend URL: http://192.168.1.100:3000
   Device ID: ESP_AABBCCDDEEFF
   WiFi Manager starting...
   ```

2. **WiFi Configuration**
   ```
   1. Device creates AP: "Attendee_XXXXXX"
   2. Connect phone/computer to this AP
   3. Browser auto-opens to 192.168.4.1
   4. Select your WiFi network
   5. Enter password
   6. Save configuration
   ```

3. **Time Synchronization**
   ```
   After WiFi connection:
   - NTP sync automatically occurs
   - RTC is updated with current time
   - System enters normal operation mode
   ```

#### Step 5: Testing

1. **Hardware Test Sequence**
   ```cpp
   // Test each component individually:
   
   // LCD Test
   lcd.clear();
   lcd.print("LCD Test OK");
   
   // LED Test  
   digitalWrite(GREEN_LED, HIGH);
   delay(1000);
   digitalWrite(RED_LED, HIGH);
   
   // Buzzer Test
   tone(BUZZER, 1000, 500);
   
   // RTC Test
   DateTime now = rtc.now();
   Serial.println(now.timestamp());
   
   // RFID Test
   // Present card and check serial monitor
   ```

2. **RFID Card Testing**
   ```
   1. Present any MIFARE card to reader
   2. Check serial monitor for hex output
   3. Note the tag ID for admin configuration
   4. Test card detection range (optimal: 2-4cm)
   ```

3. **Network Connectivity Test**
   ```
   Monitor serial output for:
   ├── "WiFi connected successfully"
   ├── "Time synced successfully" 
   ├── "Heartbeat successful"
   └── Backend server responses
   ```

### Configuration

#### System Configuration (config.h)

```cpp
// ========================================
// NETWORK CONFIGURATION
// ========================================
#define DEFAULT_BACKEND_URL "http://192.168.1.100:3000"  // Your server
#define NTP_SERVER "pool.ntp.org"                        // Time server
#define HEARTBEAT_INTERVAL 30000                         // 30 seconds
#define SYNC_RETRY_INTERVAL 60000                        // 1 minute

// ========================================
// HARDWARE CONFIGURATION  
// ========================================
#define LCD_ADDRESS     0x27    // I2C address (use I2C scanner if unsure)
#define LCD_COLS        16      // Characters per row
#define LCD_ROWS        2       // Number of rows

// ========================================
// SYSTEM LIMITS
// ========================================
#define MAX_OFFLINE_LOGS 1000        // Maximum offline records
#define CARD_READ_DELAY 2000         // Milliseconds between reads
#define ADMIN_MENU_TIMEOUT 30000     // Auto-exit timeout
#define EEPROM_SIZE 512              // EEPROM allocation

// ========================================
// SECURITY CONFIGURATION
// ========================================
#define ADMIN_TAG "04A1B2C3"         // Admin RFID tag (hex)
#define MIN_RFID_TAG_LENGTH 6        // Minimum tag length
#define MAX_RFID_TAG_LENGTH 20       // Maximum tag length

// ========================================
// AUDIO/VISUAL FEEDBACK
// ========================================
#define BUZZER_ENABLED true          // Enable/disable buzzer
#define BUZZER_SUCCESS_FREQ 1000     // Success tone frequency
#define BUZZER_SUCCESS_DURATION 200  // Success tone duration
#define BUZZER_ERROR_FREQ 400        // Error tone frequency
#define BUZZER_ERROR_DURATION 500    // Error tone duration
#define BUZZER_OFFLINE_FREQ 700      // Offline tone frequency
#define BUZZER_OFFLINE_DURATION 300  // Offline tone duration
```

#### Network Configuration

1. **Static IP Configuration** (Optional)
   ```cpp
   // Add to setup() function for static IP
   IPAddress local_IP(192, 168, 1, 184);
   IPAddress gateway(192, 168, 1, 1);
   IPAddress subnet(255, 255, 255, 0);
   IPAddress primaryDNS(8, 8, 8, 8);
   
   if (!WiFi.config(local_IP, gateway, subnet, primaryDNS)) {
     Serial.println("STA Failed to configure");
   }
   ```

2. **Enterprise WiFi** (WPA2-Enterprise)
   ```cpp
   // For enterprise networks, modify WiFiManager configuration
   WiFi.begin(ssid, WPA2_AUTH_PEAP, identity, username, password);
   ```

#### Admin RFID Tag Setup

1. **Finding Tag ID**
   ```
   1. Upload firmware with DEBUG_RFID enabled
   2. Present card to reader
   3. Note hex output in serial monitor:
      "RFID Tag scanned: 04A1B2C3"
   4. Update ADMIN_TAG in config.h
   5. Re-upload firmware
   ```

2. **Multiple Admin Tags** (Custom Implementation)
   ```cpp
   // In config.h, define array of admin tags
   const String ADMIN_TAGS[] = {
     "04A1B2C3",
     "045678AB", 
     "04CDEF12"
   };
   #define ADMIN_TAG_COUNT 3
   
   // Modify checkAdminTag() function
   bool isAdminTag(String tag) {
     for(int i = 0; i < ADMIN_TAG_COUNT; i++) {
       if(tag == ADMIN_TAGS[i]) return true;
     }
     return false;
   }
   ```

#### Backend Integration Configuration

The system expects a REST API backend. Configure your server endpoints:

```cpp
// API Endpoints (automatically constructed from base URL)
// POST /api/attendance - Record attendance
// GET /health - Health check
// GET /api/device/{deviceId} - Device info (future)
// POST /api/device/{deviceId}/sync - Bulk sync (future)
```

Backend server requirements:
- HTTP server supporting JSON
- CORS enabled for web management
- Attendance endpoint accepting RFID data
- Health check endpoint for connectivity

Example backend response format:
```json
// Success Response
{
  "status": "success",
  "name": "John Doe",
  "timestamp": "2025-01-15T10:30:00Z",
  "action": "check_in"
}

// Error Response  
{
  "status": "error",
  "error": "Invalid RFID tag",
  "code": 400
}
```

## Operation Manual

### System States and Display

#### Normal Operation Display
```
Line 1: [Status] [Time]
Line 2: [Last Action] [(Offline Count)]

Examples:
ON  10:30:25        # Connected, current time
John D... (5)       # Last scan: John Doe, 5 offline records

OFF 10:30:25        # Disconnected, RTC time
Offline - Stored    # Last action was stored offline

ON  10:30:25        # Connected
Ready to scan       # No recent activity
```

#### LED Status Indicators

| LED State | Meaning | Duration | Pattern |
|-----------|---------|----------|---------|
| Green Solid | Successful scan | 2 seconds | Steady on |
| Red Solid | Error/Invalid card | 2 seconds | Steady on |
| Yellow Flash | Offline mode | Continuous | Fast blink |
| Green Blink | Syncing data | During sync | Slow blink |
| Red Blink | Connection error | Continuous | Slow blink |
| All Off | Normal standby | - | - |

#### Audio Feedback

| Sound | Frequency | Duration | Meaning |
|-------|-----------|----------|---------|
| Single beep | 1000 Hz | 200ms | Successful scan |
| Double beep | 400 Hz | 500ms | Error/Invalid |
| Triple beep | 700 Hz | 300ms | Offline stored |
| Long beep | 1200 Hz | 1000ms | Admin mode entered |

### Normal Operation Procedures

#### Daily Startup
1. **Power On**
   - Connect 5V power supply
   - LCD shows boot screen for 2 seconds
   - WiFi connection attempt (up to 5 minutes)

2. **Status Verification**
   ```
   Check LCD Display:
   ├── "ON" = Connected to network
   ├── "OFF" = Offline mode
   ├── Time display = RTC working
   └── No error messages
   ```

3. **Connectivity Test**
   - LED should not be blinking red
   - Try admin menu → Network Status
   - Backend heartbeat should succeed

#### Attendance Recording

1. **Card Presentation**
   ```
   Proper Technique:
   ├── Hold card 2-4cm from RC522 module
   ├── Keep steady for 1-2 seconds
   ├── Wait for audio/visual feedback
   └── Remove card after confirmation
   ```

2. **Success Indicators**
   ```
   Successful Scan:
   ├── Green LED lights up
   ├── Single beep sound
   ├── LCD shows user name (if available)
   └── Time updates on display
   ```

3. **Error Handling**
   ```
   Common Errors:
   ├── Red LED + Double beep = Invalid card
   ├── Yellow LED + Triple beep = Stored offline
   ├── No response = Check card positioning
   └── Error message on LCD = See troubleshooting
   ```

#### End of Day Procedures

1. **Sync Verification**
   - Check offline count on display
   - If count > 0, verify network connection
   - Use admin menu to force sync if needed

2. **Data Backup** (Optional)
   - Admin menu → Offline Logs → View count
   - Ensure all records synced (count = 0)

3. **Shutdown** (Optional)
   - System can run 24/7
   - For temporary shutdown: disconnect power
   - Data preserved in RTC and SPIFFS

### Admin Menu System

#### Accessing Admin Menu
1. **Admin Card Method**
   ```
   1. Present admin RFID card to reader
   2. System beeps once (long tone)
   3. LCD shows "ADMIN 1/6"
   4. Menu becomes active for 30 seconds
   ```

2. **Navigation Controls**
   ```
   Rotary Encoder:
   ├── Rotate clockwise = Next menu item
   ├── Rotate counter-clockwise = Previous item  
   ├── Press button = Select current item
   └── No action for 30s = Auto-exit
   ```

#### Menu Structure

```
Admin Menu (6 items):
├── 1. Device Info
│   ├── Firmware version
│   ├── Device ID (last 8 chars)
│   ├── Free RAM
│   └── Uptime
├── 2. Network Status  
│   ├── WiFi status (OK/FAIL)
│   ├── IP address
│   ├── SSID name
│   └── Signal strength
├── 3. Offline Logs
│   ├── Record count
│   ├── File size
│   └── Oldest record
├── 4. Sync Logs
│   ├── Force synchronization
│   ├── Progress display
│   └── Success/failure count
├── 5. Reset WiFi
│   ├── Confirmation prompt
│   ├── Clear saved credentials
│   └── Restart device
└── 6. Restart Device
    ├── Immediate restart
    └── No confirmation
```

#### Detailed Menu Functions

**1. Device Info**
```
Display Sequence (3 screens, 2s each):
Screen 1: FW: 1.0.0 / ID: AABBCCDD
Screen 2: Free RAM: 45234 bytes  
Screen 3: Uptime: 1234 sec
```

**2. Network Status**
```
Display Sequence (3 screens, 2s each):
Screen 1: WiFi: OK / IP: 192.168.1.184
Screen 2: SSID: MyNetwork
Screen 3: Signal: -45 dBm / Backend: Online
```

**3. Offline Logs**
```
Display Sequence (2 screens, 2s each):
Screen 1: Count: 15
Screen 2: Size: 2048B / Oldest: 2h ago
```

**4. Sync Logs**
```
Real-time Progress Display:
Screen 1: Syncing logs...
Screen 2: Progress: 67%
Final: Sync complete / Success: 15/15
```

**5. Reset WiFi**
```
Confirmation Sequence:
Screen 1: Reset WiFi? / Press to confirm
Wait 5 seconds for button press
If confirmed: Resetting WiFi / Restarting...
If timeout: Cancelled
```

**6. Restart Device**
```
Immediate Action:
Screen: Restarting...
Device restarts after 1 second
```

### Offline Operation

#### Automatic Offline Mode
```
Trigger Conditions:
├── WiFi connection lost
├── Backend server unreachable  
├── HTTP timeout exceeded
└── Network authentication failed

Offline Indicators:
├── LCD shows "OFF" status
├── Yellow LED blinks continuously
├── Triple beep on card scan
└── "Offline - Stored" message
```

#### Offline Data Storage

1. **Storage Format**
   ```json
   // /offline_logs.txt - One JSON object per line
   {"rfidTag":"04A1B2C3","timestamp":"2025-01-15T10:30:00Z","deviceId":"ESP_AABBCCDDEEFF"}
   {"rfidTag":"045678AB","timestamp":"2025-01-15T10:31:15Z","deviceId":"ESP_AABBCCDDEEFF"}
   ```

2. **Storage Limits**
   ```
   Maximum Capacity:
   ├── 1000 records (configurable)
   ├── ~50KB file size
   ├── 2.8MB total SPIFFS capacity
   └── Automatic cleanup when full
   ```

3. **Storage Full Behavior**
   ```
   When limit reached:
   ├── Red LED + Error beep
   ├── "Storage full" message
   ├── No new records accepted
   └── Must sync or clear to continue
   ```

#### Sync Restoration

1. **Automatic Sync**
   ```
   Triggers:
   ├── Network connection restored
   ├── Every 60 seconds (if records exist)
   ├── After successful heartbeat
   └── Manual sync via admin menu
   ```

2. **Sync Process**
   ```
   Steps:
   ├── Read offline log file
   ├── Send each record to backend
   ├── Remove successful records from file
   ├── Retry failed records later
   └── Update offline counter
   ```

3. **Sync Monitoring**
   ```
   Progress Indicators:
   ├── Green blinking LED during sync
   ├── Offline count decreases on LCD
   ├── "Syncing..." message in admin menu
   └── Serial output for debugging
   ```

## Troubleshooting Procedures

#### Network Issues

**WiFi Connection Problems**
```
Symptoms: "OFF" status, red blinking LED
Diagnosis Steps:
1. Check router status and range
2. Verify saved credentials via admin menu
3. Check for MAC address filtering
4. Try WiFi reset (Admin Menu → Reset WiFi)

Solutions:
├── Move closer to router
├── Check WiFi password
├── Restart router
├── Factory reset device if needed
└── Check for interference (2.4GHz)
```

**Backend Server Problems**
```
Symptoms: "ON" status but sync failures
Diagnosis Steps:
1. Check backend URL in config.h
2. Verify server is running and accessible
3. Test with browser: http://server:3000/health
4. Check firewall settings

Solutions:
├── Restart backend server
├── Update server URL and re-upload firmware
├── Check network routing
└── Verify API endpoints
```

#### Hardware Issues

**RFID Reader Problems**
```
Symptoms: No card detection
Diagnosis Steps:
1. Check all SPI connections
2. Verify 3.3V power to RC522
3. Test with different cards
4. Check for interference

Solutions:
├── Re-seat connections
├── Verify wiring against pinout
├── Replace RC522 module
└── Check power supply stability
```

**LCD Display Issues**
```
Symptoms: Blank screen, garbled text
Diagnosis Steps:
1. Check I2C connections
2. Verify power supply (5V recommended)
3. Use I2C scanner to detect address
4. Check contrast adjustment

Solutions:
├── Adjust potentiometer on I2C backpack
├── Try alternative I2C address (0x3F)
├── Check for loose connections
└── Replace LCD module
```

**RTC Problems**
```
Symptoms: Incorrect time, time not persisting
Diagnosis Steps:
1. Check I2C connections (shared with LCD)
2. Verify backup battery (CR2032)
3. Test with RTC library examples
4. Check for I2C address conflicts

Solutions:
├── Replace backup battery
├── Re-seat I2C connections  
├── Manual time setting via NTP
└── Replace DS3231 module
```

#### Software Issues

**Memory Problems**
```
Symptoms: Random crashes, heap corruption
Diagnosis Steps:
1. Monitor free heap via admin menu
2. Check for memory leaks in serial output
3. Reduce offline log limit
4. Clear SPIFFS if corrupted

Solutions:
├── Restart device regularly
├── Reduce MAX_OFFLINE_LOGS
├── Factory reset to clear SPIFFS
└── Check for infinite loops in code
```

**Time Sync Issues**
```
Symptoms: Incorrect timestamps
Diagnosis Steps:
1. Check NTP server accessibility
2. Verify timezone configuration
3. Test RTC battery backup
4. Check internet connectivity

Solutions:
├── Use local NTP server
├── Manual time setting
├── Replace RTC battery
└── Verify firewall allows NTP (UDP 123)
```

## Maintenance Schedule

#### Daily Checks
- [ ] Verify LCD display shows current time
- [ ] Check offline count (should be 0 at start of day)
- [ ] Test RFID reader with known card
- [ ] Verify network connectivity (ON status)

#### Weekly Maintenance
- [ ] Check all cable connections
- [ ] Clean RFID reader surface
- [ ] Verify backup systems are working
- [ ] Review offline sync logs
- [ ] Test admin menu functions

#### Monthly Maintenance
- [ ] Check power supply stability
- [ ] Verify RTC accuracy (compare with external clock)
- [ ] Review error logs on backend
- [ ] Test WiFi reset and reconfiguration
- [ ] Backup configuration settings

#### Quarterly Maintenance  
- [ ] Replace RTC backup battery (CR2032)
- [ ] Clean dust from electronics
- [ ] Check firmware for updates
- [ ] Verify all LED/buzzer functions
- [ ] Test factory reset procedure

### Performance Optimization

#### Network Performance
```cpp
// Optimize HTTP timeouts
http.setTimeout(5000);           // 5 second timeout
http.setReuse(true);            // Keep connections alive
http.addHeader("Connection", "keep-alive");
```

#### Memory Management
```cpp
// Monitor free heap
Serial.print("Free heap: ");
Serial.println(ESP.getFreeHeap());

// Reduce memory usage
String url = String(DEFAULT_BACKEND_URL) + "/api/attendance";
```

#### Power Management (Future Enhancement)
```cpp
// Deep sleep for battery operation
ESP.deepSleep(30 * 1000000);    // Sleep 30 seconds
// Wake on GPIO interrupt for card detection
```
## API Documentation

### Backend Server Requirements

The Attendee terminal requires a REST API backend server to function. The server must support the following endpoints and data formats.

#### Base Configuration
```
Protocol: HTTP/HTTPS
Content-Type: application/json
Method: POST for data submission, GET for health checks
Response Format: JSON
```

### Core Endpoints

#### 1. Attendance Recording
```http
POST /api/attendance
Content-Type: application/json

Request Body:
{
  "rfidTag": "04A1B2C3",                    // RFID tag in hex format
  "timestamp": "2025-01-15T10:30:00Z",      // ISO 8601 UTC timestamp
  "deviceId": "ESP_AABBCCDDEEFF"            // Unique device identifier
}

Success Response (200/201):
{
  "status": "success",
  "name": "John Doe",                       // User name (optional)
  "action": "check_in",                     // Action type (optional)
  "timestamp": "2025-01-15T10:30:00Z",      // Server timestamp
  "balance": "120.50"                       // Account balance (optional)
}

Error Response (400/404/500):
{
  "status": "error",
  "error": "Invalid RFID tag",             // Error description
  "code": 400                              // HTTP status code
}
```

#### 2. Health Check
```http
GET /health

Success Response (200):
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 86400
}

Error Response (503):
{
  "status": "error",
  "error": "Service unavailable"
}
```

#### 3. Device Registration (Optional)
```http
POST /api/device/register
Content-Type: application/json

Request Body:
{
  "deviceId": "ESP_AABBCCDDEEFF",
  "firmwareVersion": "1.0.0",
  "ipAddress": "192.168.1.184",
  "macAddress": "AA:BB:CC:DD:EE:FF"
}

Response (200):
{
  "status": "success",
  "registered": true,
  "settings": {
    "syncInterval": 60,
    "maxOfflineRecords": 1000
  }
}
```

### Data Formats

#### RFID Tag Format
```
Format: Hexadecimal string (uppercase)
Length: 6-20 characters
Example: "04A1B2C3", "04123456789ABC"

Validation:
- Must contain only 0-9, A-F characters
- Length between MIN_RFID_TAG_LENGTH and MAX_RFID_TAG_LENGTH
- Case insensitive input, stored as uppercase
```

#### Timestamp Format
```
Format: ISO 8601 UTC
Example: "2025-01-15T10:30:45Z"

Generation:
DateTime now = rtc.now();
sprintf(buffer, "%04d-%02d-%02dT%02d:%02d:%02dZ", 
        now.year(), now.month(), now.day(),
        now.hour(), now.minute(), now.second());
```

#### Device ID Format
```
Format: "ESP_" + MAC address (no colons)
Example: "ESP_AABBCCDDEEFF"

Generation:
String deviceId = "ESP_" + WiFi.macAddress();
deviceId.replace(":", "");
```

### Error Handling

#### HTTP Status Codes
| Code | Meaning | Terminal Action |
|------|---------|-----------------|
| 200 | Success | Show success feedback |
| 201 | Created | Show success feedback |
| 400 | Bad Request | Show error, don't retry |
| 401 | Unauthorized | Show error, try again |
| 404 | Not Found | Show error, check config |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Store offline, retry later |
| 503 | Service Unavailable | Store offline, retry later |

#### Terminal Error Responses
```cpp
// Handle different error conditions
if (httpResponseCode == 200 || httpResponseCode == 201) {
    // Success - parse response and show user feedback
    handleSuccessResponse(response);
} else if (httpResponseCode >= 400 && httpResponseCode < 500) {
    // Client error - show error but don't store offline
    handleClientError(httpResponseCode);
} else {
    // Server error or network issue - store offline
    processOfflineAttendance(rfidTag, timestamp);
}
```

#### Retry Logic
```cpp
// Automatic retry for temporary failures
int retryCount = 0;
const int maxRetries = 3;
const int retryDelay = 5000; // 5 seconds

while (retryCount < maxRetries) {
    int result = sendAttendanceRecord(data);
    if (result == 200) break;
    
    retryCount++;
    if (retryCount < maxRetries) {
        delay(retryDelay * retryCount); // Exponential backoff
    }
}
```

#### Node.js/Express Example
```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Attendance endpoint
app.post('/api/attendance', (req, res) => {
    const { rfidTag, timestamp, deviceId } = req.body;
    
    // Validate input
    if (!rfidTag || !timestamp || !deviceId) {
        return res.status(400).json({
            status: 'error',
            error: 'Missing required fields'
        });
    }
    
    // Process attendance (your business logic here)
    const user = findUserByRfid(rfidTag);
    if (!user) {
        return res.status(404).json({
            status: 'error',
            error: 'RFID tag not found'
        });
    }
    
    // Record attendance
    recordAttendance(user, timestamp, deviceId);
    
    res.json({
        status: 'success',
        name: user.name,
        action: 'check_in',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.listen(3000, () => {
    console.log('Attendee backend running on port 3000');
});
```

#### Python/Flask Example
```python
from flask import Flask, request, jsonify
from datetime import datetime
import json

app = Flask(__name__)

@app.route('/api/attendance', methods=['POST'])
def record_attendance():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['rfidTag', 'timestamp', 'deviceId']
    if not all(field in data for field in required_fields):
        return jsonify({
            'status': 'error',
            'error': 'Missing required fields'
        }), 400
    
    rfid_tag = data['rfidTag']
    timestamp = data['timestamp']
    device_id = data['deviceId']
    
    # Your business logic here
    user = find_user_by_rfid(rfid_tag)
    if not user:
        return jsonify({
            'status': 'error',
            'error': 'RFID tag not found'
        }), 404
    
    # Record attendance
    record_user_attendance(user, timestamp, device_id)
    
    return jsonify({
        'status': 'success',
        'name': user['name'],
        'action': 'check_in',
        'timestamp': datetime.now().isoformat() + 'Z'
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat() + 'Z',
        'version': '1.0.0'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
```

### CORS Configuration
```javascript
// Enable CORS for web-based management interfaces
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
```

### Security Considerations
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Input validation
const { body, validationResult } = require('express-validator');
app.post('/api/attendance', [
    body('rfidTag').isLength({ min: 6, max: 20 }).isAlphanumeric(),
    body('timestamp').isISO8601(),
    body('deviceId').matches(/^ESP_[A-F0-9]{12}$/)
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            error: 'Invalid input data',
            details: errors.array()
        });
    }
    // Process request...
});
```

### Database Integration

#### Attendance Record Schema
```sql
-- MySQL/PostgreSQL Example
CREATE TABLE attendance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rfid_tag VARCHAR(20) NOT NULL,
    user_id INT,
    device_id VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_type ENUM('check_in', 'check_out') DEFAULT 'check_in',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_rfid_tag (rfid_tag),
    INDEX idx_timestamp (timestamp),
    INDEX idx_device_id (device_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    rfid_tag VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    department VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50),
    location VARCHAR(100),
    ip_address VARCHAR(15),
    firmware_version VARCHAR(10),
    last_seen TIMESTAMP,
    status ENUM('online', 'offline') DEFAULT 'offline'
);
```

#### MongoDB Example
```javascript
// MongoDB Schema using Mongoose
const attendanceSchema = new mongoose.Schema({
    rfidTag: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deviceId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    actionType: { type: String, enum: ['check_in', 'check_out'], default: 'check_in' },
    createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rfidTag: { type: String, unique: true, required: true },
    email: String,
    department: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});
```

### Testing and Debugging

#### API Testing with curl
```bash
# Test attendance recording
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "rfidTag": "04A1B2C3",
    "timestamp": "2025-01-15T10:30:00Z",
    "deviceId": "ESP_AABBCCDDEEFF"
  }'

# Test health check
curl -X GET http://localhost:3000/health

# Test with invalid data
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "rfidTag": "invalid",
    "timestamp": "not-a-date"
  }'
```

#### Debug Logging
```javascript
// Express middleware for request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Response logging
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
        console.log(`Response: ${res.statusCode} - ${body}`);
        originalSend.call(this, body);
    };
    next();
});
```

#### Terminal Debug Output
```cpp
// Enable detailed HTTP debugging in config.h
#define DEBUG_HTTP true

// Terminal will output:
// HTTP Request: POST /api/attendance
// Payload: {"rfidTag":"04A1B2C3",...}
// Response Code: 200
// Response Body: {"status":"success",...}
```

#### Memory Monitoring
```cpp
void printMemoryStatus() {
    Serial.println("=== Memory Status ===");
    Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());
    Serial.printf("Heap Fragmentation: %d%%\n", ESP.getHeapFragmentation());
    Serial.printf("Max Free Block: %d bytes\n", ESP.getMaxFreeBlockSize());
    
    // SPIFFS info
    FSInfo fs_info;
    SPIFFS.info(fs_info);
    Serial.printf("SPIFFS Total: %d bytes\n", fs_info.totalBytes);
    Serial.printf("SPIFFS Used: %d bytes\n", fs_info.usedBytes);
    Serial.println("=====================");
}
```

#### Network Debug Output
```cpp
void debugHTTPRequest(String url, String payload) {
    Serial.println("=== HTTP Request ===");
    Serial.println("URL: " + url);
    Serial.println("Payload: " + payload);
    Serial.printf("Free Heap Before: %d\n", ESP.getFreeHeap());
    
    // Make request...
    
    Serial.printf("Response Code: %d\n", httpResponseCode);
    Serial.println("Response: " + response);
    Serial.printf("Free Heap After: %d\n", ESP.getFreeHeap());
    Serial.println("==================");
}
```

### Performance Considerations

#### Response Time Requirements
- Target response time: < 2 seconds
- Timeout configuration: 5 seconds
- Maximum acceptable delay: 10 seconds

#### Scalability Guidelines
```
Concurrent Devices: Up to 100 terminals per server
Requests per minute: ~6000 (100 devices × 1 scan/second × 60 seconds)
Database connections: Connection pooling recommended
Caching: Redis for user lookups
Load balancing: For >100 devices
```

#### Optimization Tips
```javascript
// Use connection pooling
const mysql = require('mysql2');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'launchlog',
    password: 'password',
    database: 'attendance',
    connectionLimit: 10,
    queueLimit: 0
});

// Cache frequently accessed data
const NodeCache = require('node-cache');
const userCache = new NodeCache({ stdTTL: 600 }); // 10 minute cache

app.post('/api/attendance', async (req, res) => {
    const { rfidTag } = req.body;
    
    // Check cache first
    let user = userCache.get(rfidTag);
    if (!user) {
        // Fetch from database
        user = await getUserByRfid(rfidTag);
        if (user) {
            userCache.set(rfidTag, user);
        }
    }
    
    if (user) {
        // Record attendance
        await recordAttendance(user.id, new Date());
        res.json({ success: true, message: `Welcome ${user.name}!` });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
});
```

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For technical support and questions:
- Create an issue on the project repository
- Email: support@launchlog.com
- Documentation: See this README and inline code comments

## Changelog

### Version 2.0.0 (Current)
- Added LCD display support
- Implemented offline storage capabilities
- Enhanced admin menu system
- Improved WiFi management
- Added comprehensive error handling

### Version 1.0.0
- Initial release with basic RFID functionality
- Basic WiFi connectivity
- Simple attendance logging

---

**End of Documentation**