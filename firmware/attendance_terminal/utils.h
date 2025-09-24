/*
 * Header file for utility functions
 * Attendee Attendance Terminal v2.0
 * Updated for MFRC522v2 library
 */

#ifndef UTILS_H
#define UTILS_H

#include <Arduino.h>
#include <RTClib.h>
#include <MFRC522v2.h>
#endif

// ========================================
// UTILITY FUNCTION DECLARATIONS
// ========================================

// String formatting functions
String formatMacAddress(String mac);
String getChipId();
String getDeviceInfo();
String formatDateTime(DateTime dt);
String formatTime(DateTime dt);
String formatDate(DateTime dt);
String formatUptime();

// Validation functions
bool isValidUrl(String url);
bool isValidRfidTag(String tag);

// Configuration management
bool saveConfiguration();
bool loadJsonConfiguration();
bool clearOfflineLogs();

// Backend connectivity
bool validateBackendConnection();
bool testInternetConnection();

// RFID utility functions (MFRC522v2 specific)
void initializeRFID();
void softResetRFID();
byte getRFIDGain();
void setRFIDGain(byte gain);
bool isRFIDCardPresent();

// System monitoring
float getCpuTemperature();
uint32_t getFreeHeap();
uint32_t getUsedHeap();
String getResetReason();

// LCD Display control utilities
// LCD Display States
enum LCDState {
  LCD_MAIN_SCREEN,          // Normal operation display
  LCD_INITIALIZING,         // Boot/initialization screens
  LCD_WIFI_SETUP,           // WiFi connection status
  LCD_CONFIG_UPDATE,        // Configuration updated message
  LCD_SYNC_PROGRESS,        // Syncing logs message  
  LCD_SYNC_COMPLETE,        // Sync completed message
  LCD_WIFI_RESET,           // WiFi reset message
  LCD_RESTART,              // Device restart message
  LCD_NETWORK_SWITCH,       // Network switching messages
  LCD_CONNECTION_PROGRESS,  // Network connection progress
  LCD_CONNECTION_SUCCESS,   // Network connection success
  LCD_CONNECTION_FAILED,    // Network connection failed
  LCD_ERROR,                // Error display
  LCD_BOOT_SCREEN,          // Boot screen display
  LCD_FS_ERROR              // File system error
};

void setLCDState(LCDState newState, String param1 = "", String param2 = "");
void updateLCDState();

// LED control utilities
// LED States
enum LEDState {
  LED_OFF,
  LED_GREEN,
  LED_RED,
  LED_YELLOW,
  LED_BLINK_GREEN,
  LED_BLINK_RED,
  LED_BLINK_YELLOW
};

void setLED(bool green, bool red);
void blinkLED(bool green, bool red, int times = 1);
void setLEDState(LEDState newState);

// Network utilities
String getLocalIP();
String getSSID();
int getSignalStrength();
String getMACAddress();

// Time utilities
bool isTimeValid();
String getFormattedUptime();
unsigned long getUptime();
String getCurrentTimestamp();
void syncTimeWithNTP();

// Audio feedback utilities
void playSuccessBeep();
void playErrorBeep();
void playOfflineBeep();
void playCardDetectedBeep();
void playProcessingBeep();
void playDuplicateBeep();        // New: For already logged today
void playNetworkErrorBeep();     // New: For network/connection issues  
void playStartupBeep();          // New: System startup sound

// File system utilities
bool initializeFileSystem();
size_t getFileSystemUsed();
size_t getFileSystemTotal();
bool cleanupOldLogs();

// Error handling
void logError(String error);
void logInfo(String info);
void logDebug(String debug);
