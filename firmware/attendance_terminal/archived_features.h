/*
 * ARCHIVED CODE - EC11 Encoder and Admin Menu Features
 * Attendee ESP8266 Attendance Terminal v2.0
 * 
 * This file contains all the code related to:
 * - EC11 Rotary Encoder (rotation and button handling)
 * - Admin Menu functionality
 * - Related configuration and helper functions
 * 
 * This code has been archived due to GPIO pin conflicts but is preserved
 * for potential future reuse when more GPIOs become available or with
 * different hardware configurations.
 * 
 * Date Archived: August 16, 2025
 */

#ifndef ARCHIVED_FEATURES_H
#define ARCHIVED_FEATURES_H

// ========================================
// ARCHIVED CONFIGURATION - EC11 ENCODER
// ========================================

/*
// Rotary Encoder Pins (EC11) - ARCHIVED DUE TO GPIO CONFLICTS
#define ENCODER_CLK     12    // D6 - Encoder Clock
#define ENCODER_DT      13    // D7 - Encoder Data  
#define ENCODER_SW      14    // D5 - Encoder Switch
*/

// ========================================
// ARCHIVED CONFIGURATION - ADMIN MENU
// ========================================

/*
// Admin RFID tag for accessing admin menu
#define ADMIN_TAG "D7AB3103"

// ADMIN MENU CONFIGURATION
// ========================================

// Admin menu timeout
#define ADMIN_MENU_TIMEOUT 30000        // 30 seconds

// Admin menu options
#define ADMIN_MENU_ITEMS 7
static const char* ADMIN_MENU_OPTIONS[] = {
  "Device Info",
  "Network Status", 
  "Offline Logs",
  "Force Sync",
  "RFID Test",
  "Reset WiFi",
  "Restart"
};
*/

// ========================================
// ARCHIVED GLOBAL VARIABLES
// ========================================

/*
// Rotary encoder variables
volatile int encoderPos = 0;
volatile bool encoderPressed = false;
unsigned long lastEncoderTime = 0;
int lastEncoderPos = 0;

// Admin menu variables
bool adminMenuActive = false;
int adminMenuSelection = 0;
*/

// ========================================
// ARCHIVED HARDWARE INITIALIZATION
// ========================================

/*
void initializeEncoderPins() {
  // Initialize rotary encoder pins
  pinMode(ENCODER_CLK, INPUT_PULLUP);
  pinMode(ENCODER_DT, INPUT_PULLUP);
  pinMode(ENCODER_SW, INPUT_PULLUP);
  
  // Setup encoder interrupt
  attachInterrupt(digitalPinToInterrupt(ENCODER_CLK), encoderISR, CHANGE);
}
*/

// ========================================
// ARCHIVED ENCODER FUNCTIONS
// ========================================

/*
// Interrupt service routine for encoder rotation
IRAM_ATTR void encoderISR() {
  static unsigned long lastInterrupt = 0;
  unsigned long currentTime = micros();   // use micros() inside ISR

  if (currentTime - lastInterrupt < 300) return; // ~0.3 ms debounce
  lastInterrupt = currentTime;

  bool clkState = digitalRead(ENCODER_CLK);
  bool dtState  = digitalRead(ENCODER_DT);

  if (clkState != dtState) {
    encoderPos++;
  } else {
    encoderPos--;
  }

  // Debug: show whenever ISR fires
  Serial.print("[ISR] encoderPos = ");
  Serial.println(encoderPos);
}

// Encoder handling (rotation + button)
void handleEncoderInput() {
  // Handle encoder rotation (admin menu navigation)
  if (encoderPos != lastEncoderPos) {
    int delta = encoderPos - lastEncoderPos;

    Serial.print("[handleEncoderInput] delta = ");
    Serial.print(delta);
    Serial.print("  encoderPos = ");
    Serial.println(encoderPos);

    if (adminMenuActive) {
      adminMenuSelection += delta;

      // Wrap around menu selection
      if (adminMenuSelection >= ADMIN_MENU_ITEMS) {
        adminMenuSelection = 0;
      } else if (adminMenuSelection < 0) {
        adminMenuSelection = ADMIN_MENU_ITEMS - 1;
      }

      Serial.print("[Admin Menu] Selection changed to: ");
      Serial.println(adminMenuSelection);
    }

    lastEncoderPos = encoderPos;
  }

  // Handle encoder button press (polling with debounce)
  static bool lastButtonState = HIGH;
  static unsigned long lastButtonTime = 0;

  bool currentButtonState = digitalRead(ENCODER_SW);

  if (currentButtonState != lastButtonState) {
    unsigned long currentTime = millis();   // use millis() for debounce
    if (currentTime - lastButtonTime > 200) {
      if (currentButtonState == LOW) { // Button pressed (active low)
        encoderPressed = true;
        Serial.println("[Button] Press detected!");
      }
      lastButtonTime = currentTime;
    }
    lastButtonState = currentButtonState;
  }
}
*/

// ========================================
// ARCHIVED ADMIN MENU FUNCTIONS
// ========================================

/*
void enterAdminMenu() {
  adminMenuActive = true;
  adminMenuSelection = 0;
  
  Serial.println("Entering admin menu");
  logInfo("Admin menu accessed");
  playSuccessBeep();
}

void handleAdminMenu() {
  static unsigned long menuTimeout = 0;
  
  if (menuTimeout == 0) {
    menuTimeout = millis();
  }
  
  // Auto-exit after timeout
  if (millis() - menuTimeout > ADMIN_MENU_TIMEOUT) {
    adminMenuActive = false;
    menuTimeout = 0;
    Serial.println("Admin menu timeout");
    return;
  }
  
  // Handle encoder button press
  if (encoderPressed) {
    encoderPressed = false;
    handleAdminMenuSelection();
    menuTimeout = millis(); // Reset timeout
  }
}

void handleAdminMenuSelection() {
  switch (adminMenuSelection) {
    case 0: // Device Info
      displayDeviceInfo();
      delay(3000);
      break;
    case 1: // Network Status
      displayNetworkStatus();
      delay(3000);
      break;
    case 2: // Offline Logs
      displayOfflineLogsInfo();
      delay(3000);
      break;
    case 3: // Force Sync
      if (isOnline && offlineLogsCount > 0) {
        forceSyncAllLogs();
      } else {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("No logs to sync");
        delay(2000);
      }
      break;
    case 4: // RFID Test
      performRFIDTest();
      break;
    case 5: // Reset WiFi
      resetWiFiSettings();
      break;
    case 6: // Restart Device
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Restarting...");
      delay(1000);
      ESP.restart();
      break;
  }
}

void displayAdminMenu() {
  lcd.setCursor(0, 0);
  lcd.print("ADMIN ");
  lcd.print(adminMenuSelection + 1);
  lcd.print("/");
  lcd.print(ADMIN_MENU_ITEMS);
  
  lcd.setCursor(0, 1);
  String menuItem = String(ADMIN_MENU_OPTIONS[adminMenuSelection]);
  if (menuItem.length() > 16) {
    menuItem = menuItem.substring(0, 13) + "...";
  }
  lcd.print(menuItem);
}

void displayDeviceInfo() {
  // Device info screen 1
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Device Info");
  delay(1000);
  
  // Show firmware version
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("FW: ");
  lcd.print(FIRMWARE_VERSION);
  lcd.setCursor(0, 1);
  lcd.print("ID: ");
  lcd.print(deviceId.substring(deviceId.length() - 8));
  delay(2000);
  
  // Show memory info
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Free RAM:");
  lcd.setCursor(0, 1);
  lcd.print(ESP.getFreeHeap());
  lcd.print(" bytes");
  delay(2000);
  
  // Show uptime
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Uptime:");
  lcd.setCursor(0, 1);
  lcd.print(getFormattedUptime());
  delay(2000);
}

void displayNetworkStatus() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Network Status");
  delay(1000);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi: ");
  lcd.print(isOnline ? "OK" : "FAIL");
  lcd.setCursor(0, 1);
  if (isOnline) {
    IPAddress ip = WiFi.localIP();
    lcd.print(ip);
  } else {
    lcd.print("Not connected");
  }
  delay(2000);
  
  if (isOnline) {
    // Show SSID
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("SSID:");
    lcd.setCursor(0, 1);
    String ssid = WiFi.SSID();
    if (ssid.length() > 16) {
      ssid = ssid.substring(0, 13) + "...";
    }
    lcd.print(ssid);
    delay(2000);
    
    // Show signal strength
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Signal:");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.RSSI());
    lcd.print(" dBm");
    delay(2000);
  }
}

void displayOfflineLogsInfo() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Offline Logs");
  delay(1000);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Count: ");
  lcd.print(offlineLogsCount);
  lcd.setCursor(0, 1);
  if (offlineLogsCount > 0) {
    File file = SPIFFS.open(OFFLINE_LOGS_FILE, "r");
    if (file) {
      lcd.print("Size: ");
      lcd.print(file.size());
      lcd.print("B");
      file.close();
    }
  } else {
    lcd.print("No offline logs");
  }
  delay(2000);
  
  // Show file system usage
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("FS Usage:");
  lcd.setCursor(0, 1);
  size_t used = getFileSystemUsed();
  size_t total = getFileSystemTotal();
  lcd.print(used);
  lcd.print("/");
  lcd.print(total);
  delay(2000);
}

void performRFIDTest() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("RFID Test");
  delay(1000);
  
  // Test RFID connection
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Testing RFID...");
  
  bool rfidOk = testRFIDConnection();
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("RFID: ");
  lcd.print(rfidOk ? "OK" : "FAIL");
  lcd.setCursor(0, 1);
  lcd.print("Ver: ");
  lcd.print(getRFIDVersion());
  delay(2000);
  
  if (rfidOk) {
    // Show antenna gain
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Antenna Gain:");
    lcd.setCursor(0, 1);
    lcd.print("0x");
    lcd.print(getRFIDGain(), HEX);
    delay(2000);
    
    // Card detection test
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Scan test card");
    lcd.setCursor(0, 1);
    lcd.print("in 5 seconds...");
    
    unsigned long testStart = millis();
    bool cardDetected = false;
    
    while (millis() - testStart < 5000) {
      if (mfrc522.PICC_IsNewCardPresent()) {
        cardDetected = true;
        break;
      }
      delay(100);
    }
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Card detected:");
    lcd.setCursor(0, 1);
    lcd.print(cardDetected ? "YES" : "NO");
    delay(2000);
  }
}

void forceSyncAllLogs() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Syncing logs...");
  
  File file = SPIFFS.open(OFFLINE_LOGS_FILE, "r");
  if (!file) {
    lcd.setCursor(0, 1);
    lcd.print("No logs found");
    delay(2000);
    return;
  }
  
  int total = offlineLogsCount;
  int synced = 0;
  String tempContent = "";
  
  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim();
    
    if (line.length() > 0) {
      // Update progress
      lcd.setCursor(0, 1);
      lcd.print("Progress: ");
      lcd.print((synced * 100) / total);
      lcd.print("%");
      
      if (syncSingleLog(line)) {
        synced++;
      } else {
        tempContent += line + "\n";
      }
    }
  }
  file.close();
  
  // Update logs file
  if (tempContent.length() > 0) {
    file = SPIFFS.open(OFFLINE_LOGS_FILE, "w");
    if (file) {
      file.print(tempContent);
      file.close();
    }
    offlineLogsCount = total - synced;
  } else {
    SPIFFS.remove(OFFLINE_LOGS_FILE);
    offlineLogsCount = 0;
  }
  
  // Show result
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sync complete");
  lcd.setCursor(0, 1);
  lcd.print("Success: ");
  lcd.print(synced);
  lcd.print("/");
  lcd.print(total);
  delay(3000);
  
  logInfo("Force sync completed: " + String(synced) + "/" + String(total));
}

void resetWiFiSettings() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Reset WiFi?");
  lcd.setCursor(0, 1);
  lcd.print("Press to confirm");
  
  // Wait for button press confirmation
  encoderPressed = false;
  unsigned long startTime = millis();
  while (millis() - startTime < 5000) {
    if (encoderPressed) {
      encoderPressed = false;
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Resetting WiFi");
      
      // Clear WiFi credentials
      WiFi.disconnect(true);
      delay(1000);
      
      lcd.setCursor(0, 1);
      lcd.print("Restarting...");
      delay(1000);
      logInfo("WiFi settings reset - restarting");
      ESP.restart();
      return;
    }
    delay(100);
    
    // Handle encoder input during wait
    handleEncoderInput();
  }
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Cancelled");
  delay(1000);
}

void enterAdminMenu() {
  adminMenuActive = true;
  adminMenuSelection = 0;
  
  Serial.println("Entering admin menu");
  logInfo("Admin menu accessed");
  playSuccessBeep();
}

void handleAdminMenu() {
  static unsigned long menuTimeout = 0;
  
  if (menuTimeout == 0) {
    menuTimeout = millis();
  }
  
  // Auto-exit after timeout
  if (millis() - menuTimeout > ADMIN_MENU_TIMEOUT) {
    adminMenuActive = false;
    menuTimeout = 0;
    Serial.println("Admin menu timeout");
    return;
  }
  
  // Handle encoder button press
  if (encoderPressed) {
    encoderPressed = false;
    handleAdminMenuSelection();
    menuTimeout = millis(); // Reset timeout
  }
}

void handleAdminMenuSelection() {
  switch (adminMenuSelection) {
    case 0: // Device Info
      displayDeviceInfo();
      delay(3000);
      break;
    case 1: // Network Status
      displayNetworkStatus();
      delay(3000);
      break;
    case 2: // Offline Logs
      displayOfflineLogsInfo();
      delay(3000);
      break;
    case 3: // Force Sync
      if (isOnline && offlineLogsCount > 0) {
        forceSyncAllLogs();
      } else {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("No logs to sync");
        delay(2000);
      }
      break;
    // case 4: // RFID Test
    //   performRFIDTest();
    //   break;
    case 5: // Reset WiFi
      resetWiFiSettings();
      break;
    case 6: // Restart Device
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Restarting...");
      delay(1000);
      ESP.restart();
      break;
  }
}
void displayAdminMenu() {
  lcd.setCursor(0, 0);
  lcd.print("ADMIN ");
  lcd.print(adminMenuSelection + 1);
  lcd.print("/");
  lcd.print(ADMIN_MENU_ITEMS);
  
  lcd.setCursor(0, 1);
  String menuItem = String(ADMIN_MENU_OPTIONS[adminMenuSelection]);
  if (menuItem.length() > 16) {
    menuItem = menuItem.substring(0, 13) + "...";
  }
  lcd.print(menuItem);
}
*/

#endif // ARCHIVED_FEATURES_H
