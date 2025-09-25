#include "display_utils.h"
#include <math.h>

Adafruit_SSD1306 oledDisplay(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Screen Transitions
void transitionSlideLeft() {
    uint8_t buffer[SCREEN_WIDTH * SCREEN_HEIGHT / 8];
    oledDisplay.getBuffer(buffer);
    
    for(int offset = 0; offset <= SCREEN_WIDTH; offset += 8) {
        oledDisplay.clearDisplay();
        for(int y = 0; y < SCREEN_HEIGHT; y++) {
            for(int x = 0; x < SCREEN_WIDTH - offset; x++) {
                if(buffer[(y/8)*SCREEN_WIDTH + (x+offset)] & (1 << (y&7))) {
                    oledDisplay.drawPixel(x, y, SSD1306_WHITE);
                }
            }
        }
        oledDisplay.display();
        delay(TRANSITION_DELAY);
    }
}

void transitionSlideRight() {
    uint8_t buffer[SCREEN_WIDTH * SCREEN_HEIGHT / 8];
    oledDisplay.getBuffer(buffer);
    
    for(int offset = 0; offset <= SCREEN_WIDTH; offset += 8) {
        oledDisplay.clearDisplay();
        for(int y = 0; y < SCREEN_HEIGHT; y++) {
            for(int x = offset; x < SCREEN_WIDTH; x++) {
                if(buffer[(y/8)*SCREEN_WIDTH + (x-offset)] & (1 << (y&7))) {
                    oledDisplay.drawPixel(x, y, SSD1306_WHITE);
                }
            }
        }
        oledDisplay.display();
        delay(TRANSITION_DELAY);
    }
}

void transitionFade() {
    for(int i = 255; i >= 0; i -= 5) {
        oledDisplay.dim(true);
        oledDisplay.setContrast(i);
        oledDisplay.display();
        delay(TRANSITION_DELAY/4);
    }
    oledDisplay.clearDisplay();
    for(int i = 0; i <= 255; i += 5) {
        oledDisplay.setContrast(i);
        oledDisplay.display();
        delay(TRANSITION_DELAY/4);
    }
    oledDisplay.dim(false);
}

void transitionZoom() {
    uint8_t buffer[SCREEN_WIDTH * SCREEN_HEIGHT / 8];
    oledDisplay.getBuffer(buffer);
    
    for(int scale = 100; scale >= 50; scale -= 5) {
        oledDisplay.clearDisplay();
        float s = scale/100.0;
        for(int y = 0; y < SCREEN_HEIGHT; y++) {
            for(int x = 0; x < SCREEN_WIDTH; x++) {
                int srcX = (x - SCREEN_WIDTH/2)/s + SCREEN_WIDTH/2;
                int srcY = (y - SCREEN_HEIGHT/2)/s + SCREEN_HEIGHT/2;
                if(srcX >= 0 && srcX < SCREEN_WIDTH && srcY >= 0 && srcY < SCREEN_HEIGHT) {
                    if(buffer[(srcY/8)*SCREEN_WIDTH + srcX] & (1 << (srcY&7))) {
                        oledDisplay.drawPixel(x, y, SSD1306_WHITE);
                    }
                }
            }
        }
        oledDisplay.display();
        delay(TRANSITION_DELAY);
    }
    oledDisplay.clearDisplay();
    oledDisplay.display();
}

// Initialize OLED Display
void initializeOLED() {
    if(!oledDisplay.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println(F("SSD1306 allocation failed"));
        return;
    }
    oledDisplay.clearDisplay();
    oledDisplay.setTextColor(SSD1306_WHITE);
    oledDisplay.display();
}

void showSuccessScreen(const char* message) {
    oledDisplay.clearDisplay();
    drawHappyEmoji();
    drawCenteredText(message, 45);
    oledDisplay.display();
}

void showErrorScreen(const char* message) {
    oledDisplay.clearDisplay();
    drawSadEmoji();
    drawCenteredText(message, 45);
    oledDisplay.display();
}

void showLoadingScreen(const char* message, int progress) {
    oledDisplay.clearDisplay();
    drawCenteredText(message, 20);
    drawProgressBar(14, 40, 100, 8, progress);
    oledDisplay.display();
}

void showInfoScreen(const char* title, const char* message) {
    oledDisplay.clearDisplay();
    oledDisplay.setTextSize(1);
    drawCenteredText(title, 10);
    drawCenteredText(message, 30);
    oledDisplay.display();
}

void showWiFiStatus(bool connected) {
    oledDisplay.clearDisplay();
    drawWiFiSymbol(connected);
    drawCenteredText(connected ? "Connected" : "Disconnected", 45);
    oledDisplay.display();
}

void showCardScanScreen(const char* message) {
    oledDisplay.clearDisplay();
    drawCardSymbol();
    drawCenteredText(message, 45);
    oledDisplay.display();
}

void animateSuccess() {
    for(int i = 0; i < 3; i++) {
        oledDisplay.clearDisplay();
        drawCheckmark();
        oledDisplay.display();
        delay(200);
        oledDisplay.clearDisplay();
        oledDisplay.display();
        delay(200);
    }
    drawCheckmark();
    oledDisplay.display();
}

void animateError() {
    for(int i = 0; i < 3; i++) {
        oledDisplay.clearDisplay();
        drawCross();
        oledDisplay.display();
        delay(200);
        oledDisplay.clearDisplay();
        oledDisplay.display();
        delay(200);
    }
    drawCross();
    oledDisplay.display();
}

void animateProcessing(LoadingAnimationType type) {
    static uint8_t frame = 0;
    oledDisplay.clearDisplay();
    
    switch(type) {
        case DOTS_LOADING:
            drawDotsLoading();
            break;
        case CIRCLE_LOADING:
            drawCircleLoading();
            break;
        case BAR_LOADING:
            drawBarLoading();
            break;
        case WAVE_LOADING:
            drawWaveLoading();
            break;
    }
    
    frame = (frame + 1) % 8;
    oledDisplay.display();
    delay(FRAME_DELAY);
}

void drawDotsLoading() {
    static uint8_t pos = 0;
    const uint8_t dots = 5;
    for(uint8_t i = 0; i < dots; i++) {
        uint8_t size = (i == pos) ? 3 : 1;
        oledDisplay.fillCircle(48 + i*8, 32, size, SSD1306_WHITE);
    }
    pos = (pos + 1) % dots;
}

void drawCircleLoading() {
    static float angle = 0;
    const int radius = 15;
    const int centerX = 64;
    const int centerY = 32;
    
    for(int i = 0; i < 8; i++) {
        float a = angle + (i * PI / 4);
        int x = centerX + cos(a) * radius;
        int y = centerY + sin(a) * radius;
        int size = (i == 0) ? 3 : (4-i/2);
        if(size > 0) {
            oledDisplay.fillCircle(x, y, size, SSD1306_WHITE);
        }
    }
    angle += 0.5;
}

void drawBarLoading() {
    static int pos = 0;
    oledDisplay.drawRect(44, 30, 40, 4, SSD1306_WHITE);
    oledDisplay.fillRect(44 + pos, 30, 8, 4, SSD1306_WHITE);
    pos = (pos + 2) % 33;
}

void drawWaveLoading() {
    static float offset = 0;
    const int amplitude = 8;
    const int yCenter = 32;
    
    for(int x = 0; x < SCREEN_WIDTH; x++) {
        int y = yCenter + sin((x + offset) * 0.2) * amplitude;
        oledDisplay.drawPixel(x, y, SSD1306_WHITE);
    }
    offset += 0.5;
}

void animateWiFiConnecting() {
    static int frame = 0;
    for(int i = 0; i < 4; i++) {
        if(i <= frame/8) {
            int radius = (3-i) * 6 + 4;
            oledDisplay.drawCircle(64, 32, radius, SSD1306_WHITE);
        }
    }
    frame = (frame + 1) % 32;
    oledDisplay.display();
}

void animateCardSwipe() {
    const int cardWidth = 30;
    const int cardHeight = 20;
    
    for(int x = -cardWidth; x <= SCREEN_WIDTH; x += 4) {
        oledDisplay.clearDisplay();
        oledDisplay.drawRoundRect(x, 22, cardWidth, cardHeight, 2, SSD1306_WHITE);
        oledDisplay.drawLine(x + 5, 32, x + 25, 32, SSD1306_WHITE);
        oledDisplay.display();
        delay(FRAME_DELAY/4);
    }
}

void animateSync() {
    static int frame = 0;
    const int centerX = 64;
    const int centerY = 32;
    const int radius = 16;
    
    oledDisplay.clearDisplay();
    float angle = frame * PI / 8;
    
    // Draw rotating arrows
    for(int i = 0; i < 2; i++) {
        float a = angle + i * PI;
        int x1 = centerX + cos(a) * radius;
        int y1 = centerY + sin(a) * radius;
        int x2 = centerX + cos(a + PI/4) * (radius-8);
        int y2 = centerY + sin(a + PI/4) * (radius-8);
        oledDisplay.drawLine(centerX, centerY, x1, y1, SSD1306_WHITE);
        oledDisplay.drawLine(x1, y1, x2, y2, SSD1306_WHITE);
    }
    
    frame = (frame + 1) % 16;
    oledDisplay.display();
}

void animateHeartbeat() {
    static int frame = 0;
    const int points = 32;
    const int amplitude = 16;
    const int baseY = 32;
    
    oledDisplay.clearDisplay();
    
    for(int i = 0; i < points; i++) {
        int x = map(i, 0, points-1, 0, SCREEN_WIDTH);
        int y = baseY;
        
        if(i == points/2) {
            y = baseY - amplitude * sin(frame * PI / 8);
        } else if(i == points/2 + 1) {
            y = baseY + amplitude * sin(frame * PI / 8);
        } else if(i == points/2 + 2) {
            y = baseY - amplitude/2 * sin(frame * PI / 8);
        }
        
        if(i > 0) {
            int prevX = map(i-1, 0, points-1, 0, SCREEN_WIDTH);
            int prevY = (i-1 == points/2) ? baseY - amplitude * sin(frame * PI / 8) :
                       (i-1 == points/2 + 1) ? baseY + amplitude * sin(frame * PI / 8) :
                       (i-1 == points/2 + 2) ? baseY - amplitude/2 * sin(frame * PI / 8) :
                       baseY;
            oledDisplay.drawLine(prevX, prevY, x, y, SSD1306_WHITE);
        }
    }
    
    frame = (frame + 1) % 16;
    oledDisplay.display();
}

void animatePowerOn() {
    for(int i = 0; i < 32; i++) {
        oledDisplay.clearDisplay();
        int size = map(i, 0, 31, 2, 32);
        oledDisplay.fillCircle(64, 32, size, SSD1306_WHITE);
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
    
    for(int i = 0; i < 16; i++) {
        oledDisplay.clearDisplay();
        oledDisplay.drawCircle(64, 32, 32, SSD1306_WHITE);
        oledDisplay.drawLine(64, 12, 64, 32, SSD1306_WHITE);
        float brightness = (15-i)/15.0;
        oledDisplay.dim(true);
        oledDisplay.setContrast(brightness * 255);
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
}

void animatePowerOff() {
    for(int i = 0; i < 16; i++) {
        oledDisplay.clearDisplay();
        oledDisplay.drawCircle(64, 32, 32, SSD1306_WHITE);
        oledDisplay.drawLine(64, 12, 64, 32, SSD1306_WHITE);
        float brightness = i/15.0;
        oledDisplay.dim(true);
        oledDisplay.setContrast((1-brightness) * 255);
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
    
    for(int i = 31; i >= 0; i--) {
        oledDisplay.clearDisplay();
        int size = map(i, 0, 31, 2, 32);
        oledDisplay.fillCircle(64, 32, size, SSD1306_WHITE);
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
    oledDisplay.clearDisplay();
    oledDisplay.display();
}

void drawProgressBar(int x, int y, int width, int height, int progress) {
    oledDisplay.drawRect(x, y, width, height, SSD1306_WHITE);
    int fillWidth = map(progress, 0, 100, 0, width - 4);
    oledDisplay.fillRect(x + 2, y + 2, fillWidth, height - 4, SSD1306_WHITE);
}

void drawCenteredText(const char* text, int y) {
    int16_t x1, y1;
    uint16_t w, h;
    oledDisplay.setTextSize(1);
    oledDisplay.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
    oledDisplay.setCursor((SCREEN_WIDTH - w) / 2, y);
    oledDisplay.print(text);
}

void drawHappyEmoji() {
    oledDisplay.drawCircle(64, 24, 20, SSD1306_WHITE);
    oledDisplay.fillCircle(56, 17, 3, SSD1306_WHITE);
    oledDisplay.fillCircle(72, 17, 3, SSD1306_WHITE);
    for(int i = 0; i < 15; i++) {
        int x = 56 + i;
        oledDisplay.drawPixel(x, 28 + sin((i-7)*0.3)*3, SSD1306_WHITE);
    }
}

void drawSadEmoji() {
    oledDisplay.drawCircle(64, 24, 20, SSD1306_WHITE);
    oledDisplay.fillCircle(56, 17, 3, SSD1306_WHITE);
    oledDisplay.fillCircle(72, 17, 3, SSD1306_WHITE);
    for(int i = 0; i < 15; i++) {
        int x = 56 + i;
        oledDisplay.drawPixel(x, 32 - sin((i-7)*0.3)*3, SSD1306_WHITE);
    }
}

void drawVerySadEmoji() {
    oledDisplay.drawCircle(64, 24, 20, SSD1306_WHITE);
    oledDisplay.fillCircle(56, 17, 3, SSD1306_WHITE);
    oledDisplay.fillCircle(72, 17, 3, SSD1306_WHITE);
    for(int i = 0; i < 15; i++) {
        int x = 56 + i;
        oledDisplay.drawPixel(x, 35 - sin((i-7)*0.4)*5, SSD1306_WHITE);
    }
    // Draw tears
    oledDisplay.drawLine(53, 20, 53, 28, SSD1306_WHITE);
    oledDisplay.drawLine(75, 20, 75, 28, SSD1306_WHITE);
}

void drawNeutralEmoji() {
    oledDisplay.drawCircle(64, 24, 20, SSD1306_WHITE);
    oledDisplay.fillCircle(56, 17, 3, SSD1306_WHITE);
    oledDisplay.fillCircle(72, 17, 3, SSD1306_WHITE);
    oledDisplay.drawLine(56, 32, 72, 32, SSD1306_WHITE);
}

void drawWinkEmoji() {
    oledDisplay.drawCircle(64, 24, 20, SSD1306_WHITE);
    // Winking eye
    oledDisplay.drawLine(54, 17, 58, 17, SSD1306_WHITE);
    // Open eye
    oledDisplay.fillCircle(72, 17, 3, SSD1306_WHITE);
    // Smile
    for(int i = 0; i < 15; i++) {
        int x = 56 + i;
        oledDisplay.drawPixel(x, 28 + sin((i-7)*0.3)*3, SSD1306_WHITE);
    }
}

void drawThinkingEmoji() {
    oledDisplay.drawCircle(64, 24, 20, SSD1306_WHITE);
    oledDisplay.fillCircle(56, 17, 3, SSD1306_WHITE);
    oledDisplay.fillCircle(72, 17, 3, SSD1306_WHITE);
    // Thinking bubble
    oledDisplay.drawCircle(84, 14, 3, SSD1306_WHITE);
    oledDisplay.drawCircle(80, 18, 2, SSD1306_WHITE);
    oledDisplay.drawCircle(76, 20, 1, SSD1306_WHITE);
    // Thinking expression
    oledDisplay.drawLine(58, 32, 70, 32, SSD1306_WHITE);
}

void drawSleepyEmoji() {
    oledDisplay.drawCircle(64, 24, 20, SSD1306_WHITE);
    // Closed eyes
    oledDisplay.drawLine(54, 17, 58, 17, SSD1306_WHITE);
    oledDisplay.drawLine(70, 17, 74, 17, SSD1306_WHITE);
    // Z's
    oledDisplay.drawLine(84, 14, 88, 14, SSD1306_WHITE);
    oledDisplay.drawLine(88, 14, 84, 18, SSD1306_WHITE);
    oledDisplay.drawLine(84, 18, 88, 18, SSD1306_WHITE);
    // Slight smile
    for(int i = 0; i < 15; i++) {
        int x = 56 + i;
        oledDisplay.drawPixel(x, 28 + sin((i-7)*0.2)*2, SSD1306_WHITE);
    }
}

void drawConfusedEmoji() {
    oledDisplay.drawCircle(64, 24, 20, SSD1306_WHITE);
    oledDisplay.fillCircle(56, 17, 3, SSD1306_WHITE);
    oledDisplay.fillCircle(72, 17, 3, SSD1306_WHITE);
    // Confused mouth
    for(int i = 0; i < 10; i++) {
        int x = 59 + i;
        oledDisplay.drawPixel(x, 32 + sin(i*0.6)*2, SSD1306_WHITE);
    }
    // Question mark
    oledDisplay.drawCircle(84, 14, 2, SSD1306_WHITE);
    oledDisplay.drawPixel(84, 18, SSD1306_WHITE);
}

void drawCoolEmoji() {
    oledDisplay.drawCircle(64, 24, 20, SSD1306_WHITE);
    // Sunglasses
    oledDisplay.fillRect(52, 15, 8, 4, SSD1306_WHITE);
    oledDisplay.fillRect(68, 15, 8, 4, SSD1306_WHITE);
    oledDisplay.drawLine(60, 17, 68, 17, SSD1306_WHITE);
    // Cool smile
    for(int i = 0; i < 12; i++) {
        int x = 58 + i;
        oledDisplay.drawPixel(x, 30 + (i < 6 ? 0 : 2), SSD1306_WHITE);
    }
}

// Status Symbols
void drawWiFiSymbol(bool connected) {
    if(connected) {
        for(int i = 16; i >= 4; i -= 6) {
            oledDisplay.drawCircle(64, 32, i, SSD1306_WHITE);
        }
        oledDisplay.fillCircle(64, 32, 2, SSD1306_WHITE);
    } else {
        oledDisplay.drawCircle(64, 32, 16, SSD1306_WHITE);
        oledDisplay.drawLine(48, 48, 80, 16, SSD1306_WHITE);
    }
}

void drawBatterySymbol(int percentage) {
    oledDisplay.drawRect(44, 12, 32, 16, SSD1306_WHITE);
    oledDisplay.fillRect(76, 16, 4, 8, SSD1306_WHITE);
    int fillWidth = map(percentage, 0, 100, 0, 28);
    oledDisplay.fillRect(46, 14, fillWidth, 12, SSD1306_WHITE);
}

void drawCardSymbol() {
    oledDisplay.drawRoundRect(44, 12, 40, 25, 3, SSD1306_WHITE);
    oledDisplay.drawLine(54, 22, 74, 22, SSD1306_WHITE);
    oledDisplay.drawLine(54, 27, 74, 27, SSD1306_WHITE);
}

void drawCheckmark() {
    oledDisplay.drawLine(45, 32, 55, 42, SSD1306_WHITE);
    oledDisplay.drawLine(55, 42, 85, 22, SSD1306_WHITE);
}

void drawCross() {
    oledDisplay.drawLine(45, 22, 85, 42, SSD1306_WHITE);
    oledDisplay.drawLine(45, 42, 85, 22, SSD1306_WHITE);
}

void drawThumbsUp() {
    oledDisplay.drawLine(60, 22, 60, 42, SSD1306_WHITE);
    oledDisplay.drawLine(60, 42, 68, 42, SSD1306_WHITE);
    oledDisplay.drawLine(68, 42, 68, 32, SSD1306_WHITE);
    oledDisplay.drawLine(68, 32, 60, 32, SSD1306_WHITE);
    oledDisplay.fillCircle(64, 22, 4, SSD1306_WHITE);
}

void drawThumbsDown() {
    oledDisplay.drawLine(60, 22, 60, 42, SSD1306_WHITE);
    oledDisplay.drawLine(60, 22, 68, 22, SSD1306_WHITE);
    oledDisplay.drawLine(68, 22, 68, 32, SSD1306_WHITE);
    oledDisplay.drawLine(68, 32, 60, 32, SSD1306_WHITE);
    oledDisplay.fillCircle(64, 42, 4, SSD1306_WHITE);
}

void drawHeart() {
    for(int i = -6; i < 7; i++) {
        for(int j = -6; j < 7; j++) {
            float x = i / 6.0;
            float y = j / 6.0;
            if((x*x + y*y - 1)*(x*x + y*y - 1)*(x*x + y*y - 1) - x*x*y*y*y <= 0) {
                oledDisplay.drawPixel(64 + i*2, 32 + j*2, SSD1306_WHITE);
            }
        }
    }
}

void drawLock(bool locked) {
    if(locked) {
        oledDisplay.drawRoundRect(58, 24, 12, 16, 2, SSD1306_WHITE);
        oledDisplay.drawRoundRect(54, 14, 20, 12, 6, SSD1306_WHITE);
    } else {
        oledDisplay.drawRoundRect(58, 24, 12, 16, 2, SSD1306_WHITE);
        oledDisplay.drawRoundRect(68, 14, 20, 12, 6, SSD1306_WHITE);
    }
}

void drawClock() {
    oledDisplay.drawCircle(64, 32, 16, SSD1306_WHITE);
    oledDisplay.drawLine(64, 32, 64, 20, SSD1306_WHITE);
    oledDisplay.drawLine(64, 32, 72, 32, SSD1306_WHITE);
    oledDisplay.fillCircle(64, 32, 2, SSD1306_WHITE);
}

void drawGear() {
    for(int i = 0; i < 8; i++) {
        float angle = i * PI / 4;
        int x1 = 64 + cos(angle) * 12;
        int y1 = 32 + sin(angle) * 12;
        int x2 = 64 + cos(angle) * 16;
        int y2 = 32 + sin(angle) * 16;
        oledDisplay.drawLine(x1, y1, x2, y2, SSD1306_WHITE);
    }
    oledDisplay.drawCircle(64, 32, 12, SSD1306_WHITE);
    oledDisplay.drawCircle(64, 32, 6, SSD1306_WHITE);
}
