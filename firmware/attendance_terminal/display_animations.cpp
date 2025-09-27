#include "display_utils.h"
#include <Arduino.h>
#include <math.h>

// Additional animation functions beyond the main display_utils.cpp functions
// Note: This file contains extended animations that complement the core display functions

// Extended card swipe animation with more visual effects
void animateCardSwipeExtended() {
    const int cardWidth = 30;
    const int cardHeight = 20;
    
    for(int x = -cardWidth; x <= SCREEN_WIDTH; x += 4) {
        oledDisplay.clearDisplay();
        
        // Draw card
        oledDisplay.drawRoundRect(x, 22, cardWidth, cardHeight, 2, SSD1306_WHITE);
        oledDisplay.drawLine(x + 5, 32, x + 25, 32, SSD1306_WHITE);
        
        // Draw motion lines
        for(int i = 1; i <= 3; i++) {
            int lineX = x - i * 8;
            if(lineX > -10) {
                oledDisplay.drawLine(lineX, 28, lineX + 5, 28, SSD1306_WHITE);
                oledDisplay.drawLine(lineX, 36, lineX + 5, 36, SSD1306_WHITE);
            }
        }
        
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
}

// Extended heartbeat animation with pulse effect
void animateHeartbeatExtended() {
    const int centerX = 64;
    const int centerY = 32;
    const int maxSize = 20;
    
    for(int size = maxSize; size >= 10; size--) {
        oledDisplay.clearDisplay();
        drawHeartExtended(centerX, centerY, size);
        
        // Add pulse rings
        for(int ring = 1; ring <= 3; ring++) {
            int ringSize = size + ring * 5;
            if(ringSize <= maxSize + 15) {
                oledDisplay.drawCircle(centerX, centerY, ringSize, SSD1306_WHITE);
            }
        }
        
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
    for(int size = 10; size <= maxSize; size++) {
        oledDisplay.clearDisplay();
        drawHeartExtended(centerX, centerY, size);
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
}

// Helper function to draw heart shape
void drawHeartExtended(int x, int y, int size) {
    float angle = PI/4;
    int radius = size/2;
    
    for(int i = 0; i <= 30; i++) {
        float a = i * (PI/15) - angle;
        int hx = x + cos(a) * radius;
        int hy = y + sin(a) * radius;
        oledDisplay.drawPixel(hx, hy, SSD1306_WHITE);
    }
}

// Extended sync animation with rotating elements
void animateSyncExtended() {
    const int centerX = 64;
    const int centerY = 32;
    const int radius = 15;
    
    for(int i = 0; i < 360; i += 30) {
        oledDisplay.clearDisplay();
        float angle = i * PI / 180;
        
        // Draw rotating arrows
        int x1 = centerX + cos(angle) * radius;
        int y1 = centerY + sin(angle) * radius;
        int x2 = centerX + cos(angle + PI) * radius;
        int y2 = centerY + sin(angle + PI) * radius;
        
        oledDisplay.drawLine(centerX, centerY, x1, y1, SSD1306_WHITE);
        oledDisplay.drawLine(centerX, centerY, x2, y2, SSD1306_WHITE);
        
        // Draw arrowheads
        drawArrowheadExtended(centerX, centerY, x1, y1);
        drawArrowheadExtended(centerX, centerY, x2, y2);
        
        // Draw center circle
        oledDisplay.drawCircle(centerX, centerY, 3, SSD1306_WHITE);
        
        oledDisplay.display();
        delay(FRAME_DELAY);
    }
}

void drawArrowheadExtended(int x1, int y1, int x2, int y2) {
    float angle = atan2(y2 - y1, x2 - x1);
    int arrowSize = 4;
    
    int ax1 = x2 - arrowSize * cos(angle - PI/6);
    int ay1 = y2 - arrowSize * sin(angle - PI/6);
    int ax2 = x2 - arrowSize * cos(angle + PI/6);
    int ay2 = y2 - arrowSize * sin(angle + PI/6);
    
    oledDisplay.drawLine(x2, y2, ax1, ay1, SSD1306_WHITE);
    oledDisplay.drawLine(x2, y2, ax2, ay2, SSD1306_WHITE);
}
