/*
 * Attendee ESP8266 Attendance Terminal v1 (Optimized)
 * Hardware: ESP8266, RC522 RFID, OLED Display, DS3231 RTC, LEDs, Buzzer
 * Author: Attendee Team
 * Version: 1.0.0
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
#include <RTClib.h>
#include <LittleFS.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Include configuration
#include "config.h"
#include "utils.h"
#include "utils.cpp"


// OLED Display Configuration
#define OLED_WIDTH 128
#define OLED_HEIGHT 64
#define OLED_ADDR 0x3C
#define SCREEN_ADDRESS 0x3C

// Web server for configuration endpoints
ESP8266WebServer configServer(80);

// Hardware Objects
MFRC522DriverPinSimple ss_pin(RFID_SS_PIN);
MFRC522DriverSPI driver(ss_pin);
MFRC522 mfrc522(driver);
RTC_DS3231 rtc;
Adafruit_SSD1306 oled(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);

// Network clients
WiFiClient wifiClient;
WiFiClientSecure wifiClientSecure;
HTTPClient http;

// System status flags
bool isOnline = false;
bool systemInitialized = false;
bool configServerStarted = false;
bool sslSessionValid = false;

// Configuration variables
String backendUrl = "http://your-backend-url.com";  // Default URL
String deviceId = "";
int offlineLogsCount = 0;

// Timing variables
unsigned long systemStartTime = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastSyncAttempt = 0;
unsigned long lastCardScan = 0;
unsigned long lastRFIDMaintenance = 0;
unsigned long lastRFIDActivity = 0;
unsigned long lastPeriodicReconnectAttempt = 0;

// Display state variables
unsigned long ledBlinkTimer = 0;
bool ledBlinkOn = false;

// RFID variables
int consecutiveRFIDReadFailures = 0;

// Last scan information
String lastScannedName = "";
String lastScannedTime = "";
String lastScannedMessage = "";

// Function to play different beep patterns




// Initialize Hardware
bool initializeHardware() {
    // Initialize SPI
    SPI.begin();
    
    // Initialize I2C
    Wire.begin(SDA_PIN, SCL_PIN);
    
    // Initialize OLED
    if(!oled.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println(F("SSD1306 allocation failed"));
        return false;
    }
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    
    // Initialize MFRC522
    mfrc522.PCD_Init();
    delay(50);
    
    // Initialize RTC
    if (!rtc.begin()) {
        Serial.println("RTC failed");
        return false;
    }
    
    // Initialize pins
    pinMode(GREEN_LED, OUTPUT);
    pinMode(RED_LED, OUTPUT);
    pinMode(BUZZER, OUTPUT);
    
    // Turn off LEDs initially
    setLED(false, false);
    
    return true;
}

// Continue with the rest of the optimized firmware...

// RFID card handling
void handleRFIDScan() {
    if (!mfrc522.PICC_IsNewCardPresent()) {
        return;
    }
    
    lastRFIDActivity = millis();
    
    if (!mfrc522.PICC_ReadCardSerial()) {
        consecutiveRFIDReadFailures++;
        if (consecutiveRFIDReadFailures >= 5) {
            mfrc522.PCD_Init();
            consecutiveRFIDReadFailures = 0;
        }
        return;
    }
    
    consecutiveRFIDReadFailures = 0;
    lastRFIDActivity = millis();
    
    // Prevent duplicate reads
    unsigned long currentTime = millis();
    if (currentTime - lastCardScan < 2000) { // 2 second delay between scans
        mfrc522.PICC_HaltA();
        return;
    }
    lastCardScan = currentTime;
    
    // Build RFID tag string
    String rfidTag = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (mfrc522.uid.uidByte[i] < 0x10)
            rfidTag += "0";
        rfidTag += String(mfrc522.uid.uidByte[i], HEX);
    }
    rfidTag.toUpperCase();
    
    // Show scanning animation
    showInfo("Scanning", "Please wait...");
    showCheckmark();
    playSuccessBeep();
    
    // Get current timestamp
    DateTime now = rtc.now();
    char timestamp[20];
    sprintf(timestamp, "%04d-%02d-%02d %02d:%02d:%02d",
            now.year(), now.month(), now.day(),
            now.hour(), now.minute(), now.second());
    
    // Process attendance
    if (isOnline) {
        processOnlineAttendance(rfidTag, timestamp);
    } else {
        processOfflineAttendance(rfidTag, timestamp);
    }
    
    mfrc522.PICC_HaltA();
    delay(50);
}

// Process online attendance
void processOnlineAttendance(String rfidTag, String timestamp) {
    showInfo("Online Mode", "Sending...");
    showSpinner();
    
    StaticJsonDocument<200> doc;
    doc["rfidTag"] = rfidTag;
    doc["timestamp"] = timestamp;
    doc["deviceId"] = deviceId;
    
    String payload;
    serializeJson(doc, payload);
    
    http.begin(wifiClient, backendUrl + "/attendance");
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(payload);
    String response = http.getString();
    
    if (httpCode == 200 || httpCode == 201) {
        handleSuccessfulAttendance(response);
    } else if (httpCode == 400) {
        handleBadRequestAttendance(response);
    } else {
        handleAttendanceError("Connection failed");
        if (httpCode >= 500 || httpCode <= 0) {
            processOfflineAttendance(rfidTag, timestamp);
        }
    }
    
    http.end();
}

// Process offline attendance
void processOfflineAttendance(String rfidTag, String timestamp) {
    if (offlineLogsCount >= 100) { // Maximum offline logs
        showError("Storage full");
        playErrorBeep();
        return;
    }
    
    File file = LittleFS.open("/offline_logs.txt", "a");
    if (file) {
        StaticJsonDocument<200> doc;
        doc["rfidTag"] = rfidTag;
        doc["timestamp"] = timestamp;
        doc["deviceId"] = deviceId;
        
        String jsonLine;
        serializeJson(doc, jsonLine);
        file.println(jsonLine);
        file.close();
        
        offlineLogsCount++;
        showInfo("Offline Mode", "Stored locally");
        showWiFiIcon(false);
        playOfflineBeep();
    } else {
        showError("Storage failed");
        playErrorBeep();
    }
}

// Handle successful attendance
void handleSuccessfulAttendance(String response) {
    StaticJsonDocument<400> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (error) {
        showError("Invalid response");
        playErrorBeep();
        return;
    }
    
    String message = doc["message"] | "Success";
    String userName = doc["attendance"]["userName"] | "Unknown";
    String type = doc["type"] | "unknown";
    
    if (type == "duplicate") {
        showInfo("Notice", "Already logged");
        playDuplicateBeep();
    } else {
        showSuccess(userName.c_str());
        playSuccessBeep();
        setLED(true, false);
    }
}

void handleAttendanceError(const char* errorMessage) {
    showError(errorMessage);
    playErrorBeep();
    setLED(false, true);
}

void handleBadRequestAttendance(String response) {
    StaticJsonDocument<400> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (error) {
        showError("Invalid response");
        playErrorBeep();
        return;
    }
    
    String message = doc["message"] | "Invalid request";
    showError(message.c_str());
    playErrorBeep();
    setLED(false, true);
}

void setup() {
    Serial.begin(115200);
    Serial.println("\nAttendee Terminal v1.0 Starting...");
    
    systemStartTime = millis();
    
    // Initialize hardware
    if (!initializeHardware()) {
        Serial.println("Hardware initialization failed!");
        showError("Hardware init failed");
        return;
    }
    
    // Show boot screen
    showInfo("Booting", "System v1.0");
    showCheckmark();
    delay(1500);
    
    // Initialize filesystem
    if (!LittleFS.begin()) {
        Serial.println("LittleFS init failed!");
        showError("Storage init failed");
        if (LittleFS.format()) {
            Serial.println("LittleFS formatted");
            if (!LittleFS.begin()) {
                return;
            }
        } else {
            return;
        }
    }
    
    // Initialize WiFi
    WiFiManager wifiManager;
    String apName = "Attendee_" + String(ESP.getChipId());
    
    showInfo("WiFi Setup", "Connecting...");
    
    if (!wifiManager.autoConnect(apName.c_str())) {
        Serial.println("Failed to connect to WiFi");
        showInfo("Notice", "Offline mode");
        showWiFiIcon(false);
        isOnline = false;
    } else {
        Serial.println("WiFi connected");
        showInfo("Connected", WiFi.localIP().toString().c_str());
        showWiFiIcon(true);
        isOnline = true;
        delay(1500);
    }
    
    // Start web server if online
    if (isOnline) {
        configServer.begin();
        configServerStarted = true;
    }
    
    // Final setup
    systemInitialized = true;
    showInfo("Ready", "Scan card");
    showCardIcon();
}

void loop() {
    if (!systemInitialized) {
        delay(1000);
        return;
    }
    
    // Handle web server
    if (isOnline) {
        configServer.handleClient();
    }
    
    // Check WiFi and try to reconnect if needed
    static unsigned long lastWiFiCheck = 0;
    if (millis() - lastWiFiCheck > 30000) {
        bool wasOnline = isOnline;
        isOnline = (WiFi.status() == WL_CONNECTED);
        
        if (!wasOnline && isOnline) {
            showInfo("Notice", "Back online");
            showWiFiIcon(true);
            delay(1000);
            showInfo("Ready", "Scan card");
            showCardIcon();
        } else if (wasOnline && !isOnline) {
            showInfo("Notice", "Connection lost");
            showWiFiIcon(false);
            delay(1000);
            showInfo("Ready", "Scan card");
            showCardIcon();
        }
        
        lastWiFiCheck = millis();
    }
    
    // Handle RFID scanning
    handleRFIDScan();
    
    // Sync offline logs when online
    if (isOnline && offlineLogsCount > 0 && 
        (millis() - lastSyncAttempt > 300000)) { // Every 5 minutes
        syncOfflineLogs();
    }
    
    delay(10);  // Prevent watchdog reset
}

void syncOfflineLogs() {
    showInfo("Syncing", "Please wait...");
    showSyncIcon();
    lastSyncAttempt = millis();
    
    File file = LittleFS.open("/offline_logs.txt", "r");
    if (!file) {
        offlineLogsCount = 0;
        return;
    }
    
    String tempContent = "";
    int successCount = 0;
    
    while (file.available()) {
        String line = file.readStringUntil('\n');
        line.trim();
        
        if (line.length() > 0) {
            http.begin(wifiClient, backendUrl + "/attendance");
            http.addHeader("Content-Type", "application/json");
            
            int httpCode = http.POST(line);
            if (httpCode == 200 || httpCode == 201) {
                successCount++;
            } else {
                tempContent += line + "\n";
            }
            
            http.end();
        }
    }
    
    file.close();
    
    // Save remaining failed logs
    if (tempContent.length() > 0) {
        File newFile = LittleFS.open("/offline_logs.txt", "w");
        if (newFile) {
            newFile.print(tempContent);
            newFile.close();
            offlineLogsCount -= successCount;
        }
    } else {
        LittleFS.remove("/offline_logs.txt");
        offlineLogsCount = 0;
    }
    
    char syncMsg[32];
    sprintf(syncMsg, "Synced %d/%d", successCount, successCount + offlineLogsCount);
    showSuccess(syncMsg);
    delay(2000);
    showInfo("Ready", "Scan card");
    showCardIcon();
}
