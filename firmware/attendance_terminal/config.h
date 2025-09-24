/*
 * Configuration file for Attendee Attendance Terminal
 * Updated for MFRC522v2 library with proper pin assignments
 * Modify these settings before uploading firmware
 */

#ifndef CONFIG_H
#define CONFIG_H

// ========================================
// HARDWARE CONFIGURATION - FIXED PIN ASSIGNMENTS
// ========================================

// Pin Definitions (NodeMCU/Wemos D1 Mini) - NO CONFLICTS WITH SPI
// SPI pins are reserved: D5(SCK), D6(MISO), D7(MOSI), D8(SS)

// RFID RC522 Pins (SPI Interface)
#define RFID_SS_PIN     15    // D8 - SPI SS (Slave Select)
#define RFID_RST_PIN    0     // D3 - Reset pin (optional, can be -1 if not used)

// I2C Pins (LCD & RTC) - MOVED TO AVOID SPI CONFLICT
#define SDA_PIN         4     // D2 - I2C SDA (was conflicting with MISO)
#define SCL_PIN         5     // D1 - I2C SCL (was conflicting with MOSI)

// LED and Buzzer Pins
#define GREEN_LED       2    // D0 - Green LED
#define RED_LED         16   // D4 - Red LED  
#define BUZZER          0     // D3 - Buzzer (shared with RST_PIN, but different usage)

// ========================================
// NOTE: EC11 Encoder pins have been ARCHIVED due to GPIO conflicts
// See archived_features.h for the complete encoder implementation
// ========================================

// Alternative safe pin configuration (uncomment if above doesn't work)
/*
#define RFID_SS_PIN     15    // D8 - SPI SS
#define RFID_RST_PIN    -1    // Not connected
#define SDA_PIN         4     // D2 - I2C SDA
#define SCL_PIN         5     // D1 - I2C SCL
#define GREEN_LED       16    // D0 - Green LED
#define RED_LED         2     // D4 - Red LED
#define BUZZER          0     // D3 - Buzzer
#define ENCODER_CLK     12    // D6 - Encoder Clock
#define ENCODER_DT      13    // D7 - Encoder Data
#define ENCODER_SW      14    // D5 - Encoder Switch
*/

// ========================================
// DISPLAY CONFIGURATION
// ========================================

// 1602 LCD Configuration (I2C)
#define LCD_ADDRESS     0x27  // I2C address for 1602 LCD (0x27 or 0x3F)
#define LCD_COLS        16    // Number of columns
#define LCD_ROWS        2     // Number of rows

// ========================================
// NETWORK CONFIGURATION
// ========================================

// Default backend server URL (can be changed via configuration)
// #define DEFAULT_BACKEND_URL "http://192.168.1.10:3000"
#define DEFAULT_BACKEND_URL "https://api.xrocketry.in/"

// WiFi Configuration Portal settings
// Reduce portal timeout so device continues offline quickly when unattended
#define WIFI_CONFIG_PORTAL_TIMEOUT 10   // seconds (skip config after 10s)
#define WIFI_RECONNECT_TIMEOUT 30       // 30 seconds
// Periodic reconnect to WiFi to try syncing offline logs
#define WIFI_PERIODIC_RECONNECT_INTERVAL (2UL*60UL*60UL*1000UL) // 2 hours in ms
#define WIFI_RECONNECT_ATTEMPT_WINDOW_MS 15000UL                // Try connect for 15s

// NTP Settings
#define NTP_SERVER "pool.ntp.org"
#define IST_OFFSET   (5*3600 + 30*60) // IST offset in seconds
#define DAYLIGHT_OFFSET_SEC 0       // 24 hours in seconds

// ========================================
// TIMING CONFIGURATION
// ========================================

#define HEARTBEAT_INTERVAL 600000      // 10 minutes in milliseconds (10 * 60 * 1000)
#define SYNC_RETRY_INTERVAL 10*60*1000  // 1 minute in milliseconds
#define CARD_READ_DELAY 2000            // Prevent duplicate reads (2 seconds)
#define LED_DISPLAY_DURATION 2000       // How long to show LED status (2 seconds)
#define BUZZER_SUCCESS_DURATION 200     // Success beep duration
#define BUZZER_ERROR_DURATION 500       // Error beep duration
#define BUZZER_OFFLINE_DURATION 300     // Offline beep duration

// ========================================
// AUDIO FEEDBACK CONFIGURATION - ENHANCED
// ========================================

#define BUZZER_ENABLED true             // Set to false to disable buzzer

// Enhanced buzzer tone frequencies (Hz)
#define BUZZER_SUCCESS_FREQ 1000        // Success beep frequency (Hz)
#define BUZZER_ERROR_FREQ 500           // Error beep frequency (Hz)
#define BUZZER_OFFLINE_FREQ 750         // Offline beep frequency (Hz)
#define BUZZER_CARD_DETECT_FREQ 900     // Immediate card detection frequency (Hz)
#define BUZZER_PROCESSING_FREQ 850      // Processing indication frequency (Hz)
#define BUZZER_DUPLICATE_FREQ 600       // Already logged today frequency (Hz)
#define BUZZER_NETWORK_ERROR_FREQ 400   // Network/connection error frequency (Hz)

// Enhanced buzzer durations (ms)
#define BUZZER_SUCCESS_DURATION 200     // Success beep duration
#define BUZZER_ERROR_DURATION 500       // Error beep duration  
#define BUZZER_OFFLINE_DURATION 300     // Offline beep duration
#define BUZZER_CARD_DETECT_DURATION 80  // Card detection beep duration
#define BUZZER_PROCESSING_DURATION 60   // Processing beep duration
#define BUZZER_DUPLICATE_DURATION 100   // Duplicate beep duration
#define BUZZER_NETWORK_ERROR_DURATION 100 // Network error beep duration

// Two-stage feedback timing
#define STAGE1_FEEDBACK_DELAY 200       // Delay between stage 1 and stage 2 (ms)
#define PROCESSING_FEEDBACK_DELAY 100   // Delay for processing feedback (ms)

// ========================================
// RFID CONFIGURATION - UPDATED FOR MFRC522v2
// ========================================

// ========================================
// NOTE: Admin RFID tag and menu have been ARCHIVED
// See archived_features.h for the complete admin menu implementation
// ========================================

// Maximum number of offline logs to store
#define MAX_OFFLINE_LOGS 1000

// RFID read timeout and retry settings
#define RFID_READ_TIMEOUT 100
#define RFID_RETRY_DELAY 50

// MFRC522v2 specific settings
#define RFID_GAIN_MAX       0x07        // Maximum antenna gain
#define RFID_GAIN_AVG       0x04        // Average antenna gain
#define RFID_GAIN_MIN       0x01        // Minimum antenna gain
#define RFID_DEFAULT_GAIN   RFID_GAIN_AVG

// Periodic RFID maintenance to recover from reader stalls
#define RFID_MAINTENANCE_INTERVAL_MS (5UL * 60UL * 1000UL)   // Re-init every 5 minutes
#define RFID_REINIT_IF_IDLE_MS       (15UL * 60UL * 1000UL)  // If idle >15 minutes, force re-init

// ========================================
// STORAGE CONFIGURATION - LITTLEFS ONLY
// ========================================

// EEPROM configuration - DEPRECATED, ONLY USED FOR ONE-TIME MIGRATION
// After migration, all data is stored in LittleFS JSON files
// These constants remain for backward compatibility during migration
#define EEPROM_SIZE 512
#define BACKEND_URL_ADDR 0
#define BACKEND_URL_SIZE 100
#define DEVICE_ID_ADDR 100
#define DEVICE_ID_SIZE 20
#define SETTINGS_ADDR 200
#define SETTINGS_SIZE 50

// LittleFS file paths - Primary storage system
#define OFFLINE_LOGS_FILE "/offline_logs.txt"
#define CONFIG_FILE "/config.json"
#define WIFI_CONFIG_FILE "/wifi_config.json"
#define MIGRATION_FLAG_FILE "/migration_complete.flag"

// ========================================
// DEVICE INFORMATION
// ========================================

#define FIRMWARE_VERSION "2.0.0"
#define DEVICE_MODEL "Attendee Terminal v2"
#define MANUFACTURER "Attendee Systems"

// ========================================
// DEBUGGING CONFIGURATION
// ========================================

#define DEBUG_ENABLED true              // Enable serial debugging
#define DEBUG_BAUD_RATE 115200          // Serial baud rate
#define DEBUG_WIFI_CONNECTION true      // Debug WiFi connection
#define DEBUG_RFID true                 // Debug RFID operations
#define DEBUG_HTTP true                 // Debug HTTP requests
#define DEBUG_RTC true                  // Debug RTC operations

// Debug macros
#if DEBUG_ENABLED
  #define DEBUG_PRINT(x) Serial.print(x)
  #define DEBUG_PRINTLN(x) Serial.println(x)
  #define DEBUG_PRINTF(format, ...) Serial.printf(format, ##__VA_ARGS__)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(format, ...)
#endif

// ========================================
// SECURITY CONFIGURATION
// ========================================

// Enable HTTPS for backend communication (requires SSL certificates)
#define USE_HTTPS false

// API timeout settings
#define HTTP_TIMEOUT 10000              // 10 seconds
#define HTTP_RETRY_COUNT 3              // Number of retries for failed requests

// ========================================
// POWER MANAGEMENT
// ========================================

// Enable deep sleep mode (requires hardware modification)
#define DEEP_SLEEP_ENABLED false
#define DEEP_SLEEP_DURATION 60          // Minutes between wake-ups
#define LOW_POWER_MODE_THRESHOLD 10     // Battery percentage for low power mode

// ========================================
// DISPLAY CONFIGURATION
// ========================================

// Screen timeout (0 = always on)
#define SCREEN_TIMEOUT 0                // Seconds (0 = never timeout)

// Display brightness (0-255, if supported by display)
#define DISPLAY_BRIGHTNESS 255

// Text settings
#define DEFAULT_TEXT_SIZE 1
#define HEADER_TEXT_SIZE 1
#define NAME_TEXT_SIZE 2

// ========================================
// NOTE: Admin Menu configuration has been ARCHIVED
// See archived_features.h for the complete admin menu implementation
// ========================================

// ========================================
// VALIDATION SETTINGS
// ========================================

// Minimum RFID tag length
#define MIN_RFID_TAG_LENGTH 8
#define MAX_RFID_TAG_LENGTH 20

// Backend URL validation
#define MIN_URL_LENGTH 10
#define MAX_URL_LENGTH 100

// ========================================
// PIN MAPPING REFERENCE (DO NOT MODIFY)
// ========================================
/*
ESP8266 Pin Mapping:
- GPIO0  = D3  (Buzzer/Boot mode pin - use carefully)
- GPIO1  = TX  (Serial TX - avoid if using Serial)
- GPIO2  = D4  (Red LED - Boot mode pin)
- GPIO3  = RX  (Serial RX - avoid if using Serial)
- GPIO4  = D2  (I2C SDA)
- GPIO5  = D1  (I2C SCL)
- GPIO12 = D6  (Encoder CLK)
- GPIO13 = D7  (Encoder DT)
- GPIO14 = D5  (Encoder SW)
- GPIO15 = D8  (RFID SS - Boot mode pin, needs pulldown)
- GPIO16 = D0  (Green LED - can't use for interrupts)

Reserved for SPI (DO NOT USE FOR OTHER PURPOSES):
- GPIO12 = D6  = MISO (now used for Encoder CLK - acceptable)
- GPIO13 = D7  = MOSI (now used for Encoder DT - acceptable)
- GPIO14 = D5  = SCK  (now used for Encoder SW - acceptable)
- GPIO15 = D8  = SS   (RFID SS pin)
*/

#endif // CONFIG_H