/*
 * Attendee ESP8266 Attendance Terminal v2.0
 * Hardware: ESP8266, RC522 RFID, 1602 LCD, DS3231 RTC, LEDs, Buzzer
 * Author: Attendee Team
 * Version: 2.0.0 - Web-based admin, LittleFS-only storage, MFRC522v2, EEPROM migration
 * 
 * =================================================================
 * FIRMWARE FEATURES & CAPABILITIES
 * =================================================================
 * 
 * ✓ Web-based device administration interface
 * ✓ LittleFS-based configuration and data storage
 * ✓ MFRC522v2 RFID library support with enhanced reliability
 * ✓ Offline attendance logging with automatic sync
 * ✓ Real-time device status monitoring and health checks
 * ✓ WiFi network switching capabilities
 * ✓ Startup reset options (WiFi and configuration)
 * ✓ Comprehensive error handling and user feedback
 * ✓ CORS-enabled REST API for frontend integration
 * ✓ One-time EEPROM to LittleFS migration for legacy devices
 * ✓ State-based LCD and LED management with smooth transitions
 * 
 * =================================================================
 * EEPROM MIGRATION TO LITTLEFS
 * =================================================================
 * 
 * This firmware eliminates EEPROM usage and migrates to LittleFS-based configuration.
 * - All new configurations are stored in LittleFS JSON files
 * - One-time migration routine preserves existing EEPROM data
 * - After migration, EEPROM is cleared and no longer used
 * - Provides full backward compatibility for legacy devices
 * 
 * =================================================================
 * SOURCE FILES DOCUMENTATION
 * =================================================================
 * 
 * Core Firmware Files:
 * -------------------
 * • attendance_terminal.ino    - Main firmware file with setup(), loop(), and core logic
 *                               Handles RFID scanning, attendance processing, web server
 *                               Contains WiFi management, offline sync, and LCD display
 * 
 * • utils.cpp                  - Utility functions and helper methods
 *                               File system operations, configuration management
 *                               String formatting, validation, logging functions
 * 
 * • utils.h                    - Header file declaring utility functions
 *                               Function prototypes and external declarations
 * 
 * Configuration Files:
 * ------------------
 * • config.h                   - Hardware pin definitions and system constants
 *                               Network settings, file paths, timing parameters
 *                               Configurable values for different hardware setups
 * 
 * Legacy/Archive Files:
 * -------------------
 * • archived_features.h        - Archived EC11 encoder and admin menu code
 *                               Preserved for reference, not used in current build
 *                               Contains hardware-based admin interface functions
 * 
 * File System:
 * -----------
 * • /config.json              - Device configuration stored in LittleFS
 *                               Backend URL, device ID, settings persistence
 * 
 * • /offline_logs.txt          - Offline attendance records in LittleFS
 *                               JSON-formatted attendance data for sync
 * 
 * Web API Endpoints:
 * -----------------
 * • GET  /api/config           - Retrieve device configuration
 * • POST /api/config           - Update device configuration
 * • GET  /api/status           - Get comprehensive device status
 * • GET  /api/logs             - Get offline logs information
 * • POST /api/actions/sync     - Force sync offline logs
 * • POST /api/actions/heartbeat - Force send heartbeat to backend
 * • POST /api/actions/reset-wifi - Reset WiFi credentials
 * • POST /api/actions/restart  - Restart device
 * • POST /api/actions/switch-network - Switch WiFi network with credentials
 * • GET  /api/firmware/list    - Get list of firmware files
 * • GET  /api/firmware/download - Download specific firmware file
 * 
 * Backend API Endpoints (Expected):
 * ---------------------------------
 * • POST /attendance           - Submit attendance record
 * • POST /api/device/heartbeat - Receive device heartbeat with status
 * • GET  /health              - Basic health check (legacy)
 * 
 * Key Features:
 * ------------
 * ✓ Web-based device administration (replaces hardware admin menu)
 * ✓ Direct LittleFS file system (migrated from SPIFFS)
 * ✓ MFRC522v2 library support for improved RFID performance
 * ✓ Offline attendance logging with automatic sync
 * ✓ Real-time device status monitoring via web interface
 * ✓ WiFi network switching without config portal
 * ✓ Comprehensive error handling and LCD feedback
 * ✓ CORS-enabled REST API for frontend integration
 * 
 * Hardware Requirements:
 * --------------------
 * • ESP8266 microcontroller (NodeMCU, Wemos D1 Mini, etc.)
 * • RC522 RFID reader module
 * • 16x2 I2C LCD display
 * • DS3231 Real-Time Clock module
 * • LEDs (Green/Red status indicators)
 * • Buzzer for audio feedback
 * • Breadboard/PCB and connecting wires
 * 
 * =================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WebServer.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Wire.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include <EEPROM.h>           // DEPRECATED: Only used for one-time migration from EEPROM to LittleFS
#include <LittleFS.h>
#include <FS.h>
#include <string.h>
#include <math.h>

// Include configuration and utilities
#include "config.h"
#include "utils.h"

// Web server for configuration endpoints
ESP8266WebServer configServer(80);

// ========================================
// FUNCTION DECLARATIONS
// ========================================

// ----- Core System Functions -----
bool initializeHardware();
void initializeWiFi();
void loadConfiguration();
void performEEPROMMigration();
void loadOfflineLogsCount();
void setupConfigurationEndpoints();

// ----- Network and Connectivity -----
void checkWiFiConnection();
void sendHeartbeat();
void warmupHTTPSConnection();

// ----- RFID and Attendance Processing -----
void handleRFIDScan();
String scanRFIDCard();
void processOnlineAttendance(String rfidTag, String timestamp);
void processOfflineAttendance(String rfidTag, String timestamp);
void handleSuccessfulAttendance(String response, String timestamp);
void handleBadRequestAttendance(String response);
void handleAttendanceError(String error);

// ----- Data Sync and Logging -----
void syncOfflineLogs();
bool syncSingleLog(String logEntry);

// ----- Display Management -----
void updateDisplay();
void displayMainScreen();
void updateLCDDisplay();

// ----- Hardware Control -----
void updateLED();

// ----- Configuration Management -----
bool loadJsonConfiguration();
bool saveConfiguration();

// ----- Web API Handlers -----
void sendCORSHeaders();
void handleGetConfiguration();
void handleUpdateConfiguration();
void handleGetDeviceStatus();
void handleForceSyncLogs();
void handleForceHeartbeat();
void handleResetWiFi();
void handleRestartDevice();
void handleSwitchNetwork();
void handleGetLogsInfo();
void handleGetFirmwareList();
void handleDownloadFirmware();
void handleNotFound();

// ========================================
// GLOBAL OBJECTS - UPDATED FOR MFRC522v2
// ========================================

// RFID setup with proper pin configuration
MFRC522DriverPinSimple ss_pin(RFID_SS_PIN);
MFRC522DriverSPI driver(ss_pin);
MFRC522 mfrc522(driver);

// Other hardware objects
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);
RTC_DS3231 rtc;
WiFiClient wifiClient;        // For HTTP connections
WiFiClientSecure wifiClientSecure;  // For HTTPS connections
HTTPClient http;

// Connection optimization flags
bool sslSessionValid = false;

// ========================================
// GLOBAL VARIABLES
// ========================================

// ----- Configuration Variables -----
String backendUrl = DEFAULT_BACKEND_URL;
String deviceId = "";

// ----- Attendance Tracking Variables -----
String lastScannedName = "";
String lastScannedTime = "";
String lastScannedMessage = "";
int offlineLogsCount = 0;
unsigned long lastCardScan = 0;

// ----- RFID Watchdog/Maintenance Variables -----
unsigned long lastRFIDMaintenance = 0;   // last periodic re-init
unsigned long lastRFIDActivity = 0;      // updated on each detection/read
int consecutiveRFIDReadFailures = 0;     // to trigger soft reset on repeated failures

// ----- Network and Communication Variables -----
bool isOnline = false;
unsigned long lastHeartbeat = 0;
unsigned long lastSyncAttempt = 0;
// Track whether configServer has been started after connecting to WiFi
bool configServerStarted = false;
// Track periodic reconnect attempts when running offline
unsigned long lastPeriodicReconnectAttempt = 0;

// ========================================
// NOTE: ARCHIVED FEATURES
// ========================================
// Encoder and Admin Menu variables have been ARCHIVED
// See archived_features.h for the complete implementation
// This keeps the main firmware lean while preserving
// the hardware admin interface for reference

// ----- LCD State Management Variables -----
LCDState currentLcdState = LCD_MAIN_SCREEN;
unsigned long lcdStateStart = 0;
String lcdParam1 = "";
String lcdParam2 = "";
int lcdProgressCounter = 0;

// ----- LED State Management Variables -----
LEDState currentLedState = LED_OFF;
unsigned long ledBlinkTimer = 0;
unsigned long ledStateStart = 0;
bool ledBlinkOn = false;

// ----- System Status Variables -----
bool systemInitialized = false;
unsigned long systemStartTime = 0;

// ----- Configuration Mode Variables -----
bool configurationMode = false;
unsigned long configModeStartTime = 0;

// ========================================
// SETUP FUNCTION
// ========================================

void setup() {
  Serial.begin(DEBUG_BAUD_RATE);
  Serial.println();
  Serial.println("=== Attendee Attendance Terminal v2.0 ===");
  Serial.println("Firmware Version: " + String(FIRMWARE_VERSION));
  Serial.println("Updated for MFRC522v2 library");
  
  systemStartTime = millis();
  
  // Initialize hardware in correct order
  if (!initializeHardware()) {
    Serial.println("CRITICAL: Hardware initialization failed!");
    setLCDState(LCD_ERROR, "Hardware Error");
    return;
  }

  // Initialize file system with LittleFS
  Serial.println("Initializing file system (LittleFS)...");
  if (!LittleFS.begin()) {
    Serial.println("LittleFS initialization failed, attempting format...");
    if (LittleFS.format()) {
      Serial.println("LittleFS formatted successfully");
      if (!LittleFS.begin()) {
        Serial.println("CRITICAL: LittleFS initialization failed after format!");
        
        // Show error on LCD
        setLCDState(LCD_FS_ERROR);
        delay(2000);
      } else {
        Serial.println("LittleFS initialized successfully after format");
      }
    } else {
      Serial.println("CRITICAL: LittleFS format failed!");
      
      // Show error on LCD
      setLCDState(LCD_FS_ERROR);
      delay(2000);
    }
  } else {
    Serial.println("LittleFS initialized successfully");
  }
  
  // Show boot screen
  // Show boot screens using state-based LCD
  setLCDState(LCD_BOOT_SCREEN, "startup");
  delay(1500);
  
  setLCDState(LCD_BOOT_SCREEN, "version");
  delay(1500);
  
  // Load configuration from LittleFS only
  loadConfiguration();
  // Check for reset requests during startup
  Serial.println("Press 'y' for WiFi reset or 'c' for config reset within 2 seconds...");
  setLCDState(LCD_BOOT_SCREEN, "reset_prompt");
  
  unsigned long startTime = millis();
  bool resetWiFi = false;
  bool resetConfig = false;
  
  while (millis() - startTime < 2000) { // Wait for 2 seconds
    if (Serial.available()) {
      char input = Serial.read();
      if (input == 'y' || input == 'Y') {
        resetWiFi = true;
        Serial.println("WiFi reset requested!");
        setLCDState(LCD_WIFI_RESET);
        break;
      } else if (input == 'c' || input == 'C') {
        resetConfig = true;
        Serial.println("Config reset requested!");
        setLCDState(LCD_CONFIG_UPDATE, "Resetting");
        break;
      }
    }
    delay(10); // Small delay to prevent excessive CPU usage
  }
  
  if (resetWiFi) {
    Serial.println("Clearing WiFi credentials...");
    WiFi.disconnect(true); // Clear stored WiFi credentials
    delay(1000);
    
    // Also clear WiFiManager settings
    WiFiManager wifiManager;
    wifiManager.resetSettings();
    delay(1000);
    
    Serial.println("WiFi settings cleared. Starting fresh setup...");
  }
  
  if (resetConfig) {
    Serial.println("Resetting configuration to defaults...");
    
    // Delete existing config file
    if (LittleFS.exists("/config.json")) {
      LittleFS.remove("/config.json");
      Serial.println("Existing config.json deleted");
    }
    
    // Reset to defaults
    backendUrl = DEFAULT_BACKEND_URL;
    deviceId = "ESP_" + formatMacAddress(WiFi.macAddress());
    
    // Save default configuration
    if (saveConfiguration()) {
      Serial.println("Default configuration saved");
      Serial.println("Backend URL reset to: " + backendUrl);
      Serial.println("Device ID reset to: " + deviceId);
    } else {
      Serial.println("Warning: Failed to save default configuration");
    }
    

    delay(2000); // Show message on LCD
  }
  
  // Initialize WiFi
  initializeWiFi();

  //Dispaly Update
  updateDisplay();
  
  // Sync time if online
  if (WiFi.status() == WL_CONNECTED) {
    syncTimeWithNTP();
    isOnline = true;
    setLED(true, false); // Green LED for online
  } else {
    setLED(false, true); // Red LED for offline
  }
  
  // Load offline logs count
  loadOfflineLogsCount();
  
  // Setup web-based configuration endpoints (replaces admin menu)
  if (WiFi.status() == WL_CONNECTED) {
    setupConfigurationEndpoints();
    configServerStarted = true;
    Serial.println("Configuration API available at: http://" + WiFi.localIP().toString() + "/api/config");
    
    // Pre-warm HTTPS connection for faster first attendance submission
    if (backendUrl.startsWith("https://")) {
      Serial.println("Pre-warming HTTPS connection for faster performance...");
      warmupHTTPSConnection();
    }
  }
  
  // Initial display update
  updateDisplay();
  
  systemInitialized = true;
  Serial.println("Setup complete. Ready for operation.");
  Serial.println("System ready at: " + String(millis()) + "ms");
  
  syncOfflineLogs();

  // Play startup sound
  if (BUZZER_ENABLED) {
    playStartupBeep();
  }
}

// ========================================
// MAIN LOOP
// ========================================

void loop() {
  if (!systemInitialized) {
    delay(1000);
    return;
  }
  
  // Handle configuration server requests
  if (WiFi.status() == WL_CONNECTED) {
    configServer.handleClient();
  }
  
  // Check WiFi connection periodically
  static unsigned long lastWiFiCheck = 0;
  if (millis() - lastWiFiCheck > 30000) { // Check every 30 seconds
    checkWiFiConnection();
    lastWiFiCheck = millis();
  }

  // Periodically try to reconnect WiFi and sync when running offline
  if (!isOnline && (millis() - lastPeriodicReconnectAttempt > WIFI_PERIODIC_RECONNECT_INTERVAL)) {
    lastPeriodicReconnectAttempt = millis();
    Serial.println("Periodic WiFi reconnect attempt...");
    setLCDState(LCD_CONNECTION_PROGRESS, "Retry WiFi");

    // Try to connect using stored credentials
    WiFi.mode(WIFI_STA);
    WiFi.begin(); // Use saved credentials if available

    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - startAttempt) < WIFI_RECONNECT_ATTEMPT_WINDOW_MS) {
      delay(500);
    }

    if (WiFi.status() == WL_CONNECTED) {
      isOnline = true;
      setLEDState(LED_GREEN);
      Serial.println("Reconnected to WiFi during periodic attempt. IP: " + WiFi.localIP().toString());
      syncTimeWithNTP();

      // Start config server if not started yet
      if (!configServerStarted) {
        setupConfigurationEndpoints();
        configServerStarted = true;
        Serial.println("Configuration API available at: http://" + WiFi.localIP().toString() + "/api/config");
      }

      // Immediately try syncing offline logs
      if (offlineLogsCount > 0) {
        setLCDState(LCD_SYNC_PROGRESS);
        syncOfflineLogs();
        setLCDState(LCD_SYNC_COMPLETE);
      }

      delay(1000);
      updateDisplay();
    } else {
      // Remain offline
      isOnline = false;
      setLEDState(LED_RED);
      Serial.println("WiFi reconnect failed. Staying offline.");
      delay(1000);
      updateDisplay();
    }
  }
  
  // Handle RFID scanning - MAIN FUNCTION
  handleRFIDScan();

  // RFID maintenance watchdog: periodic soft reset and idle recovery
  unsigned long nowMillis = millis();
  if (nowMillis - lastRFIDMaintenance > RFID_MAINTENANCE_INTERVAL_MS) {
    Serial.println("RFID maintenance: periodic re-init");
    softResetRFID();
    lastRFIDMaintenance = nowMillis;
  }
  if (lastRFIDActivity > 0 && (nowMillis - lastRFIDActivity > RFID_REINIT_IF_IDLE_MS)) {
    Serial.println("RFID maintenance: idle too long, forcing re-init");
    softResetRFID();
    lastRFIDActivity = nowMillis;
    lastRFIDMaintenance = nowMillis;
  }
  
  // Update LED state
  updateLED();
  
  // Update LCD display state
  updateLCDState();
  
  // Sync offline logs if available and online
  if (isOnline && offlineLogsCount > 0 && 
      (millis() - lastSyncAttempt > SYNC_RETRY_INTERVAL)) {
    syncOfflineLogs();
  }
  
  // Send heartbeat ping to backend every 30 minutes
  if (isOnline && (millis() - lastHeartbeat > HEARTBEAT_INTERVAL)) {
    sendHeartbeat();
  }
  
  // Update display periodically
  static unsigned long lastDisplayUpdate = 0;
  if (millis() - lastDisplayUpdate > 1000) { // Update every second
    if (currentLcdState == LCD_MAIN_SCREEN) {
      updateDisplay(); // Only update main screen periodically
    }
    lastDisplayUpdate = millis();
  }
  
  delay(100);  // Small delay to prevent excessive CPU usage
}

// ========================================
// HARDWARE INITIALIZATION - UPDATED
// ========================================

bool initializeHardware() {
  Serial.println("Initializing hardware...");
  
  // Initialize SPI for RFID first
  SPI.begin();
  Serial.println("SPI initialized");
  
  initializeRFID();
  Serial.println("RFID initialized successfully");
  
  // Initialize I2C for LCD and RTC
  Wire.begin(SDA_PIN, SCL_PIN);
  Serial.println("I2C initialized on SDA:" + String(SDA_PIN) + ", SCL:" + String(SCL_PIN));
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  setLCDState(LCD_INITIALIZING);
  Serial.println("LCD initialized");
  
  // Initialize RTC
  if (!rtc.begin()) {
    Serial.println("RTC initialization failed!");
    setLCDState(LCD_BOOT_SCREEN, "error");
    delay(2000);
    return false;
  }

  Serial.println("RTC initialized");
  
  // Initialize output pins
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // ========================================
  // NOTE: Encoder pin initialization has been ARCHIVED
  // See archived_features.h for the complete encoder implementation
  // ========================================
  
  // Turn off all LEDs initially
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);
  
  Serial.println("All hardware initialized successfully");
  return true;
}

// ========================================
// CONFIGURATION MANAGEMENT
// ========================================

void loadConfiguration() {
  Serial.println("Loading configuration from LittleFS...");
  
  // Always initialize with defaults first
  backendUrl = DEFAULT_BACKEND_URL;
  if (deviceId.length() == 0) {
    deviceId = "ESP_" + formatMacAddress(WiFi.macAddress());
    Serial.println("Generated new device ID: " + deviceId);
  }
  
  // Try to load from JSON configuration file
  if (loadJsonConfiguration()) {
    Serial.println("Backend URL: " + backendUrl);
    Serial.println("Device ID: " + deviceId);
    Serial.println("Configuration loaded from JSON successfully");
  } else {
    Serial.println("No valid configuration found, using defaults");
    // Save the default configuration for future use
    saveConfiguration();
  }
}

// ========================================
// CONFIGURATION MANAGEMENT (LITTLEFS ONLY)
// ========================================

void saveBackendUrl() {
  // Save to LittleFS JSON configuration only
  if (saveConfiguration()) {
    Serial.println("Backend URL saved to LittleFS: " + backendUrl);
  } else {
    Serial.println("Failed to save backend URL to LittleFS");
  }
}

void saveDeviceId() {
  // Save to LittleFS JSON configuration only  
  if (saveConfiguration()) {
    Serial.println("Device ID saved to LittleFS: " + deviceId);
  } else {
    Serial.println("Failed to save device ID to LittleFS");
  }
}

// ========================================
// WIFI MANAGEMENT
// ========================================

void initializeWiFi() {
  Serial.println("Initializing WiFi...");
  
  setLCDState(LCD_WIFI_SETUP);
  
  WiFiManager wifiManager;
  
  // Set custom AP name
  String apName = "Attendee_" + deviceId.substring(deviceId.length() - 6);
  
  // Set timeout for config portal (short, so device continues offline automatically)
  wifiManager.setConfigPortalTimeout(WIFI_CONFIG_PORTAL_TIMEOUT);
  
  // Try to connect with saved credentials, else briefly open portal
  if (!wifiManager.autoConnect(apName.c_str())) {
    Serial.println("WiFi not configured or unavailable. Continuing in offline mode.");
    isOnline = false;
    setLEDState(LED_RED);
    updateDisplay();
    // Do NOT restart; device will operate offline and retry periodically
    return;
  }
  
  Serial.println("WiFi connected successfully");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("MAC Address: ");
  Serial.println(WiFi.macAddress());
  Serial.print("Signal Strength: ");
  Serial.println(WiFi.RSSI());
}

void checkWiFiConnection() {
  bool wasOnline = isOnline;
  isOnline = (WiFi.status() == WL_CONNECTED);
  
  if (!wasOnline && isOnline) {
    Serial.println("WiFi reconnected");
    syncTimeWithNTP();
    setLEDState(LED_GREEN);
    logInfo("WiFi reconnected - IP: " + WiFi.localIP().toString());
    // Ensure config server is started on first connection
    if (!configServerStarted) {
      setupConfigurationEndpoints();
      configServerStarted = true;
      Serial.println("Configuration API available at: http://" + WiFi.localIP().toString() + "/api/config");
    }
  } else if (wasOnline && !isOnline) {
    Serial.println("WiFi disconnected");
    setLEDState(LED_RED);
    logError("WiFi disconnected");
  }
}



// ========================================
// RFID SCANNING - UPDATED FOR MFRC522v2
// ========================================

void handleRFIDScan() {
  // Check for new card with improved error handling
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }
  lastRFIDActivity = millis();
  
  if (!mfrc522.PICC_ReadCardSerial()) {
    consecutiveRFIDReadFailures++;
    if (consecutiveRFIDReadFailures >= 5) {
      Serial.println("RFID warning: consecutive read failures, soft resetting reader");
      softResetRFID();
      consecutiveRFIDReadFailures = 0;
    }
    return;
  }
  consecutiveRFIDReadFailures = 0;
  lastRFIDActivity = millis();

  // Prevent duplicate reads
  unsigned long currentTime = millis();
  if (currentTime - lastCardScan < CARD_READ_DELAY) {
    mfrc522.PICC_HaltA();
    // Stop crypto to ensure clean next transaction
    #ifdef MFRC522_h
    mfrc522.PCD_StopCrypto1();
    #endif
    return;
  }
  lastCardScan = currentTime;

  // Build RFID tag string
  String rfidTag = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) rfidTag += "0";
    rfidTag += String(mfrc522.uid.uidByte[i], HEX);
  }
  rfidTag.toUpperCase();

  // ===== STAGE 1: IMMEDIATE CARD DETECTION FEEDBACK =====
  Serial.println("RFID Tag scanned: " + rfidTag);
  logInfo("RFID scanned: " + rfidTag);
  
  // Immediate feedback: Card detected
  playCardDetectedBeep();               // Instant audio feedback
  setLEDState(LED_BLINK_GREEN);         // Quick green blink to show card detected
  
  // Show immediate "Card Detected" feedback on LCD
  lastScannedName = "Card Detected";
  lastScannedTime = getCurrentTimestamp().substring(11, 16);
  lastScannedMessage = "Processing...";
  updateDisplay();
  
  // Brief pause to separate stage 1 from stage 2
  delay(200);

  // Get current timestamp
  String timestamp = getCurrentTimestamp();

  // Process attendance
  if (isOnline) {
    processOnlineAttendance(rfidTag, timestamp);
  } else {
    processOfflineAttendance(rfidTag, timestamp);
  }

  // Halt communication with card and stop crypto
  mfrc522.PICC_HaltA();
  #ifdef MFRC522_h
  mfrc522.PCD_StopCrypto1();
  #endif
  delay(50);
}

// ========================================
// ATTENDANCE PROCESSING
// ========================================

void processOnlineAttendance(String rfidTag, String timestamp) {
  Serial.println("Backend URL: " + backendUrl);
  
  // Get effective URL (may be modified for testing)
  String effectiveUrl = getEffectiveBackendUrl();
  String attendanceUrl = getAttendanceEndpointUrl();
  
  Serial.println("Effective URL: " + effectiveUrl);
  Serial.println("Full attendance URL: " + attendanceUrl);
  
  // Determine if we need HTTPS or HTTP
  bool isHTTPS = effectiveUrl.startsWith("https://");
  
  if (isHTTPS) {
    // Configure WiFiClientSecure for HTTPS with aggressive speed optimizations
    wifiClientSecure.setInsecure(); // Skip SSL certificate verification for testing
    wifiClientSecure.setTimeout(5000); // Reduced timeout for faster failure detection
    
    // Aggressive optimization for ESP8266 HTTPS performance
    wifiClientSecure.setBufferSizes(512, 512); // Minimal buffers for fastest processing
    
    // Network optimizations for lower latency
    wifiClientSecure.setNoDelay(true); // Disable Nagle's algorithm for lower latency
    
    Serial.println("Using HTTPS connection with speed optimizations");
    Serial.println("Free heap before HTTPS: " + String(ESP.getFreeHeap()));
    
    unsigned long sslStartTime = millis();
    if (!http.begin(wifiClientSecure, getAttendanceEndpointUrl())) {
      Serial.println("Failed to initialize HTTPS connection");
      handleAttendanceError("HTTPS init failed");
      return;
    }
    unsigned long sslConnectTime = millis() - sslStartTime;
    Serial.println("SSL connection time: " + String(sslConnectTime) + "ms");
  } else {
    // Use regular WiFiClient for HTTP
    Serial.println("Using HTTP connection");
    if (!http.begin(wifiClient, getAttendanceEndpointUrl())) {
      Serial.println("Failed to initialize HTTP connection");
      handleAttendanceError("HTTP init failed");
      return;
    }
  }
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP8266-Attendance-Terminal/2.0");
  http.setTimeout(5000); // Reduced HTTP timeout for faster response
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["rfidTag"] = rfidTag;
  doc["timestamp"] = timestamp;
  doc["deviceId"] = deviceId;
  doc["firmware"] = FIRMWARE_VERSION;
  
  String payload;
  serializeJson(doc, payload);
  
  // ===== STAGE 2: PROCESSING INDICATION =====
  Serial.println("Sending attendance: " + payload);
  
  // Update LCD to show "Sending..." 
  lastScannedName = "Sending...";
  lastScannedMessage = "Please wait";
  updateDisplay();
  
  playProcessingBeep(); // Indicate that we're sending the request
  
  unsigned long requestStartTime = millis();
  int httpResponseCode = http.POST(payload);
  unsigned long requestTime = millis() - requestStartTime;
  
  String response = http.getString();
  
  Serial.println("HTTP Response Code: " + String(httpResponseCode));
  Serial.println("Request time: " + String(requestTime) + "ms");
  Serial.println("HTTP Response Body: " + response);
  Serial.println("Free heap after request: " + String(ESP.getFreeHeap()));
  
  // Mark SSL session as valid for faster future connections (HTTPS only)
  if (isHTTPS && httpResponseCode > 0) {
    sslSessionValid = true;
    Serial.println("SSL session established for reuse");
  }
  
  // Enhanced error reporting for SSL/connection issues
  if (httpResponseCode == -1) {
    Serial.println("Connection failed - possible causes:");
    Serial.println("1. SSL/TLS handshake failure");
    Serial.println("2. DNS resolution failed");
    Serial.println("3. Network timeout");
    Serial.println("4. Insufficient memory for SSL");
    Serial.println("WiFi status: " + String(WiFi.status()));
    Serial.println("WiFi RSSI: " + String(WiFi.RSSI()));
  }
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    handleSuccessfulAttendance(response, timestamp);
  } else if (httpResponseCode == 400) {
    handleBadRequestAttendance(response);
  } else {
    // HTTP error - store offline
    Serial.println("HTTP Error: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    // Provide more specific error messages
    String errorMsg;
    if (httpResponseCode == -1) {
      errorMsg = "Connection failed (SSL/Network)";
    } else if (httpResponseCode == 0) {
      errorMsg = "Timeout";
    } else if (response.length() > 0 && response != "null") {
      errorMsg = "HTTP " + String(httpResponseCode) + ": " + response;
    } else {
      errorMsg = "HTTP " + String(httpResponseCode) + " (no response)";
    }
    
    handleAttendanceError(errorMsg);
    
    // Only store offline if it's a real network/server error, not a client error
    if (httpResponseCode >= 500 || httpResponseCode <= 0) {
      processOfflineAttendance(rfidTag, timestamp);
    }
  }
  
  http.end();
}

void handleSuccessfulAttendance(String response, String timestamp) {
  Serial.println("Processing successful response: " + response);
  
  StaticJsonDocument<400> responseDoc;
  DeserializationError error = deserializeJson(responseDoc, response);
  
  if (error) {
    Serial.println("JSON parsing error: " + String(error.c_str()));
    handleAttendanceError("JSON parse error: " + String(error.c_str()));
    return;
  }
  
  if (responseDoc["message"]) {
    String message = responseDoc["message"].as<String>();
    String attendanceType = responseDoc["type"] | "unknown";
    
    // Extract user name
    String userName = "Unknown";
    if (responseDoc["attendance"]["userName"]) {
      userName = responseDoc["attendance"]["userName"].as<String>();
    }
    
    // Update display based on attendance type
    lastScannedName = userName;
    lastScannedTime = timestamp.substring(11, 16);  // Extract time HH:MM
    
    if (attendanceType == "entry") {
      lastScannedMessage = "Entry logged";
      setLEDState(LED_GREEN);
      playSuccessBeep();
      logInfo("Entry: " + userName);
    } else if (attendanceType == "exit") {
      lastScannedMessage = "Exit logged";
      setLEDState(LED_GREEN);
      playSuccessBeep();
      logInfo("Exit: " + userName);
    } else if (attendanceType == "complete") {
      lastScannedMessage = "Already logged";
      setLEDState(LED_YELLOW);
      playDuplicateBeep();      // Use specific duplicate beep pattern
      logInfo("Already complete: " + userName);
    } else {
      lastScannedMessage = "Attendance OK";
      setLEDState(LED_GREEN);
      playSuccessBeep();
      logInfo("Attendance: " + userName);
    }
    
    ledBlinkTimer = millis();
  } else {
    handleAttendanceError("Unknown response format");
  }
}

void handleBadRequestAttendance(String response) {
  Serial.println("Processing bad request response: " + response);
  
  StaticJsonDocument<300> responseDoc;
  DeserializationError error = deserializeJson(responseDoc, response);
  
  if (error) {
    Serial.println("JSON parsing error in bad request: " + String(error.c_str()));
    handleAttendanceError("Bad request - JSON parse error");
    return;
  }
  
  String errorMsg = responseDoc["message"].as<String>();
  if (errorMsg.length() == 0) {
    errorMsg = "Bad request";
  }
  String attendanceType = responseDoc["type"] | "error";
  
  if (attendanceType == "complete") {
    lastScannedName = "Already logged";
    lastScannedMessage = "Complete today";
    setLEDState(LED_YELLOW);
    ledBlinkTimer = millis();
    playDuplicateBeep();        // Use specific duplicate beep pattern
  } else {
    handleAttendanceError(errorMsg);
  }
}

void processOfflineAttendance(String rfidTag, String timestamp) {
  // ===== STAGE 2: PROCESSING INDICATION FOR OFFLINE =====
  // Update LCD to show "Storing offline..." 
  lastScannedName = "Offline Mode";
  lastScannedMessage = "Storing...";
  updateDisplay();
  
  playProcessingBeep(); // Same processing sound as online
  delay(100); // Brief processing delay for visual feedback
  
  // Check if we have space for more logs
  if (offlineLogsCount >= MAX_OFFLINE_LOGS) {
    handleAttendanceError("Storage full");
    return;
  }
  
  // Store attendance record in LittleFS
  File file = LittleFS.open(OFFLINE_LOGS_FILE, "a");
  if (file) {
    StaticJsonDocument<200> doc;
    doc["rfidTag"] = rfidTag;
    doc["timestamp"] = timestamp;
    doc["deviceId"] = deviceId;
    doc["firmware"] = FIRMWARE_VERSION;
    
    String jsonLine;
    serializeJson(doc, jsonLine);
    file.println(jsonLine);
    file.close();
    
    offlineLogsCount++;
    
    lastScannedName = "Offline Mode";
    lastScannedTime = timestamp.substring(11, 16);
    lastScannedMessage = "Stored locally";
    
    // Offline feedback
    setLEDState(LED_YELLOW);
    ledBlinkTimer = millis();
    playOfflineBeep();
    
    logInfo("Stored offline: " + rfidTag);
  } else {
    handleAttendanceError("Failed to store offline");
  }
}

void handleAttendanceError(String error) {
  lastScannedName = "Error";
  lastScannedTime = "";
  lastScannedMessage = error;
  
  setLEDState(LED_RED);
  ledBlinkTimer = millis();
  
  // Use specific error sounds based on error type
  if (error.indexOf("Connection") >= 0 || error.indexOf("SSL") >= 0 || 
      error.indexOf("Network") >= 0 || error.indexOf("Timeout") >= 0) {
    playNetworkErrorBeep();
  } else {
    playErrorBeep();
  }
  
  logError("Attendance error: " + error);
}

// ========================================
// OFFLINE SYNC FUNCTIONS
// ========================================

void syncOfflineLogs() {
  lastSyncAttempt = millis();
  
  File file = LittleFS.open(OFFLINE_LOGS_FILE, "r");
  if (!file) {
    offlineLogsCount = 0;
    return;
  }
  
  Serial.println("Syncing " + String(offlineLogsCount) + " offline logs...");
  
  String tempContent = "";
  int successCount = 0;
  
  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim();
    
    if (line.length() > 0) {
      if (syncSingleLog(line)) {
        successCount++;
      } else {
        tempContent += line + "\n";
      }
    }
  }
  file.close();
  
  // Rewrite file with failed logs
  if (tempContent.length() > 0) {
    file = LittleFS.open(OFFLINE_LOGS_FILE, "w");
    if (file) {
      file.print(tempContent);
      file.close();
    }
    offlineLogsCount -= successCount;
  } else {
    LittleFS.remove(OFFLINE_LOGS_FILE);
    offlineLogsCount = 0;
  }
  
  Serial.println("Synced " + String(successCount) + " logs successfully");
  logInfo("Synced " + String(successCount) + "/" + String(successCount + (offlineLogsCount)) + " logs");
}

bool syncSingleLog(String logEntry) {
  // Determine if we need HTTPS or HTTP
  bool isHTTPS = backendUrl.startsWith("https://");
  
  if (isHTTPS) {
    wifiClientSecure.setInsecure(); // Skip SSL certificate verification
    http.begin(wifiClientSecure, getAttendanceEndpointUrl());
  } else {
    http.begin(wifiClient, getAttendanceEndpointUrl());
  }
  
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000); // Reduced timeout for sync operations
  
  int httpResponseCode = http.POST(logEntry);
  bool success = (httpResponseCode == 200 || httpResponseCode == 201);
  
  if (!success) {
    logDebug("Failed to sync log, HTTP code: " + String(httpResponseCode));
  }
  
  http.end();
  return success;
}

void loadOfflineLogsCount() {
  File file = LittleFS.open(OFFLINE_LOGS_FILE, "r");
  if (file) {
    offlineLogsCount = 0;
    while (file.available()) {
      String line = file.readStringUntil('\n');
      line.trim();
      if (line.length() > 0) {
        offlineLogsCount++;
      }
    }
    file.close();
    Serial.println("Loaded " + String(offlineLogsCount) + " offline logs");
  }
}

void sendHeartbeat() {
  lastHeartbeat = millis();
  
  Serial.println("Sending heartbeat to backend...");
  
  // Determine if we need HTTPS or HTTP
  bool isHTTPS = backendUrl.startsWith("https://");
  
  if (isHTTPS) {
    wifiClientSecure.setInsecure(); // Skip SSL certificate verification
    http.begin(wifiClientSecure, getHeartbeatEndpointUrl());
  } else {
    http.begin(wifiClient, getHeartbeatEndpointUrl());
  }
  
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout for heartbeat
  
  // Create comprehensive heartbeat payload
  StaticJsonDocument<512> heartbeat;
  heartbeat["deviceId"] = deviceId;
  heartbeat["timestamp"] = getCurrentTimestamp();
  heartbeat["firmwareVersion"] = FIRMWARE_VERSION;
  heartbeat["uptime"] = millis() - systemStartTime;
  heartbeat["freeHeap"] = ESP.getFreeHeap();
  heartbeat["offlineLogsCount"] = offlineLogsCount;
  
  // WiFi status
  JsonObject wifi = heartbeat.createNestedObject("wifi");
  wifi["connected"] = (WiFi.status() == WL_CONNECTED);
  if (WiFi.status() == WL_CONNECTED) {
    wifi["ssid"] = WiFi.SSID();
    wifi["ip"] = WiFi.localIP().toString();
    wifi["rssi"] = WiFi.RSSI();
  }
  
  // System status
  JsonObject system = heartbeat.createNestedObject("system");
  system["isOnline"] = isOnline;
  system["systemInitialized"] = systemInitialized;
  system["lastCardScan"] = lastCardScan;
  system["chipId"] = ESP.getChipId();
  
  String payload;
  serializeJson(heartbeat, payload);
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.println("Heartbeat sent successfully");
    logInfo("Heartbeat successful - sent device status to backend");
    
    // Parse response if needed for any backend instructions
    String response = http.getString();
    if (response.length() > 0) {
      StaticJsonDocument<256> responseDoc;
      if (deserializeJson(responseDoc, response) == DeserializationError::Ok) {
        // Handle any backend instructions in the response
        if (responseDoc.containsKey("syncLogs") && responseDoc["syncLogs"].as<bool>()) {
          Serial.println("Backend requested log sync");
          if (offlineLogsCount > 0) {
            syncOfflineLogs();
          }
        }
      }
    }
  } else {
    Serial.println("Heartbeat failed: HTTP " + String(httpResponseCode));
    logError("Heartbeat failed: HTTP " + String(httpResponseCode));
    
    // If heartbeat fails, we might be having connectivity issues
    // But don't set offline immediately - let the WiFi check handle that
  }
  
  http.end();
}

// ========================================
// NOTE: Admin MENU FUNCTIONS  has been ARCHIVED
// ADMIN MENU FUNCTIONS 
// ========================================


// ========================================
// WEB-BASED CONFIGURATION SYSTEM
// ========================================

void setupConfigurationEndpoints() {
  Serial.println("Setting up configuration endpoints...");
  
  // Enable CORS for all requests
  configServer.on("/api/config", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    configServer.send(200, "text/plain", "");
  });
  
  // GET /api/config - Get current configuration
  configServer.on("/api/config", HTTP_GET, handleGetConfiguration);
  
  // POST /api/config - Update configuration
  configServer.on("/api/config", HTTP_POST, handleUpdateConfiguration);
  
  // GET /api/status - Get device status (like old device info)
  configServer.on("/api/status", HTTP_GET, handleGetDeviceStatus);
  
  // POST /api/actions/sync - Force sync offline logs
  configServer.on("/api/actions/sync", HTTP_POST, handleForceSyncLogs);
  
  // POST /api/actions/heartbeat - Force send heartbeat
  configServer.on("/api/actions/heartbeat", HTTP_POST, handleForceHeartbeat);
  
  // POST /api/actions/reset-wifi - Reset WiFi settings
  configServer.on("/api/actions/reset-wifi", HTTP_POST, handleResetWiFi);
  
  // POST /api/actions/restart - Restart device
  configServer.on("/api/actions/restart", HTTP_POST, handleRestartDevice);
  
  // POST /api/actions/switch-network - Switch WiFi network with credentials
  configServer.on("/api/actions/switch-network", HTTP_POST, handleSwitchNetwork);
  
  // GET /api/logs - Get offline logs info
  configServer.on("/api/logs", HTTP_GET, handleGetLogsInfo);
  
  // GET /api/firmware/list - Get list of firmware files
  configServer.on("/api/firmware/list", HTTP_GET, handleGetFirmwareList);
  
  // GET /api/firmware/download - Download specific firmware file
  configServer.on("/api/firmware/download", HTTP_GET, handleDownloadFirmware);
  
  // 404 handler
  configServer.onNotFound(handleNotFound);
  
  configServer.begin();
  Serial.println("Configuration server started on port 80");
}

void sendCORSHeaders() {
  configServer.sendHeader("Access-Control-Allow-Origin", "*");
  configServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  configServer.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

void handleGetConfiguration() {
  sendCORSHeaders();
  
  StaticJsonDocument<512> response;
  response["deviceId"] = deviceId;
  response["backendUrl"] = backendUrl;
  response["firmwareVersion"] = FIRMWARE_VERSION;
  response["isOnline"] = isOnline;
  response["offlineLogsCount"] = offlineLogsCount;
  
  // WiFi information
  JsonObject wifi = response.createNestedObject("wifi");
  wifi["connected"] = (WiFi.status() == WL_CONNECTED);
  if (WiFi.status() == WL_CONNECTED) {
    wifi["ssid"] = WiFi.SSID();
    wifi["ip"] = WiFi.localIP().toString();
    wifi["rssi"] = WiFi.RSSI();
    wifi["macAddress"] = WiFi.macAddress();
  }
  
  // System information
  JsonObject system = response.createNestedObject("system");
  system["freeHeap"] = ESP.getFreeHeap();
  system["uptime"] = millis() - systemStartTime;
  system["chipId"] = ESP.getChipId();
  
  String responseString;
  serializeJson(response, responseString);
  configServer.send(200, "application/json", responseString);
  
  logInfo("Configuration requested via API");
}

void handleUpdateConfiguration() {
  sendCORSHeaders();
  
  if (!configServer.hasArg("plain")) {
    configServer.send(400, "application/json", "{\"error\":\"No JSON body provided\"}");
    return;
  }
  
  String body = configServer.arg("plain");
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    configServer.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  bool configChanged = false;
  String changes = "";
  
  // Update backend URL if provided
  if (doc.containsKey("backendUrl")) {
    String newUrl = doc["backendUrl"].as<String>();
    if (newUrl != backendUrl && newUrl.length() > 0) {
      backendUrl = newUrl;
      saveBackendUrl();
      configChanged = true;
      changes += "Backend URL updated; ";
    }
  }
  
  // Update device ID if provided (rarely needed)
  if (doc.containsKey("deviceId")) {
    String newId = doc["deviceId"].as<String>();
    if (newId != deviceId && newId.length() > 0) {
      deviceId = newId;
      saveDeviceId();
      configChanged = true;
      changes += "Device ID updated; ";
    }
  }
  
  // Show configuration update on LCD
  if (configChanged) {
    setLCDState(LCD_CONFIG_UPDATE);
    delay(2000);
    updateDisplay(); // Restore normal display
    
    logInfo("Configuration updated via API: " + changes);
    configServer.send(200, "application/json", "{\"success\":true,\"message\":\"Configuration updated\"}");
  } else {
    configServer.send(200, "application/json", "{\"success\":true,\"message\":\"No changes made\"}");
  }
}

void handleGetDeviceStatus() {
  sendCORSHeaders();
  
  StaticJsonDocument<1024> response;
  
  // Device information
  response["deviceId"] = deviceId;
  response["firmwareVersion"] = FIRMWARE_VERSION;
  response["chipId"] = ESP.getChipId();
  response["macAddress"] = WiFi.macAddress();
  
  // System status
  response["uptime"] = millis() - systemStartTime;
  response["freeHeap"] = ESP.getFreeHeap();
  response["systemInitialized"] = systemInitialized;
  
  // Network status
  JsonObject network = response.createNestedObject("network");
  network["isOnline"] = isOnline;
  network["wifiConnected"] = (WiFi.status() == WL_CONNECTED);
  if (WiFi.status() == WL_CONNECTED) {
    network["ssid"] = WiFi.SSID();
    network["ip"] = WiFi.localIP().toString();
    network["rssi"] = WiFi.RSSI();
  }
  
  // Heartbeat information
  JsonObject heartbeat = response.createNestedObject("heartbeat");
  heartbeat["lastHeartbeat"] = lastHeartbeat;
  heartbeat["heartbeatInterval"] = HEARTBEAT_INTERVAL;
  heartbeat["nextHeartbeat"] = lastHeartbeat + HEARTBEAT_INTERVAL;
  heartbeat["timeSinceLastHeartbeat"] = millis() - lastHeartbeat;
  
  // RFID status
  JsonObject rfid = response.createNestedObject("rfid");
  rfid["initialized"] = true; // Assume initialized if we got this far
  rfid["lastScan"] = lastCardScan;
  
  // Return status only (no sync here)
  String responseString;
  serializeJson(response, responseString);
  configServer.send(200, "application/json", responseString);
}

// Force syncing of offline logs via API
void handleForceSyncLogs() {
  sendCORSHeaders();

  // Show sync in progress on LCD
  setLCDState(LCD_SYNC_PROGRESS);
  
  // Perform the sync (reuse existing function)
  int initialCount = offlineLogsCount;
  syncOfflineLogs();
  int syncedCount = initialCount - offlineLogsCount;
  
  // Update LCD with result
  setLCDState(LCD_SYNC_COMPLETE, String(syncedCount) + "/" + String(initialCount));
  delay(3000);
  updateDisplay(); // Restore normal display
  
  StaticJsonDocument<512> response;
  response["success"] = true;
  response["syncedCount"] = syncedCount;
  response["remainingCount"] = offlineLogsCount;
  response["message"] = "Sync completed";
  
  String responseString;
  serializeJson(response, responseString);
  configServer.send(200, "application/json", responseString);
  
  logInfo("Force sync triggered via API: " + String(syncedCount) + "/" + String(initialCount));
}

void handleResetWiFi() {
  sendCORSHeaders();
  
  setLCDState(LCD_WIFI_RESET);
  
  configServer.send(200, "application/json", "{\"success\":true,\"message\":\"WiFi settings will be reset and device will restart\"}");
  
  delay(1000);
  
  // Clear WiFi credentials
  WiFi.disconnect(true);
  delay(1000);
  
  // Also clear WiFiManager settings
  WiFiManager wifiManager;
  wifiManager.resetSettings();
  delay(1000);
  
  setLCDState(LCD_RESTART);
  delay(1000);
  
  logInfo("WiFi settings reset via API - restarting");
  ESP.restart();
}

void handleRestartDevice() {
  sendCORSHeaders();
  
  setLCDState(LCD_RESTART, "Via Frontend");
  
  configServer.send(200, "application/json", "{\"success\":true,\"message\":\"Device will restart\"}");
  
  delay(1000);
  logInfo("Device restart triggered via API");
  ESP.restart();
}

void handleSwitchNetwork() {
  sendCORSHeaders();
  
  if (!configServer.hasArg("plain")) {
    configServer.send(400, "application/json", "{\"error\":\"No JSON body provided\"}");
    return;
  }
  
  String body = configServer.arg("plain");
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    configServer.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  // Extract WiFi credentials
  String newSSID = doc["ssid"].as<String>();
  String newPassword = doc["password"].as<String>();
  
  if (newSSID.length() == 0) {
    configServer.send(400, "application/json", "{\"error\":\"SSID is required\"}");
    return;
  }
  
  setLCDState(LCD_NETWORK_SWITCH, newSSID);
  
  configServer.send(200, "application/json", "{\"success\":true,\"message\":\"Switching to new network...\"}");
  
  delay(1000);
  
  // Disconnect from current WiFi
  WiFi.disconnect();
  delay(500);
  
  setLCDState(LCD_CONNECTION_PROGRESS, "20"); // Max attempts
  
  // Connect to new WiFi network
  WiFi.begin(newSSID.c_str(), newPassword.c_str());
  
  // Wait for connection with timeout
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    attempts++;
    lcdProgressCounter = attempts; // Update progress counter for display
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    setLCDState(LCD_CONNECTION_SUCCESS, WiFi.localIP().toString());
    
    logInfo("WiFi switched to: " + newSSID + " - IP: " + WiFi.localIP().toString());
    
    // Update online status
    isOnline = true;
    setLEDState(LED_GREEN);
    
    // Sync time with new connection
    syncTimeWithNTP();
    
    delay(3000);
    updateDisplay(); // Restore normal display
  } else {
    setLCDState(LCD_CONNECTION_FAILED);
    
    logError("Failed to connect to WiFi: " + newSSID);
    
    // Set offline status
    isOnline = false;
    setLEDState(LED_RED);
    
    delay(3000);
    
    // Try to reconnect to previous network or start config portal
    setLCDState(LCD_CONNECTION_PROGRESS, "Previous network");
    
    WiFiManager wifiManager;
    wifiManager.setConfigPortalTimeout(30); // Short timeout
    wifiManager.autoConnect(("Attendee_" + deviceId.substring(deviceId.length() - 6)).c_str());
    
    updateDisplay();
  }
}

void handleGetLogsInfo() {
  sendCORSHeaders();
  
  StaticJsonDocument<512> response;
  response["offlineCount"] = offlineLogsCount;
  response["lastSync"] = lastSyncAttempt;
  response["isOnline"] = isOnline;
  
  // File system info - LittleFS
  if (LittleFS.begin()) {
    JsonObject filesystem = response.createNestedObject("filesystem");
    
    // Get file system info
    FSInfo fsInfo;
    LittleFS.info(fsInfo);
    
    filesystem["totalBytes"] = fsInfo.totalBytes;
    filesystem["usedBytes"] = fsInfo.usedBytes;
    filesystem["freeBytes"] = fsInfo.totalBytes - fsInfo.usedBytes;
  }
  
  String responseString;
  serializeJson(response, responseString);
  configServer.send(200, "application/json", responseString);
}

void handleGetFirmwareList() {
  sendCORSHeaders();
  
  StaticJsonDocument<1024> response;
  JsonArray files = response.createNestedArray("files");
  
  // Main firmware files
  JsonObject mainFile = files.createNestedObject();
  mainFile["name"] = "attendance_terminal.ino";
  mainFile["description"] = "Main firmware file with setup(), loop(), and core logic";
  mainFile["type"] = "firmware";
  mainFile["size"] = "~45KB";
  
  JsonObject utilsFile = files.createNestedObject();
  utilsFile["name"] = "utils.cpp";
  utilsFile["description"] = "Utility functions and helper methods";
  utilsFile["type"] = "source";
  utilsFile["size"] = "~12KB";
  
  JsonObject utilsHeader = files.createNestedObject();
  utilsHeader["name"] = "utils.h";
  utilsHeader["description"] = "Header file declaring utility functions";
  utilsHeader["type"] = "header";
  utilsHeader["size"] = "~2KB";
  
  JsonObject configFile = files.createNestedObject();
  configFile["name"] = "config.h";
  configFile["description"] = "Hardware pin definitions and system constants";
  configFile["type"] = "config";
  configFile["size"] = "~4KB";
  
  JsonObject archiveFile = files.createNestedObject();
  archiveFile["name"] = "archived_features.h";
  archiveFile["description"] = "Archived EC11 encoder and admin menu code";
  archiveFile["type"] = "archive";
  archiveFile["size"] = "~15KB";
  
  // Runtime configuration files
  JsonObject configJson = files.createNestedObject();
  configJson["name"] = "config.json";
  configJson["description"] = "Device configuration stored in LittleFS";
  configJson["type"] = "data";
  configJson["size"] = "Runtime";
  configJson["available"] = LittleFS.exists("/config.json");
  
  JsonObject logsFile = files.createNestedObject();
  logsFile["name"] = "offline_logs.txt";
  logsFile["description"] = "Offline attendance records in LittleFS";
  logsFile["type"] = "data";
  logsFile["size"] = "Runtime";
  logsFile["available"] = LittleFS.exists("/offline_logs.txt");
  
  response["totalFiles"] = files.size();
  response["deviceId"] = deviceId;
  response["firmwareVersion"] = FIRMWARE_VERSION;
  
  String responseString;
  serializeJson(response, responseString);
  configServer.send(200, "application/json", responseString);
}

void handleDownloadFirmware() {
  sendCORSHeaders();
  
  if (!configServer.hasArg("file")) {
    configServer.send(400, "application/json", "{\"error\":\"File parameter required\"}");
    return;
  }
  
  String filename = configServer.arg("file");
  
  // For security, only allow specific file types and validate filename
  if (filename.indexOf("..") != -1 || filename.indexOf("/") != -1) {
    configServer.send(400, "application/json", "{\"error\":\"Invalid filename\"}");
    return;
  }
  
  // Handle runtime data files from LittleFS
  if (filename == "config.json" || filename == "offline_logs.txt") {
    String filepath = "/" + filename;
    
    if (!LittleFS.exists(filepath)) {
      configServer.send(404, "application/json", "{\"error\":\"File not found\"}");
      return;
    }
    
    File file = LittleFS.open(filepath, "r");
    if (!file) {
      configServer.send(500, "application/json", "{\"error\":\"Cannot open file\"}");
      return;
    }
    
    // Set appropriate headers for download
    configServer.sendHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
    configServer.sendHeader("Content-Type", "application/octet-stream");
    
    // Stream file content
    configServer.streamFile(file, "application/octet-stream");
    file.close();
    return;
  }
  
  // Handle source code files (these would need to be served differently in a real implementation)
  // For now, return file information with a note about manual download
  StaticJsonDocument<512> response;
  response["error"] = "Source code files not available for download via device";
  response["note"] = "Source code files (.ino, .cpp, .h) must be downloaded from development environment";
  response["requestedFile"] = filename;
  response["availableFiles"] = "Only config.json and offline_logs.txt can be downloaded from device";
  
  String responseString;
  serializeJson(response, responseString);
  configServer.send(200, "application/json", responseString);
}

void handleNotFound() {
  sendCORSHeaders();
  configServer.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
}

// ========================================
// TEMPORARY TESTING OPTIONS
// ========================================

// Uncomment the line below to force HTTP for testing HTTPS issues
// #define FORCE_HTTP_FOR_TESTING

// ========================================
// URL HELPER FUNCTIONS
// ========================================

String getAttendanceEndpointUrl() {
  String effectiveUrl = getEffectiveBackendUrl();
  
  // Remove trailing slash if present
  if (effectiveUrl.endsWith("/")) {
    effectiveUrl = effectiveUrl.substring(0, effectiveUrl.length() - 1);
  }
  
  // Add the attendance endpoint
  return effectiveUrl + "/attendance";
}

String getHeartbeatEndpointUrl() {
  String effectiveUrl = getEffectiveBackendUrl();
  
  // Remove trailing slash if present
  if (effectiveUrl.endsWith("/")) {
    effectiveUrl = effectiveUrl.substring(0, effectiveUrl.length() - 1);
  }
  
  // Add the heartbeat endpoint
  return effectiveUrl + "/device/heartbeat";
}

String getEffectiveBackendUrl() {
  #ifdef FORCE_HTTP_FOR_TESTING
  if (backendUrl.startsWith("https://")) {
    String httpUrl = backendUrl;
    httpUrl.replace("https://", "http://");
    Serial.println("FORCE_HTTP_FOR_TESTING: Using " + httpUrl + " instead of " + backendUrl);
    return httpUrl;
  }
  #endif
  return backendUrl;
}

// ========================================
// DISPLAY FUNCTIONS
// ========================================

void updateDisplay() {
  // Always set to main screen state when called directly
  if (currentLcdState != LCD_MAIN_SCREEN) {
    setLCDState(LCD_MAIN_SCREEN);
  } else {
    updateLCDDisplay(); // Just refresh the current main screen
  }
}

void displayMainScreen() {
  // Line 1: Status and time
  lcd.setCursor(0, 0);
  lcd.print(isOnline ? "ON" : "OFF");
  lcd.print(" ");
  
  // Show current time
  DateTime now = rtc.now();
  char timeStr[9];
  sprintf(timeStr, "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
  lcd.print(timeStr);
  
  // Line 2: Last scan result or ready message
  lcd.setCursor(0, 1);
  if (lastScannedName.length() > 0) {
    // Show attendance result
    if (lastScannedMessage.length() > 0 && lastScannedMessage.length() <= 16) {
      lcd.print(lastScannedMessage);
    } else {
      // Show name with time
      String displayName = lastScannedName;
      if (displayName.length() > 8) {
        displayName = displayName.substring(0, 5) + "...";
      }
      lcd.print(displayName);
      
      if (lastScannedTime.length() > 0) {
        lcd.print(" ");
        lcd.print(lastScannedTime);
      }
    }
    
    // Show offline count if any
    if (offlineLogsCount > 0 && lastScannedName.length() < 8) {
      lcd.print(" (");
      lcd.print(offlineLogsCount);
      lcd.print(")");
    }
  } else {
    lcd.print("Ready to scan");
    if (offlineLogsCount > 0) {
      lcd.print(" (");
      lcd.print(offlineLogsCount);
      lcd.print(")");
    }
  }
}



// ========================================
// LED CONTROL
// ========================================
// Utility: Call whenever state changes
void setLEDState(LEDState newState) {
  currentLedState = newState;
  ledBlinkOn = false;
  ledBlinkTimer = millis();   // reset blink timer
  ledStateStart = millis();   // reset auto-off timer
}

void updateLED() {
  unsigned long currentTime = millis();

  switch (currentLedState) {
    case LED_OFF:
      setLED(false, false);
      break;

    case LED_GREEN:
      setLED(true, false);
      if (currentTime - ledStateStart > 2000) {
        setLEDState(LED_OFF);
      }
      break;

    case LED_RED:
      setLED(false, true);
      if (currentTime - ledStateStart > 2000) {
        setLEDState(LED_OFF);
      }
      break;

    case LED_YELLOW:
      if (currentTime - ledBlinkTimer > 100) {
        ledBlinkOn = !ledBlinkOn;
        setLED(ledBlinkOn, ledBlinkOn);   // both ON/OFF together = yellow blink
        ledBlinkTimer = currentTime;
      }
      if (currentTime - ledStateStart > 2000) {
        setLEDState(LED_OFF);
      }
      break;

    case LED_BLINK_GREEN:
      if (currentTime - ledBlinkTimer > 500) {
        ledBlinkOn = !ledBlinkOn;
        setLED(ledBlinkOn, false);
        ledBlinkTimer = currentTime;
      }
      if (currentTime - ledStateStart > 2000) {
        setLEDState(LED_OFF);
      }
      break;

    case LED_BLINK_RED:
      if (currentTime - ledBlinkTimer > 500) {
        ledBlinkOn = !ledBlinkOn;
        setLED(false, ledBlinkOn);
        ledBlinkTimer = currentTime;
      }
      if (currentTime - ledStateStart > 2000) {
        setLEDState(LED_OFF);
      }
      break;
  }
}

// ========================================
// LCD STATE MANAGEMENT
// ========================================
// Utility: Call whenever LCD state changes
void setLCDState(LCDState newState, String param1, String param2) {
  currentLcdState = newState;
  lcdStateStart = millis();
  lcdParam1 = param1;
  lcdParam2 = param2;
  lcdProgressCounter = 0;
  
  // Immediately update the display for the new state
  updateLCDDisplay();
}

void updateLCDState() {
  unsigned long currentTime = millis();
  
  switch (currentLcdState) {
    case LCD_MAIN_SCREEN:
      // Main screen is handled by the periodic updateDisplay() call
      break;
      
    case LCD_CONFIG_UPDATE:
    case LCD_WIFI_RESET:
    case LCD_RESTART:
    case LCD_SYNC_COMPLETE:
      // These states auto-return to main screen after 2-3 seconds
      if (currentTime - lcdStateStart > 2000) {
        setLCDState(LCD_MAIN_SCREEN);
      }
      break;
      
    case LCD_SYNC_PROGRESS:
      // Show progress animation
      if (currentTime - lcdStateStart > 500) {
        lcdProgressCounter++;
        updateLCDDisplay();
        lcdStateStart = currentTime;
      }
      break;
      
    case LCD_CONNECTION_PROGRESS:
      // Show connection progress
      if (currentTime - lcdStateStart > 1000) {
        lcdProgressCounter++;
        updateLCDDisplay();
        lcdStateStart = currentTime;
      }
      break;
      
    case LCD_CONNECTION_SUCCESS:
    case LCD_CONNECTION_FAILED:
      // Show result for 3 seconds then return to main
      if (currentTime - lcdStateStart > 3000) {
        setLCDState(LCD_MAIN_SCREEN);
      }
      break;
      
    case LCD_ERROR:
    case LCD_FS_ERROR:
      // Error states persist until manually cleared
      break;
      
    case LCD_INITIALIZING:
    case LCD_WIFI_SETUP:
    case LCD_BOOT_SCREEN:
    case LCD_NETWORK_SWITCH:
      // These are manually controlled states
      break;
  }
}

void updateLCDDisplay() {
  lcd.clear();
  
  switch (currentLcdState) {
    case LCD_MAIN_SCREEN:
      displayMainScreen();
      break;
      
    case LCD_INITIALIZING:
      lcd.setCursor(0, 0);
      lcd.print("Initializing...");
      lcd.setCursor(0, 1);
      lcd.print("Please wait");
      break;
      
    case LCD_WIFI_SETUP:
      lcd.setCursor(0, 0);
      lcd.print("WiFi Setup");
      lcd.setCursor(0, 1);
      lcd.print("Please wait...");
      break;
      
    case LCD_CONFIG_UPDATE:
      lcd.setCursor(0, 0);
      if (lcdParam1 == "Resetting") {
        lcd.print("Config Reset");
        lcd.setCursor(0, 1);
        lcd.print("To Defaults");
      } else {
        lcd.print("Config Updated");
        lcd.setCursor(0, 1);
        lcd.print("Via Frontend");
      }
      break;
      
    case LCD_SYNC_PROGRESS:
      {
        lcd.setCursor(0, 0);
        lcd.print("Syncing logs");
        lcd.setCursor(0, 1);
        String dots = "";
        for (int i = 0; i < (lcdProgressCounter % 4); i++) {
          dots += ".";
        }
        lcd.print("Progress" + dots);
        break;
      }
      
    case LCD_SYNC_COMPLETE:
      lcd.setCursor(0, 0);
      lcd.print("Sync Complete");
      lcd.setCursor(0, 1);
      if (lcdParam1.length() > 0) {
        lcd.print(lcdParam1); // Show sync count result
      } else {
        lcd.print("Success");
      }
      break;
      
    case LCD_WIFI_RESET:
      lcd.setCursor(0, 0);
      lcd.print("WiFi Reset");
      lcd.setCursor(0, 1);
      lcd.print("Via Frontend");
      break;
      
    case LCD_RESTART:
      lcd.setCursor(0, 0);
      lcd.print("Restarting...");
      lcd.setCursor(0, 1);
      if (lcdParam1.length() > 0) {
        lcd.print(lcdParam1); // Show reason
      } else {
        lcd.print("Please wait");
      }
      break;
      
    case LCD_NETWORK_SWITCH:
      lcd.setCursor(0, 0);
      lcd.print("Switching to:");
      lcd.setCursor(0, 1);
      if (lcdParam1.length() > 16) {
        lcd.print(lcdParam1.substring(0, 16));
      } else {
        lcd.print(lcdParam1); // SSID
      }
      break;
      
    case LCD_CONNECTION_PROGRESS:
      lcd.setCursor(0, 0);
      lcd.print("Connecting...");
      lcd.setCursor(0, 1);
      if (lcdParam1.length() > 0) {
        lcd.print("Attempt " + String(lcdProgressCounter) + "/" + lcdParam1);
      } else {
        lcd.print("Please wait");
      }
      break;
      
    case LCD_CONNECTION_SUCCESS:
      lcd.setCursor(0, 0);
      lcd.print("Connected!");
      lcd.setCursor(0, 1);
      if (lcdParam1.length() > 0) {
        lcd.print(lcdParam1); // IP address
      } else {
        lcd.print("Success");
      }
      break;
      
    case LCD_CONNECTION_FAILED:
      lcd.setCursor(0, 0);
      lcd.print("Connection");
      lcd.setCursor(0, 1);
      lcd.print("Failed!");
      break;
      
    case LCD_ERROR:
      lcd.setCursor(0, 0);
      lcd.print("ERROR:");
      lcd.setCursor(0, 1);
      if (lcdParam1.length() > 16) {
        lcd.print(lcdParam1.substring(0, 13) + "...");
      } else {
        lcd.print(lcdParam1);
      }
      break;
      
    case LCD_FS_ERROR:
      lcd.setCursor(0, 0);
      lcd.print("FS Init Failed");
      lcd.setCursor(0, 1);
      lcd.print("Check storage");
      break;
      
    case LCD_BOOT_SCREEN:
      if (lcdParam1 == "startup") {
        lcd.setCursor(0, 0);
        lcd.print("  Attendee v2  ");
        lcd.setCursor(0, 1);
        lcd.print("Starting up...");
      } else if (lcdParam1 == "version") {
        lcd.setCursor(0, 0);
        lcd.print("FW: ");
        lcd.print(FIRMWARE_VERSION);
        lcd.setCursor(0, 1);
        lcd.print("LittleFS Ready");
      } else if (lcdParam1 == "reset_prompt") {
        lcd.setCursor(0, 0);
        lcd.print("y=WiFi c=Config");
        lcd.setCursor(0, 1);
        lcd.print("reset (2 sec)");
      } else if (lcdParam1 == "wifi_reset_prompt") {
        lcd.setCursor(0, 0);
        lcd.print("Press 'y' for");
        lcd.setCursor(0, 1);
        lcd.print("WiFi reset");
      } else if (lcdParam1 == "error") {
        lcd.setCursor(0, 0);
        lcd.print("RTC Error!");
        lcd.setCursor(0, 1);
        lcd.print("Time not set");
      }
      break;
  }
}

// ========================================
// SOUND FUNCTIONS
// ========================================


// ========================================
// ROTARY ENCODER FUNCTIONS (Archived)
// ========================================



// ========================================
// ENHANCED ADMIN FUNCTIONS (Archived)
// ========================================

void handleForceHeartbeat() {
  sendCORSHeaders();
  
  if (!isOnline) {
    configServer.send(400, "application/json", "{\"error\":\"Device is offline\"}");
    return;
  }
  
  // Show heartbeat in progress on LCD
  setLCDState(LCD_SYNC_PROGRESS); // Reuse sync progress state for heartbeat
  
  // Send the heartbeat (reuse existing function)
  sendHeartbeat();
  
  // Update LCD with result
  setLCDState(LCD_SYNC_COMPLETE, "Heartbeat Sent");
  delay(2000);
  updateDisplay(); // Restore normal display
  
  StaticJsonDocument<256> response;
  response["success"] = true;
  response["message"] = "Heartbeat sent to backend";
  response["timestamp"] = getCurrentTimestamp();
  response["lastHeartbeat"] = lastHeartbeat;
  
  String responseString;
  serializeJson(response, responseString);
  configServer.send(200, "application/json", responseString);
  
  logInfo("Manual heartbeat triggered via API");
}

// ========================================
// CONNECTIVITY TESTING AND DIAGNOSTICS
// ========================================

bool testHTTPSConnection(String url) {
  Serial.println("Testing HTTPS connection to: " + url);
  
  wifiClientSecure.setInsecure();
  wifiClientSecure.setTimeout(10000);
  wifiClientSecure.setBufferSizes(512, 512);
  
  HTTPClient testHttp;
  if (!testHttp.begin(wifiClientSecure, url)) {
    Serial.println("HTTPS test: Failed to initialize connection");
    testHttp.end();
    return false;
  }
  
  testHttp.setTimeout(10000);
  int responseCode = testHttp.GET();
  
  Serial.println("HTTPS test response code: " + String(responseCode));
  Serial.println("Free heap during test: " + String(ESP.getFreeHeap()));
  
  testHttp.end();
  return (responseCode > 0);
}

void processOnlineAttendanceWithFallback(String rfidTag, String timestamp) {
  Serial.println("Backend URL: " + backendUrl);
  
  // Determine if we need HTTPS or HTTP
  bool isHTTPS = backendUrl.startsWith("https://");
  bool useHTTPS = isHTTPS;
  
  // For HTTPS, test connection first
  if (isHTTPS) {
    Serial.println("Testing HTTPS connectivity...");
    if (!testHTTPSConnection(backendUrl + "/health")) {
      Serial.println("HTTPS test failed. You may want to:");
      Serial.println("1. Check if your ESP8266 has enough memory");
      Serial.println("2. Verify the SSL certificate");
      Serial.println("3. Try using HTTP for testing");
      Serial.println("4. Check network connectivity");
    }
  }
  
  // Proceed with the actual request
  processOnlineAttendance(rfidTag, timestamp);
}

// ========================================
// HTTPS CONNECTION WARMUP
// ========================================

void warmupHTTPSConnection() {
  Serial.println("Warming up HTTPS connection...");
  
  // Configure SSL client with same optimizations
  wifiClientSecure.setInsecure();
  wifiClientSecure.setTimeout(3000); // Short timeout for warmup
  wifiClientSecure.setBufferSizes(512, 512);
  wifiClientSecure.setNoDelay(true);
  
  HTTPClient warmupHttp;
  unsigned long warmupStart = millis();
  
  if (warmupHttp.begin(wifiClientSecure, getEffectiveBackendUrl() + "/health")) {
    warmupHttp.setTimeout(3000);
    
    int responseCode = warmupHttp.GET();
    unsigned long warmupTime = millis() - warmupStart;
    
    if (responseCode > 0) {
      // Mark session as established for reuse
      sslSessionValid = true;
      Serial.println("HTTPS warmup successful: " + String(warmupTime) + "ms (session established)");
    } else {
      Serial.println("HTTPS warmup failed: " + String(responseCode));
    }
    
    warmupHttp.end();
  } else {
    Serial.println("HTTPS warmup connection failed");
  }
  }
  

