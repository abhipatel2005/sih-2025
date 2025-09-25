// Animation functions
void animateCardSwipe() {
    const int cardWidth = 30;
    const int cardHeight = 20;
    
    for(int x = -cardWidth; x <= SCREEN_WIDTH; x += 4) {
        oledDisplay.clearDisplay();
        oledDisplay.drawRoundRect(x, 22, cardWidth, cardHeight, 2, SSD1306_WHITE);
        oledDisplay.drawLine(x + 5, 32, x + 25, 32, SSD1306_WHITE);
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
}

void animateHeartbeat() {
    const int centerX = 64;
    const int centerY = 32;
    const int maxSize = 20;
    
    for(int size = maxSize; size >= 10; size--) {
        oledDisplay.clearDisplay();
        drawHeart(centerX, centerY, size);
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
    for(int size = 10; size <= maxSize; size++) {
        oledDisplay.clearDisplay();
        drawHeart(centerX, centerY, size);
        oledDisplay.display();
        delay(FRAME_DELAY/2);
    }
}

void drawHeart(int x, int y, int size) {
    float angle = PI/4;
    int radius = size/2;
    
    for(int i = 0; i <= 30; i++) {
        float a = i * (PI/15) - angle;
        int hx = x + cos(a) * radius;
        int hy = y + sin(a) * radius;
        oledDisplay.drawPixel(hx, hy, SSD1306_WHITE);
    }
}

void animateSync() {
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
        drawArrowhead(centerX, centerY, x1, y1);
        drawArrowhead(centerX, centerY, x2, y2);
        
        oledDisplay.display();
        delay(FRAME_DELAY);
    }
}

void drawArrowhead(int x1, int y1, int x2, int y2) {
    float angle = atan2(y2 - y1, x2 - x1);
    int arrowSize = 4;
    
    int ax1 = x2 - arrowSize * cos(angle - PI/6);
    int ay1 = y2 - arrowSize * sin(angle - PI/6);
    int ax2 = x2 - arrowSize * cos(angle + PI/6);
    int ay2 = y2 - arrowSize * sin(angle + PI/6);
    
    oledDisplay.drawLine(x2, y2, ax1, ay1, SSD1306_WHITE);
    oledDisplay.drawLine(x2, y2, ax2, ay2, SSD1306_WHITE);
}

void drawThumbsUp() {
    // Thumb outline
    oledDisplay.drawLine(60, 20, 60, 35, SSD1306_WHITE);
    oledDisplay.drawLine(60, 35, 65, 40, SSD1306_WHITE);
    oledDisplay.drawLine(65, 40, 75, 40, SSD1306_WHITE);
    oledDisplay.drawLine(75, 40, 75, 25, SSD1306_WHITE);
    oledDisplay.drawLine(75, 25, 70, 20, SSD1306_WHITE);
    oledDisplay.drawLine(70, 20, 60, 20, SSD1306_WHITE);
    
    // Fill
    for(int i = 61; i < 74; i++) {
        oledDisplay.drawLine(i, 21, i, 39, SSD1306_WHITE);
    }
}

void drawThumbsDown() {
    // Inverted thumbs up
    oledDisplay.drawLine(60, 40, 60, 25, SSD1306_WHITE);
    oledDisplay.drawLine(60, 25, 65, 20, SSD1306_WHITE);
    oledDisplay.drawLine(65, 20, 75, 20, SSD1306_WHITE);
    oledDisplay.drawLine(75, 20, 75, 35, SSD1306_WHITE);
    oledDisplay.drawLine(75, 35, 70, 40, SSD1306_WHITE);
    oledDisplay.drawLine(70, 40, 60, 40, SSD1306_WHITE);
    
    // Fill
    for(int i = 61; i < 74; i++) {
        oledDisplay.drawLine(i, 21, i, 39, SSD1306_WHITE);
    }
}

void drawVeryHappyEmoji() {
    // Face
    oledDisplay.drawCircle(64, 32, 20, SSD1306_WHITE);
    
    // Eyes
    oledDisplay.fillCircle(56, 25, 3, SSD1306_WHITE);
    oledDisplay.fillCircle(72, 25, 3, SSD1306_WHITE);
    
    // Sparkles in eyes
    oledDisplay.drawPixel(54, 23, SSD1306_BLACK);
    oledDisplay.drawPixel(70, 23, SSD1306_BLACK);
    
    // Big smile with teeth
    oledDisplay.drawLine(54, 35, 74, 35, SSD1306_WHITE);
    for(int i = 0; i < 15; i++) {
        int x = 56 + i;
        oledDisplay.drawPixel(x, 36 + sin((i-7)*0.3)*4, SSD1306_WHITE);
        // Teeth lines
        if(i % 4 == 0) {
            oledDisplay.drawLine(x, 35, x, 38, SSD1306_WHITE);
        }
    }
}

void drawConfusedEmoji() {
    // Face
    oledDisplay.drawCircle(64, 32, 20, SSD1306_WHITE);
    
    // Eyes
    oledDisplay.fillCircle(56, 25, 2, SSD1306_WHITE);
    oledDisplay.drawCircle(72, 25, 3, SSD1306_WHITE);
    
    // Raised eyebrow
    oledDisplay.drawLine(69, 20, 75, 22, SSD1306_WHITE);
    
    // Squiggly mouth
    for(int i = 0; i < 10; i++) {
        int x = 59 + i;
        oledDisplay.drawPixel(x, 38 + sin(i*0.8)*2, SSD1306_WHITE);
    }
}

void drawCoolEmoji() {
    // Face
    oledDisplay.drawCircle(64, 32, 20, SSD1306_WHITE);
    
    // Sunglasses
    oledDisplay.fillRect(52, 23, 8, 4, SSD1306_WHITE);
    oledDisplay.fillRect(68, 23, 8, 4, SSD1306_WHITE);
    oledDisplay.drawLine(60, 25, 68, 25, SSD1306_WHITE);
    
    // Smirk
    for(int i = 0; i < 12; i++) {
        int x = 58 + i;
        int y = 38 + (i < 6 ? 0 : -2);
        oledDisplay.drawPixel(x, y, SSD1306_WHITE);
    }
}

void drawThinkingEmoji() {
    // Face
    oledDisplay.drawCircle(64, 32, 20, SSD1306_WHITE);
    
    // Eyes
    oledDisplay.fillCircle(56, 25, 2, SSD1306_WHITE);
    oledDisplay.fillCircle(72, 25, 2, SSD1306_WHITE);
    
    // Thinking bubble
    oledDisplay.drawCircle(80, 15, 3, SSD1306_WHITE);
    oledDisplay.drawCircle(75, 20, 2, SSD1306_WHITE);
    oledDisplay.drawCircle(72, 23, 1, SSD1306_WHITE);
    
    // Thoughtful mouth
    oledDisplay.drawLine(60, 38, 68, 38, SSD1306_WHITE);
}

// Transitions
void transitionSlideLeft() {
    for(int i = 0; i <= SCREEN_WIDTH; i += 4) {
        oledDisplay.ssd1306_command(SSD1306_COLUMNADDR);
        oledDisplay.ssd1306_command(0);
        oledDisplay.ssd1306_command(SCREEN_WIDTH-1);
        oledDisplay.ssd1306_command(SSD1306_PAGEADDR);
        oledDisplay.ssd1306_command(0);
        oledDisplay.ssd1306_command(7);
        
        for(int x = i; x < SCREEN_WIDTH; x++) {
            for(int y = 0; y < 8; y++) {
                oledDisplay.ssd1306_command(0);
            }
        }
        oledDisplay.display();
        delay(TRANSITION_DELAY/2);
    }
}

void transitionZoom() {
    const int centerX = SCREEN_WIDTH/2;
    const int centerY = SCREEN_HEIGHT/2;
    
    for(int i = 0; i < 32; i++) {
        oledDisplay.clearDisplay();
        int size = 32 - i;
        oledDisplay.drawRect(centerX - size, centerY - size/2, size*2, size, SSD1306_WHITE);
        oledDisplay.display();
        delay(TRANSITION_DELAY/2);
    }
}
