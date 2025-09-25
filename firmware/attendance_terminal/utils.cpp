/*
 * Utility functions for Attendee Attendance Terminal v2.0
 * Enhanced features and MFRC522v2 support
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include <EEPROM.h>          // DEPRECATED: No longer used, kept for migration compatibility
#include <LittleFS.h>
#include <FS.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>
#include "config.h"
#include "utils.h"

// External references from main file
extern LiquidCrystal_I2C lcd;
extern WiFiClient wifiClient;
extern HTTPClient http;
extern String backendUrl;
extern String deviceId;
extern bool isOnline;
extern int offlineLogsCount;
extern MFRC522 mfrc522;
extern RTC_DS3231 rtc;

// Function declarations from main file
extern bool syncSingleLog(String logEntry);

// Static variables for uptime tracking
static unsigned long bootTime = 0;

// ========================================
// STRING FORMATTING FUNCTIONS
// ========================================

String formatMacAddress(String mac) {
  mac.replace(":", "");
  mac.toUpperCase();
  return mac;
}

String getChipId() {
  return String(ESP.getChipId(), HEX);
}

String getDeviceInfo() {
  String info = "";
  info += "Device: " + String(DEVICE_MODEL) + "\n";
  info += "Firmware: " + String(FIRMWARE_VERSION) + "\n";
  info += "Chip ID: " + getChipId() + "\n";
  info += "MAC: " + WiFi.macAddress() + "\n";
  info += "Flash: " + String(ESP.getFlashChipSize()) + " bytes\n";
  info += "Free Heap: " + String(ESP.getFreeHeap()) + " bytes\n";
  info += "Uptime: " + getFormattedUptime() + "\n";
  return info;
}

String formatDateTime(DateTime dt) {
  char buffer[32];
  sprintf(buffer, "%02d/%02d/%04d %02d:%02d:%02d", 
          dt.month(), dt.day(), dt.year(),
          dt.hour(), dt.minute(), dt.second());
  return String(buffer);
}

String formatTime(DateTime dt) {
  char buffer[16];
  sprintf(buffer, "%02d:%02d:%02d", dt.hour(), dt.minute(), dt.second());
  return String(buffer);
}

String formatDate(DateTime dt) {
  char buffer[16];
  sprintf(buffer, "%02d/%02d/%04d", dt.month(), dt.day(), dt.year());
  return String(buffer);
}

String formatUptime() {
  return getFormattedUptime();
}

// ========================================
// VALIDATION FUNCTIONS
// ========================================

bool isValidUrl(String url) {
  if (url.length() < MIN_URL_LENGTH || url.length() > MAX_URL_LENGTH) {
    return false;
  }
  
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return false;
  }
  
  return true;
}

bool isValidRfidTag(String tag) {
  if (tag.length() < MIN_RFID_TAG_LENGTH || tag.length() > MAX_RFID_TAG_LENGTH) {
    return false;
  }
  
  // Check if all characters are hex
  for (int i = 0; i < tag.length(); i++) {
    char c = tag.charAt(i);
    if (!((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F'))) {
      return false;
    }
  }
  return true;
}

// ========================================
// CONFIGURATION MANAGEMENT
// ========================================

bool saveConfiguration() {
  StaticJsonDocument<512> config;
  config["backendUrl"] = backendUrl;
  config["deviceId"] = deviceId;
  config["firmware"] = FIRMWARE_VERSION;
  config["lastUpdate"] = millis();
  
  File file = LittleFS.open(CONFIG_FILE, "w");
  if (!file) {
    DEBUG_PRINTLN("Failed to open config file for writing");
    return false;
  }
  
  serializeJson(config, file);
  file.close();
  DEBUG_PRINTLN("Configuration saved successfully");
  return true;
}

bool loadJsonConfiguration() {
  DEBUG_PRINTLN("Attempting to load configuration from LittleFS...");
  
  File file = LittleFS.open(CONFIG_FILE, "r");
  if (!file) {
    DEBUG_PRINTLN("Config file not found, using defaults");
    // Ensure defaults are always set
    if (backendUrl.length() == 0) {
      backendUrl = DEFAULT_BACKEND_URL;
    }
    if (deviceId.length() == 0) {
      deviceId = "ESP_" + formatMacAddress(WiFi.macAddress());
    }
    return false;
  }
  
  StaticJsonDocument<512> config;
  DeserializationError error = deserializeJson(config, file);
  file.close();
  
  if (error) {
    DEBUG_PRINTLN("Failed to parse config file, using defaults");
    DEBUG_PRINTLN("JSON Error: " + String(error.c_str()));
    // Ensure defaults are always set even on parse error
    if (backendUrl.length() == 0) {
      backendUrl = DEFAULT_BACKEND_URL;
    }
    if (deviceId.length() == 0) {
      deviceId = "ESP_" + formatMacAddress(WiFi.macAddress());
    }
    return false;
  }
  
  // Load configuration values with validation
  if (config.containsKey("backendUrl") && config["backendUrl"].as<String>().length() > 0) {
    String loadedUrl = config["backendUrl"].as<String>();
    if (isValidUrl(loadedUrl)) {
      backendUrl = loadedUrl;
    } else {
      DEBUG_PRINTLN("Invalid URL in config, using default");
      backendUrl = DEFAULT_BACKEND_URL;
    }
  } else {
    backendUrl = DEFAULT_BACKEND_URL;
  }
  
  if (config.containsKey("deviceId") && config["deviceId"].as<String>().length() > 0) {
    deviceId = config["deviceId"].as<String>();
  } else {
    deviceId = "ESP_" + formatMacAddress(WiFi.macAddress());
  }
  
  DEBUG_PRINTLN("Configuration loaded successfully");
  DEBUG_PRINTLN("Backend URL: " + backendUrl);
  DEBUG_PRINTLN("Device ID: " + deviceId);
  return true;
}

bool clearOfflineLogs() {
  if (LittleFS.remove(OFFLINE_LOGS_FILE)) {
    offlineLogsCount = 0;
    DEBUG_PRINTLN("Offline logs cleared");
    return true;
  }
  return false;
}

// ========================================
// NETWORK FUNCTIONS
// ========================================

bool validateBackendConnection() {
  if (!isOnline) return false;
  
  http.begin(wifiClient, backendUrl + "/health");
  http.setTimeout(5000);
  
  int httpResponseCode = http.GET();
  bool isValid = (httpResponseCode == 200);
  
  http.end();
  DEBUG_PRINTLN("Backend validation: " + String(isValid ? "OK" : "FAILED"));
  return isValid;
}

bool testInternetConnection() {
  if (!isOnline) return false;
  
  http.begin(wifiClient, "http://www.google.com");
  http.setTimeout(5000);
  
  int httpResponseCode = http.GET();
  bool isValid = (httpResponseCode == 200 || httpResponseCode == 301);
  
  http.end();
  return isValid;
}

String getLocalIP() {
  return WiFi.localIP().toString();
}

String getSSID() {
  return WiFi.SSID();
}

int getSignalStrength() {
  return WiFi.RSSI();
}

String getMACAddress() {
  return WiFi.macAddress();
}

// ========================================
// RFID UTILITY FUNCTIONS (MFRC522v2)
// ========================================

void initializeRFID() {
  mfrc522.PCD_Init();
  // Ensure antenna is on and set gain
  mfrc522.PCD_AntennaOn();
  setRFIDGain(RFID_DEFAULT_GAIN);
}

void softResetRFID() {
  // Try graceful halt and soft reset
  mfrc522.PICC_HaltA();
  delay(5);
  mfrc522.PCD_SoftPowerDown();
  delay(10);
  mfrc522.PCD_SoftPowerUp();
  delay(25);
  mfrc522.PCD_Init();
  mfrc522.PCD_AntennaOn();
  setRFIDGain(RFID_DEFAULT_GAIN);
}

void setRFIDGain(byte gain) {
  mfrc522.PCD_SetAntennaGain(gain);
}

byte getRFIDGain() {
  return mfrc522.PCD_GetAntennaGain();
}

bool isRFIDCardPresent() {
  return mfrc522.PICC_IsNewCardPresent();
}

// ========================================
// SYSTEM MONITORING
// ========================================

float getCpuTemperature() {
  // ESP8266 doesn't have built-in temperature sensor
  // This would need external sensor implementation
  return -1.0;
}

uint32_t getFreeHeap() {
  return ESP.getFreeHeap();
}

// uint32_t getUsedHeap() {
//   return ESP.getInitialFreeHeap() - ESP.getFreeHeap();
// }

String getResetReason() {
  return ESP.getResetReason();
}

// ========================================
// LED CONTROL UTILITIES
// ========================================

void setLED(bool green, bool red) {
  digitalWrite(GREEN_LED, green ? HIGH : LOW);
  digitalWrite(RED_LED, red ? HIGH : LOW);
}


void blinkLED(bool green, bool red, int times) {
  for (int i = 0; i < times; i++) {
    setLED(green, red);
    delay(200);
    setLED(false, false);
    delay(200);
  }
}

// ========================================
// TIME UTILITIES
// ========================================

bool isTimeValid() {
  DateTime now = rtc.now();
  return (now.year() > 2020); // Assume any year > 2020 is valid
}

String getFormattedUptime() {
  unsigned long uptime = getUptime();
  
  unsigned long days = uptime / (24 * 3600);
  uptime %= (24 * 3600);
  unsigned long hours = uptime / 3600;
  uptime %= 3600;
  unsigned long minutes = uptime / 60;
  unsigned long seconds = uptime % 60;
  
  String result = "";
  if (days > 0) result += String(days) + "d ";
  if (hours > 0) result += String(hours) + "h ";
  if (minutes > 0) result += String(minutes) + "m ";
  result += String(seconds) + "s";
  
  return result;
}

unsigned long getUptime() {
  return millis() / 1000; // Convert to seconds
}

// ========================================
// FILE SYSTEM UTILITIES
// ========================================

bool initializeFileSystem() {
  DEBUG_PRINTLN("Initializing LittleFS...");
  
  if (!LittleFS.begin()) {
    DEBUG_PRINTLN("LittleFS initialization failed, attempting format...");
    
    if (LittleFS.format()) {
      DEBUG_PRINTLN("LittleFS formatted successfully");
      if (LittleFS.begin()) {
        DEBUG_PRINTLN("LittleFS initialized after format");
        return true;
      }
    }
    
    DEBUG_PRINTLN("LittleFS initialization completely failed");
    return false;
  }
  
  DEBUG_PRINTLN("LittleFS initialized successfully");
  return true;
}

size_t getFileSystemUsed() {
  FSInfo fsInfo;
  if (LittleFS.info(fsInfo)) {
    return fsInfo.usedBytes;
  }
  return 0;
}

size_t getFileSystemTotal() {
  FSInfo fsInfo;
  if (LittleFS.info(fsInfo)) {
    return fsInfo.totalBytes;
  }
  return 0;
}

bool cleanupOldLogs() {
  // Implementation to clean up old log files if needed
  // This is a placeholder for future enhancement
  return true;
}

// ========================================
// ERROR HANDLING AND LOGGING
// ========================================

void logError(String error) {
  #if DEBUG_ENABLED
  Serial.print("[ERROR] ");
  Serial.println(error);
  #endif
}

void logInfo(String info) {
  #if DEBUG_ENABLED
  Serial.print("[INFO] ");
  Serial.println(info);
  #endif
}

void logDebug(String debug) {
  #if DEBUG_ENABLED
  Serial.print("[DEBUG] ");
  Serial.println(debug);
  #endif
}

// ========================================
// TIME AND NTP FUNCTIONS
// ========================================

String getCurrentTimestamp() {
  DateTime now = rtc.now();
  char buffer[25];
  sprintf(buffer, "%04d-%02d-%02dT%02d:%02d:%02d", 
          now.year(), now.month(), now.day(),
          now.hour(), now.minute(), now.second());
  return String(buffer);
}

void syncTimeWithNTP() {
  Serial.println("Syncing time with NTP...");
  
  // Get IST directly from NTP
  configTime(IST_OFFSET, 0, NTP_SERVER);

  struct tm timeinfo;
  int attempts = 0;
  while (!getLocalTime(&timeinfo) && attempts < 20) {
    delay(500);
    attempts++;
  }

  if (attempts < 20) {
    Serial.println("Time synced successfully");

    // Convert tm → epoch → DateTime
    time_t now;
    time(&now);
    Serial.println(ctime(&now));
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
        // Serial.println(&timeinfo, "%a %b %d %H:%M:%S %Y"); 
        rtc.adjust(DateTime(
          timeinfo.tm_year + 1900,
          timeinfo.tm_mon + 1,
          timeinfo.tm_mday,
          timeinfo.tm_hour,
          timeinfo.tm_min,
          timeinfo.tm_sec
        ));        
      }
    logInfo("NTP time sync successful");
  } else {
    Serial.println("Time sync failed");
    logError("NTP time sync failed");
  }
}

// ========================================
// AUDIO FEEDBACK FUNCTIONS - ENHANCED MELODIES
// ========================================

void playSuccessBeep() {
  if (BUZZER_ENABLED) {
    // Pleasant success melody: C5 -> E5 -> G5 -> C6 (ascending major arpeggio)
    tone(BUZZER, 523, 120);  // C5
    delay(120);
    tone(BUZZER, 659, 120);  // E5
    delay(120);
    tone(BUZZER, 784, 120);  // G5
    delay(120);
    tone(BUZZER, 1047, 180); // C6 - triumphant end
  }
}

void playErrorBeep() {
  if (BUZZER_ENABLED) {
    // Distinctive error pattern: Descending harsh tones
    tone(BUZZER, 300, 200);
    delay(100);
    tone(BUZZER, 250, 200);
    delay(100);
    tone(BUZZER, 200, 400);  // Long low tone for emphasis
  }
}

void playOfflineBeep() {
  if (BUZZER_ENABLED) {
    // Offline pattern: Three gentle medium tones (like a notification)
    tone(BUZZER, 550, 150);
    delay(120);
    tone(BUZZER, 650, 150);
    delay(120);
    tone(BUZZER, 550, 200);
  }
}

void playCardDetectedBeep() {
  if (BUZZER_ENABLED) {
    // Quick, bright acknowledgment beep - immediate response
    tone(BUZZER, 900, 80);   // Short, high-pitched for instant feedback
  }
}

void playProcessingBeep() {
  if (BUZZER_ENABLED) {
    // Two-tone processing indication - distinct from card detection
    tone(BUZZER, 700, 60);
    delay(50);
    tone(BUZZER, 850, 60);
    delay(50);
    tone(BUZZER, 1000, 80);  // Rising tones for "working on it"
  }
}

// New enhanced feedback functions for specific scenarios
void playDuplicateBeep() {
  if (BUZZER_ENABLED) {
    // Already logged today - gentle warning pattern
    tone(BUZZER, 600, 100);
    delay(80);
    tone(BUZZER, 500, 100);
    delay(80);
    tone(BUZZER, 600, 150);
  }
}

void playNetworkErrorBeep() {
  if (BUZZER_ENABLED) {
    // Network connection issue - distinctive pattern
    tone(BUZZER, 400, 100);
    delay(60);
    tone(BUZZER, 400, 100);
    delay(60);
    tone(BUZZER, 400, 100);
    delay(150);
    tone(BUZZER, 300, 250);  // Low final tone
  }
}

void playStartupBeep() {
  if (BUZZER_ENABLED) {
    // System startup melody - welcoming tune
    tone(BUZZER, 523, 100);  // C5
    delay(100);
    tone(BUZZER, 659, 100);  // E5
    delay(100);
    tone(BUZZER, 784, 100);  // G5
    delay(100);
    tone(BUZZER, 523, 150);  // C5 - back to start
  }
}