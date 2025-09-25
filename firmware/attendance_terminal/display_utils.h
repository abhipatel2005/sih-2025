#ifndef DISPLAY_UTILS_H
#define DISPLAY_UTILS_H

#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>
#include <math.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// Animation timing constants
#define FRAME_DELAY 100
#define TRANSITION_DELAY 50
#define EMOJI_SIZE 24

// Display colors
#define SSD1306_WHITE 1
#define SSD1306_BLACK 0

// Mathematical constants if not defined
#ifndef PI
#define PI 3.14159265359
#endif

extern Adafruit_SSD1306 oledDisplay;

// Loading animation states
enum LoadingAnimationType {
    DOTS_LOADING,
    CIRCLE_LOADING,
    BAR_LOADING,
    WAVE_LOADING
};

// Basic Display Functions
void initializeOLED();
void clearWithFade();
void drawCenteredText(const char* text, int y);
void drawProgressBar(int x, int y, int width, int height, int progress);

// Screen Display Functions
void showSuccessScreen(const char* message);
void showErrorScreen(const char* message);
void showLoadingScreen(const char* message, int progress);
void showInfoScreen(const char* title, const char* message);
void showWiFiStatus(bool connected);
void showCardScanScreen(const char* message);

// Animations
void animateSuccess();
void animateError();
void animateProcessing(LoadingAnimationType type = DOTS_LOADING);
void animateWiFiConnecting();
void animateCardSwipe();
void animateSync();
void animateHeartbeat();
void animatePowerOn();
void animatePowerOff();

// Emojis and Symbols
void drawHappyEmoji();
void drawVeryHappyEmoji();
void drawSadEmoji();
void drawVerySadEmoji();
void drawNeutralEmoji();
void drawWinkEmoji();
void drawThinkingEmoji();
void drawSleepyEmoji();
void drawConfusedEmoji();
void drawCoolEmoji();

// Status Symbols
void drawWiFiSymbol(bool connected);
void drawBatterySymbol(int percentage);
void drawCardSymbol();
void drawCheckmark();
void drawCross();
void drawThumbsUp();
void drawThumbsDown();
void drawHeart();
void drawLock(bool locked);
void drawClock();
void drawGear();

// Loading Animations
void drawDotsLoading();
void drawCircleLoading();
void drawBarLoading();
void drawWaveLoading();

// Transitions
void transitionSlideLeft();
void transitionSlideRight();
void transitionFade();
void transitionZoom();

#endif
