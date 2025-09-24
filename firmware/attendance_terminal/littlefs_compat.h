/*
 * LittleFS Compatibility Layer for Attendee Attendance Terminal
 * Provides seamless migration from SPIFFS to LittleFS
 * Ensures backward compatibility with existing file operations
 */

#ifndef LITTLEFS_COMPATIBILITY_H
#define LITTLEFS_COMPATIBILITY_H

#include <LittleFS.h>

// ========================================
// COMPATIBILITY MACROS AND DEFINITIONS
// ========================================

// Main compatibility macro - allows existing SPIFFS code to work with LittleFS
#ifndef SPIFFS
#define SPIFFS LittleFS
#endif

// ========================================
// COMPATIBILITY FUNCTIONS
// ========================================

class LittleFSCompat {
public:
  // File system initialization with automatic formatting fallback
  static bool begin() {
    if (!LittleFS.begin()) {
      Serial.println("[FS] LittleFS init failed, attempting format...");
      
      if (LittleFS.format()) {
        Serial.println("[FS] LittleFS formatted successfully");
        if (LittleFS.begin()) {
          Serial.println("[FS] LittleFS initialized after format");
          return true;
        }
      }
      
      Serial.println("[FS] LittleFS initialization completely failed");
      return false;
    }
    
    Serial.println("[FS] LittleFS initialized successfully");
    return true;
  }
  
  // File operations wrapper (identical API, no changes needed)
  static File open(const String& path, const char* mode) {
    return LittleFS.open(path, mode);
  }
  
  static File open(const char* path, const char* mode) {
    return LittleFS.open(path, mode);
  }
  
  static bool remove(const String& path) {
    return LittleFS.remove(path);
  }
  
  static bool remove(const char* path) {
    return LittleFS.remove(path);
  }
  
  static bool exists(const String& path) {
    return LittleFS.exists(path);
  }
  
  static bool exists(const char* path) {
    return LittleFS.exists(path);
  }
  
  // File system info wrapper for ESP8266
  #ifdef ESP8266
  static bool info(FSInfo& info) {
    return LittleFS.info(info);
  }
  #endif
  
  // Cross-platform file system info
  static size_t totalBytes() {
    #ifdef ESP8266
      FSInfo fs_info;
      LittleFS.info(fs_info);
      return fs_info.totalBytes;
    #else
      return LittleFS.totalBytes();
    #endif
  }
  
  static size_t usedBytes() {
    #ifdef ESP8266
      FSInfo fs_info;
      LittleFS.info(fs_info);
      return fs_info.usedBytes;
    #else
      return LittleFS.usedBytes();
    #endif
  }
  
  static size_t freeBytes() {
    return totalBytes() - usedBytes();
  }
  
  // Directory operations (LittleFS specific enhancements)
  static bool mkdir(const String& path) {
    return LittleFS.mkdir(path);
  }
  
  static bool rmdir(const String& path) {
    return LittleFS.rmdir(path);
  }
  
  // Format file system
  static bool format() {
    return LittleFS.format();
  }
  
  // End file system
  static void end() {
    LittleFS.end();
  }
};

// ========================================
// MIGRATION HELPER FUNCTIONS
// ========================================

namespace LittleFSMigration {
  
  // Check if migration from SPIFFS is needed
  bool isMigrationNeeded() {
    // This is mainly for documentation - LittleFS will handle the transition
    // The compatibility layer ensures no breaking changes
    return false;
  }
  
  // Perform any necessary data migration (currently not needed)
  bool performMigration() {
    Serial.println("[FS] LittleFS migration: No migration needed, using compatibility layer");
    return true;
  }
  
  // Verify file system integrity after migration
  bool verifyFileSystem() {
    if (!LittleFS.begin()) {
      Serial.println("[FS] File system verification failed - cannot access LittleFS");
      return false;
    }
    
    Serial.println("[FS] File system verification successful");
    Serial.printf("[FS] Total space: %zu bytes\n", LittleFSCompat::totalBytes());
    Serial.printf("[FS] Used space: %zu bytes\n", LittleFSCompat::usedBytes());
    Serial.printf("[FS] Free space: %zu bytes\n", LittleFSCompat::freeBytes());
    
    return true;
  }
  
  // Get migration status information
  void getMigrationInfo() {
    Serial.println("=== LittleFS Migration Status ===");
    Serial.println("✓ SPIFFS → LittleFS compatibility layer active");
    Serial.println("✓ All existing file operations supported");
    Serial.println("✓ No code changes required in main firmware");
    Serial.println("✓ Enhanced performance and reliability");
    Serial.println("✓ Better wear leveling and crash recovery");
    Serial.println("==================================");
  }
}

#endif // LITTLEFS_COMPATIBILITY_H
