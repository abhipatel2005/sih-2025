/*
 * Simple MFRC522v2 Test Program
 * Use this to verify MFRC522v2 library installation and basic functionality
 */

#include <SPI.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>

// Pin definitions for ESP8266
#define RFID_SS_PIN   D4  // GPIO2
#define SDA_PIN       D2  // GPIO4
#define SCL_PIN       D1  // GPIO5

// RFID setup
MFRC522DriverPinSimple ss_pin(RFID_SS_PIN);
MFRC522DriverSPI driver(ss_pin);
MFRC522 mfrc522(driver);

void setup() {
  Serial.begin(115200);
  Serial.println("MFRC522v2 Test Program");
  
  // Initialize SPI
  SPI.begin();
  
  // Initialize MFRC522
  if (!mfrc522.PCD_Init()) {
    Serial.println("MFRC522 initialization failed!");
    return;
  }
  
  // Get version
  MFRC522::PCD_Version version = mfrc522.PCD_GetVersion();
  Serial.print("MFRC522 Version: 0x");
  Serial.println(static_cast<int>(version), HEX);
  
  if (static_cast<int>(version) == 0xFF || static_cast<int>(version) == 0x00) {
    Serial.println("ERROR: Invalid version - check wiring!");
  } else {
    Serial.println("MFRC522v2 test successful!");
  }
}

void loop() {
  // Check for new card
  if (mfrc522.PICC_IsNewCardPresent()) {
    if (mfrc522.PICC_ReadCardSerial()) {
      Serial.print("Card UID: ");
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (mfrc522.uid.uidByte[i] < 0x10) Serial.print("0");
        Serial.print(mfrc522.uid.uidByte[i], HEX);
      }
      Serial.println();
      mfrc522.PICC_HaltA();
    }
  }
  delay(100);
}
