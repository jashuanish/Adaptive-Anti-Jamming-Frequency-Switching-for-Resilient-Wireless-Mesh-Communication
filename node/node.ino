/*
 * ============================================================
 *  Generic NRF24L01 Node — Sender / Receiver / Jammer
 *  WITH Jam Detection, Coordinated Channel-Hopping Anti-Jam,
 *  Outbound Buffering & Automatic Retransmission
 * ============================================================
 *  Upload the SAME sketch to every ESP32 board. On boot the user
 *  picks a ROLE (1/2/3) via Serial Monitor. Each role lights up the
 *  display wired to that board and mirrors all traffic / jam events:
 *      SENDER   -> TFT  (ST7735 1.8")
 *      RECEIVER -> I2C LCD 16x2 (PCF8574)
 *      JAMMER   -> OLED (SSD1306 128x64)
 *  (Change the mapping in displayForRole() if your screens differ.)
 *
 *  Wiring (ESP32)
 *  --------------
 *  NRF24L01 (VSPI):  CE->4  CSN->5  SCK->18  MOSI->23  MISO->19  VCC->3V3
 *  TFT ST7735 (VSPI, shared): SCK->18 SDA(MOSI)->23 CS->15 DC(A0)->26
 *                             RESET->27  LED->3V3  VCC->3V3
 *  I2C LCD 16x2 (PCF8574):    SDA->21  SCL->22  VCC->5V
 *  OLED SSD1306:              SDA->21  SCL->22  VCC->3V3
 *  (LCD and OLED share the I2C pins but live on different boards, so no
 *   clash. NRF + TFT share SPI on separate CS pins. Install libs: RF24,
 *   Adafruit_GFX, Adafruit_ST7735, LiquidCrystal_I2C, Adafruit_SSD1306.)
 *
 *  ----------------------------------------------------------
 *  ANTI-JAM LIFECYCLE  (sender & receiver run it together)
 *  ----------------------------------------------------------
 *  1. CHAT          Normal half-duplex chat on COMM_CHANNEL.
 *                   Every loop we also watch the channel.
 *
 *  2. DETECT        The jammer writes to the SAME pipe address the
 *                   receiver listens on, so when it floods, this node
 *                   is buried in garbage (non-text) packets. We count
 *                   that flood. The instant it spikes we start
 *                   BUFFERING anything you type (so nothing is lost)
 *                   and print live ALERTs — this is the visible
 *                   "we are being jammed" phase.
 *
 *  3. CONFIRM       If the flood stays up for JAM_CONFIRM_MS (~10 s)
 *                   we ASSUME the channel is jammed and trigger
 *                   anti-jam. (A short burst self-clears = false alarm,
 *                   buffered messages are then sent normally.)
 *
 *  4. HOP           Both nodes walk the SAME ordered backup-channel
 *                   list. SENDER sweeps fast (PROBE each channel);
 *                   RECEIVER parks slow (listens). The sweeper meets
 *                   the parker on the first clean channel and they
 *                   lock it with PROBE -> ACK -> CONFIRM. They keep
 *                   hopping until that handshake succeeds.
 *
 *  5. RETRANSMIT    On the clean channel, sender flushes its buffer,
 *                   then receiver flushes its buffer. Nothing typed
 *                   during the jam is lost.
 *
 *  6. RESUME        Half-duplex chat continues on the new channel,
 *                   with detection still live (re-jam -> hop again).
 *
 *  Why writes work at all: auto-ACK is OFF, so radio.write() succeeds
 *  the moment a packet leaves the radio (a half-duplex peer is rarely
 *  listening at the exact send instant, which made auto-ACK report
 *  false failures). We send control packets multiple times for
 *  robustness instead.
 * ============================================================
 */

#include <SPI.h>
#include <RF24.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_SSD1306.h>

// ─── Hardware pins ───────────────────────────────────────────
RF24 radio(4, 5);  // NRF24:  CE=4, CSN=5  (shares VSPI 18/19/23)

// ─── TFT (ST7735) — SENDER's display ────────────────────────
#define TFT_CS   15
#define TFT_DC   26   // labelled A0 / DC on the board
#define TFT_RST  27
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);

// ─── I2C LCD 16x2 — RECEIVER's display (addr auto-detected) ──
LiquidCrystal_I2C *lcd = nullptr;

// ─── OLED SSD1306 128x64 — JAMMER's display ─────────────────
#define OLED_W 128
#define OLED_H 64
Adafruit_SSD1306 oled(OLED_W, OLED_H, &Wire, -1);

// ─── Jammer pushbutton (active-low, internal pull-up) ───────
#define JAM_BTN_PIN 33   // button wired between GPIO33 and GND

// ─── Pipe addresses ─────────────────────────────────────────
const byte pipeS2R[6] = "NODE1";   // Sender   → Receiver
const byte pipeR2S[6] = "NODE2";   // Receiver → Sender

// ─── Protocol constants ─────────────────────────────────────
const uint8_t PAYLOAD_SIZE = 32;
const uint8_t COMM_CHANNEL  = 76;  // primary channel (both nodes)

// Ordered backup channels for hopping. MUST be identical on both
// nodes and MUST NOT include COMM_CHANNEL (the jammed one).
const uint8_t hopList[]  = { 30, 45, 60, 100, 110 };
const uint8_t HOP_LEN    = sizeof(hopList) / sizeof(hopList[0]);

// ─── Jam-detection / anti-jam tuning ────────────────────────
const int           JAM_SUSPECT_SCORE = 30;     // noise score that raises alarm
const int           JAM_CLEAR_SCORE    = 8;     // below this = channel clear
const int           JAM_NOISE_GAIN     = 4;     // score added per noise packet
const int           JAM_NOISE_CAP      = 400;   // score ceiling
const unsigned long JAM_CONFIRM_MS     = 10000; // sustained time -> "jammed"
const unsigned long JAM_DECAY_MS       = 40;    // score decays every this many ms
const int           JAM_DECAY_STEP     = 6;     // score lost per decay tick

// Keep HOP_PARK_MS >= HOP_SWEEP_MS * HOP_LEN so the sweeping sender visits
// every channel within one receiver park window (250 * 5 = 1250 <= 1500).
const unsigned long HOP_SWEEP_MS = 250;  // sender: dwell per channel while probing
const unsigned long HOP_PARK_MS  = 1500; // receiver: dwell per channel while scanning

// ─── Outbound buffer (messages held during a jam) ───────────
const int BUF_MAX = 10;
String  outBuffer[BUF_MAX];
int     outCount = 0;
bool    buffering = false;

// ─── Roles ──────────────────────────────────────────────────
enum Role { ROLE_NONE, ROLE_SENDER, ROLE_RECEIVER, ROLE_JAMMER };
Role myRole = ROLE_NONE;

// ─── Display (chosen automatically from the role) ───────────
enum DisplayType { DISP_NONE, DISP_TFT, DISP_LCD, DISP_OLED };
DisplayType displayType = DISP_NONE;

// UI state cache so any redraw can rebuild header/banner
String   uiRoleStr = "NODE";
int      uiCh      = COMM_CHANNEL;
String   uiLabel   = "BOOT";   // current state-banner text
uint16_t uiColor   = 0xFFFF;   // current state-banner colour (TFT/highlight)

// Scrolling log buffer (shared by TFT and OLED)
#define UI_LOG_LINES 9
String   uiLog_[UI_LOG_LINES];
uint16_t uiLogColor[UI_LOG_LINES];
int      uiLogCount = 0;

// ─── Runtime state ──────────────────────────────────────────
bool          connectionEstablished = false;
uint8_t       currentChannel = COMM_CHANNEL;

// jam detector
int           noiseScore     = 0;
unsigned long lastDecay      = 0;
bool          suspect        = false;
unsigned long suspectStart   = 0;
unsigned long lastAlert      = 0;
long          noiseSinceSuspect = 0;

// jammer
bool          jamming      = false;
uint8_t       jamChannel   = COMM_CHANNEL;
unsigned long lastJamMillis = 0;
unsigned long jamBursts    = 0;
char          noisePayload[PAYLOAD_SIZE];

// jammer pushbutton (debounce + single/double-press detection)
const unsigned long BTN_DEBOUNCE_MS = 40;    // ignore bounces faster than this
const unsigned long BTN_DOUBLE_MS   = 350;   // gap that separates 1 vs 2 presses
int           btnLastReading = HIGH;
int           btnStable      = HIGH;
unsigned long btnLastChange  = 0;
int           clickCount     = 0;
unsigned long lastClickTime  = 0;

// ─── Forward declarations ───────────────────────────────────
DisplayType displayForRole(Role r);
void uiInit();
void uiBoot(const char *role);
void uiStatus(const char *label, uint16_t color, int ch);
void uiLog(const char *prefix, const String &text, uint16_t color);
void lcdPrintLine(uint8_t row, const String &s);
void oledRedraw();
void radioCommonInit();
void setupSender();
void setupReceiver();
void setupJammer();
void loopNode();
void loopJammer();
void printBanner();
void printConnected();
bool isTextPacket(const char *buf);
bool isProtocol(const String &s);
void updateJamDecay();
void handleIncomingChat();
void handleOutgoingChat();
void sendPacket(const char *msg);
void flushBufferNormally();
void runAntiJam();
void runHopSender();
void runHopReceiver();
void runRetransmit();
void sendRetxBatch();
void receiveRetxBatch();
void jamStart();
void jamStop();
void pollJamButton();

// =============================================================
//  SETUP
// =============================================================
void setup()
{
  Serial.begin(115200);
  delay(500);

  if (!radio.begin())
  {
    Serial.println(F("\n[ERROR] NRF24L01 module NOT detected!"));
    Serial.println(F("        Check wiring and power (10uF cap across VCC-GND)."));
    while (1) yield();
  }

  radioCommonInit();
  randomSeed(micros());

  // ── Pick the display ──
  Serial.println(F("\n========================================="));
  Serial.println(F("   TACTICAL MESH NODE  —  Display Setup"));
  Serial.println(F("-----------------------------------------"));
  Serial.println(F("   1 -> TFT (ST7735)"));
  Serial.println(F("   2 -> LCD (I2C 16x2)"));
  Serial.println(F("   3 -> OLED (SSD1306)"));
  Serial.println(F("   4 -> NONE"));
  Serial.println(F("========================================="));
  Serial.print(F("Select display: "));

  bool displayPicked = false;
  while (!displayPicked)
  {
    if (Serial.available())
    {
      String input = Serial.readStringUntil('\n');
      input.trim();
      if      (input == "1") { displayType = DISP_TFT; displayPicked = true; }
      else if (input == "2") { displayType = DISP_LCD; displayPicked = true; }
      else if (input == "3") { displayType = DISP_OLED; displayPicked = true; }
      else if (input == "4") { displayType = DISP_NONE; displayPicked = true; }
      else Serial.println(F("Invalid choice. Enter 1, 2, 3, or 4."));
    }
    yield();
  }

  // ── Pick the role ──
  printBanner();
  // Flush any lingering serial data to prevent immediate/duplicate triggers
  while (Serial.available()) {
    Serial.read();
  }
  delay(10); // Short delay to let buffer clear

  while (myRole == ROLE_NONE)
  {
    if (Serial.available())
    {
      String input = Serial.readStringUntil('\n');
      input.trim();
      if      (input == "1") myRole = ROLE_SENDER;
      else if (input == "2") myRole = ROLE_RECEIVER;
      else if (input == "3") myRole = ROLE_JAMMER;
      else Serial.println(F("Invalid choice. Enter 1, 2, or 3."));
    }
    yield();
  }

  // ── Bring up the display ──
  const char *rname = (myRole == ROLE_SENDER)   ? "SENDER"
                    : (myRole == ROLE_RECEIVER) ? "RECEIVER"
                                                : "JAMMER";
  uiInit();
  uiBoot(rname);

  switch (myRole)
  {
    case ROLE_SENDER:   setupSender();   break;
    case ROLE_RECEIVER: setupReceiver(); break;
    case ROLE_JAMMER:   setupJammer();   break;
    default: break;
  }

  lastDecay = millis();
}

// =============================================================
//  LOOP
// =============================================================
void loop()
{
  switch (myRole)
  {
    case ROLE_SENDER:
    case ROLE_RECEIVER: loopNode();   break;
    case ROLE_JAMMER:   loopJammer(); break;
    default: break;
  }
}

// =============================================================
//  COMMON RADIO CONFIG  (identical on every node)
// =============================================================
void radioCommonInit()
{
  radio.setPALevel(RF24_PA_HIGH);     // PA_MAX can brown-out cheap modules
  radio.setDataRate(RF24_250KBPS);
  radio.setChannel(COMM_CHANNEL);
  radio.setPayloadSize(PAYLOAD_SIZE);
  radio.setCRCLength(RF24_CRC_16);
  radio.setAutoAck(false);            // half-duplex chat needs this OFF
  radio.setRetries(0, 0);
}

// =============================================================
//  BANNERS
// =============================================================
void printBanner()
{
  Serial.println(F("\n========================================="));
  Serial.println(F("   TACTICAL MESH NODE  —  Role Select"));
  Serial.println(F("-----------------------------------------"));
  Serial.println(F("   1 -> SENDER"));
  Serial.println(F("   2 -> RECEIVER"));
  Serial.println(F("   3 -> JAMMER"));
  Serial.println(F("========================================="));
  Serial.print(F("Select role: "));
}

void printConnected()
{
  Serial.println(F("\n========================================="));
  Serial.println(F("   CONNECTION ESTABLISHED!"));
  Serial.print  (F("   Channel: ")); Serial.println(currentChannel);
  Serial.println(F("========================================="));
  Serial.println(F("[CHAT] Type a message + Enter to send."));
  Serial.println(F("       Anti-jam is armed and monitoring.\n"));

  uiStatus("ONLINE", ST77XX_GREEN, currentChannel);
  uiLog("**", "Link established", ST77XX_GREEN);
}

// =============================================================
//  DISPLAY LAYER  (TFT / I2C LCD / OLED / none)
//  Two primitives drive everything:
//    uiStatus(label,color,ch) -> state banner + role + channel
//    uiLog(prefix,text,color)  -> scrolling message / event feed
//  Colour args are TFT (ST77XX_*) values; the LCD ignores them and
//  the OLED uses ST77XX_RED to invert/highlight an alert.
// =============================================================

// Which physical screen is on each role's board. Edit here if your
// TFT / LCD happen to be on different nodes than sender / receiver.
DisplayType displayForRole(Role r)
{
  switch (r)
  {
    case ROLE_SENDER:   return DISP_TFT;
    case ROLE_RECEIVER: return DISP_LCD;
    case ROLE_JAMMER:   return DISP_OLED;
    default:            return DISP_NONE;
  }
}

void uiInit()
{
  if (displayType == DISP_TFT)
  {
    tft.initR(INITR_BLACKTAB);   // try GREENTAB/REDTAB if colours/offset look off
    tft.setRotation(0);
    tft.fillScreen(ST77XX_BLACK);
    tft.setTextWrap(false);
    tft.setTextSize(1);
    tft.setTextColor(ST77XX_WHITE);
    tft.setCursor(6, 60); tft.print(F("TACTICAL MESH"));
    tft.setCursor(6, 74); tft.print(F("booting..."));
  }
  else if (displayType == DISP_LCD)
  {
    Wire.begin(21, 22);
    uint8_t addr = 0;
    Wire.beginTransmission(0x27); if (Wire.endTransmission() == 0) addr = 0x27;
    if (!addr) { Wire.beginTransmission(0x3F); if (Wire.endTransmission() == 0) addr = 0x3F; }
    if (!addr) addr = 0x27;
    Serial.print(F("[LCD] I2C address 0x")); Serial.println(addr, HEX);
    lcd = new LiquidCrystal_I2C(addr, 16, 2);
    lcd->init();
    lcd->backlight();
    lcd->clear();
    lcd->setCursor(0, 0); lcd->print(F("TACTICAL MESH"));
    lcd->setCursor(0, 1); lcd->print(F("booting..."));
  }
  else if (displayType == DISP_OLED)
  {
    Wire.begin(21, 22);
    uint8_t addr = 0x3C;
    Wire.beginTransmission(0x3C);
    if (Wire.endTransmission() != 0)
    {
      Wire.beginTransmission(0x3D);
      if (Wire.endTransmission() == 0) addr = 0x3D;
    }
    if (!oled.begin(SSD1306_SWITCHCAPVCC, addr))
      Serial.println(F("[OLED] SSD1306 init failed — check address/wiring."));
    Serial.print(F("[OLED] I2C address 0x")); Serial.println(addr, HEX);
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    oled.setTextSize(1);
    oled.setCursor(0, 0);  oled.print(F("TACTICAL MESH"));
    oled.setCursor(0, 12); oled.print(F("booting..."));
    oled.display();
  }
}

void uiBoot(const char *role)
{
  uiRoleStr = String(role);
  uiLogCount = 0;
  if (displayType == DISP_TFT) tft.fillScreen(ST77XX_BLACK);
  else if (displayType == DISP_LCD && lcd) lcd->clear();
  uiStatus("BOOT", ST77XX_CYAN, currentChannel);
}

// Pad/truncate to exactly 16 chars and write one LCD row.
void lcdPrintLine(uint8_t row, const String &s)
{
  if (displayType != DISP_LCD || !lcd) return;
  String t = s;
  if (t.length() > 16) t = t.substring(0, 16);
  while (t.length() < 16) t += ' ';
  lcd->setCursor(0, row);
  lcd->print(t);
}

// Rebuild the whole OLED frame (header + state banner + log).
void oledRedraw()
{
  oled.clearDisplay();

  // header: role (left) + channel (right)
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_WHITE);
  oled.setCursor(0, 0);  oled.print(uiRoleStr);
  oled.setCursor(86, 0); oled.print(F("CH:")); oled.print(uiCh);
  oled.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  // state banner (size 2). Red states get an inverted highlight bar.
  oled.setTextSize(2);
  if (uiColor == ST77XX_RED)
  {
    oled.fillRect(0, 13, 128, 18, SSD1306_WHITE);
    oled.setTextColor(SSD1306_BLACK);
  }
  else
  {
    oled.setTextColor(SSD1306_WHITE);
  }
  oled.setCursor(2, 15);
  oled.print(uiLabel);

  // log: last few lines
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_WHITE);
  int shown = uiLogCount < 4 ? uiLogCount : 4;
  int start = uiLogCount - shown;
  for (int i = 0; i < shown; i++)
  {
    String s = uiLog_[start + i];
    if (s.length() > 21) s = s.substring(0, 21);
    oled.setCursor(0, 32 + i * 8);
    oled.print(s);
  }
  oled.display();
}

// Top status banner.
void uiStatus(const char *label, uint16_t color, int ch)
{
  if (ch >= 0) uiCh = ch;
  uiLabel = String(label);
  uiColor = color;

  if (displayType == DISP_TFT)
  {
    tft.fillRect(0, 0, 128, 14, ST77XX_BLACK);
    tft.setTextSize(1);
    tft.setTextColor(ST77XX_WHITE);
    tft.setCursor(2, 3);  tft.print(uiRoleStr);
    tft.setCursor(84, 3); tft.print(F("CH:")); tft.print(uiCh);
    tft.fillRect(0, 16, 128, 24, color);
    tft.setTextSize(2);
    tft.setTextColor(ST77XX_BLACK);
    tft.setCursor(4, 20);
    tft.print(label);
  }
  else if (displayType == DISP_LCD)
  {
    String right = "C" + String(uiCh);
    String left  = String(label);
    int room = 16 - (int)right.length() - 1;
    if ((int)left.length() > room) left = left.substring(0, room);
    String line = left;
    while ((int)line.length() < 16 - (int)right.length()) line += ' ';
    line += right;
    lcdPrintLine(0, line);
  }
  else if (displayType == DISP_OLED)
  {
    oledRedraw();
  }
}

// Append a line to the message / event feed.
void uiLog(const char *prefix, const String &text, uint16_t color)
{
  String line = String(prefix) + " " + text;

  if (uiLogCount < UI_LOG_LINES)
  {
    uiLog_[uiLogCount] = line;
    uiLogColor[uiLogCount] = color;
    uiLogCount++;
  }
  else
  {
    for (int i = 1; i < UI_LOG_LINES; i++)
    {
      uiLog_[i - 1] = uiLog_[i];
      uiLogColor[i - 1] = uiLogColor[i];
    }
    uiLog_[UI_LOG_LINES - 1] = line;
    uiLogColor[UI_LOG_LINES - 1] = color;
  }

  if (displayType == DISP_TFT)
  {
    tft.fillRect(0, 44, 128, 116, ST77XX_BLACK);
    tft.setTextSize(1);
    for (int i = 0; i < uiLogCount; i++)
    {
      String s = uiLog_[i];
      if (s.length() > 21) s = s.substring(0, 21);
      tft.setTextColor(uiLogColor[i]);
      tft.setCursor(2, 46 + i * 12);
      tft.print(s);
    }
  }
  else if (displayType == DISP_LCD)
  {
    lcdPrintLine(1, line);
  }
  else if (displayType == DISP_OLED)
  {
    oledRedraw();
  }
}

// =============================================================
//  PACKET CLASSIFIERS
// =============================================================
// A "text" packet is a NUL-terminated run of printable ASCII.
// Jammer noise (random bytes) almost always trips a non-printable
// byte, so it is rejected here.
bool isTextPacket(const char *buf)
{
  if (buf[0] == '\0') return false;
  for (int i = 0; i < PAYLOAD_SIZE; i++)
  {
    char c = buf[i];
    if (c == '\0') return true;          // clean terminator -> text
    if (c < 32 || c > 126) return false; // non-printable -> noise
  }
  return true;                           // 32 printable chars, no NUL
}

bool isProtocol(const String &s)
{
  return s == "ACK_REQUEST"  || s == "ACK_CONFIRM" ||
         s == "HOP_PROBE"    || s == "HOP_ACK"     || s == "HOP_CONFIRM" ||
         s == "RETX_BEGIN"   || s == "RETX_END";
}

// =============================================================
//  ██  SENDER SETUP  ██
// =============================================================
void setupSender()
{
  Serial.println(F("\n-- SENDER MODE --"));
  Serial.println(F("[INFO] Connecting to receiver..."));
  uiStatus("CONNECT", ST77XX_YELLOW, currentChannel);
  uiLog("..", "Handshaking", ST77XX_YELLOW);

  radio.openWritingPipe(pipeS2R);
  radio.openReadingPipe(1, pipeR2S);

  char request[PAYLOAD_SIZE] = "ACK_REQUEST";
  char reply[PAYLOAD_SIZE]   = "";
  bool acked = false;

  while (!acked)
  {
    Serial.println(F("[HANDSHAKE] Sending ACK_REQUEST..."));
    radio.stopListening();
    radio.write(&request, PAYLOAD_SIZE);

    radio.startListening();
    unsigned long start = millis();
    while (millis() - start < 300)
    {
      if (radio.available())
      {
        radio.read(&reply, PAYLOAD_SIZE);
        if (String(reply) == "ACK_CONFIRM") { acked = true; break; }
      }
      yield();
    }
    radio.stopListening();

    if (!acked)
    {
      Serial.println(F("[HANDSHAKE] No reply. Retrying..."));
      delay(500);
    }
  }

  connectionEstablished = true;
  currentChannel = COMM_CHANNEL;
  radio.startListening();
  printConnected();
}

// =============================================================
//  ██  RECEIVER SETUP  ██
// =============================================================
void setupReceiver()
{
  Serial.println(F("\n-- RECEIVER MODE --"));
  Serial.println(F("[INFO] Waiting for sender..."));
  uiStatus("WAITING", ST77XX_YELLOW, currentChannel);
  uiLog("..", "Awaiting sender", ST77XX_YELLOW);

  radio.openWritingPipe(pipeR2S);
  radio.openReadingPipe(1, pipeS2R);
  radio.startListening();

  char incoming[PAYLOAD_SIZE] = "";
  char confirm[PAYLOAD_SIZE]  = "ACK_CONFIRM";
  bool acked = false;

  while (!acked)
  {
    if (radio.available())
    {
      radio.read(&incoming, PAYLOAD_SIZE);
      if (String(incoming) == "ACK_REQUEST")
      {
        Serial.println(F("[HANDSHAKE] ACK_REQUEST received."));
        radio.stopListening();
        for (int i = 0; i < 5; i++) { radio.write(&confirm, PAYLOAD_SIZE); delay(5); }
        radio.startListening();
        acked = true;
      }
    }
    yield();
  }

  connectionEstablished = true;
  currentChannel = COMM_CHANNEL;
  printConnected();
}

// =============================================================
//  ██  SHARED NODE LOOP (sender + receiver)  ██
// =============================================================
void loopNode()
{
  if (!connectionEstablished) return;

  updateJamDecay();
  handleIncomingChat();   // reads radio, classifies, feeds jam detector
  handleOutgoingChat();   // reads Serial, sends or buffers

  // ── Jam state machine ──
  if (suspect)
  {
    // Periodic live alert (the visible "being jammed" phase)
    if (millis() - lastAlert > 1000)
    {
      Serial.print(F("[ALERT] Channel "));
      Serial.print(currentChannel);
      Serial.print(F(" flooded — "));
      Serial.print(noiseSinceSuspect);
      Serial.print(F(" noise packets. Buffering ("));
      Serial.print((millis() - suspectStart) / 1000);
      Serial.println(F("s/10s)..."));
      lastAlert = millis();

      String lab = "JAM " + String((millis() - suspectStart) / 1000) + "s";
      uiStatus(lab.c_str(), ST77XX_RED, currentChannel);
    }

    if (noiseScore < JAM_CLEAR_SCORE)
    {
      // Burst ended before 10s -> not real jamming
      Serial.println(F("[INFO] Interference cleared (false alarm)."));
      flushBufferNormally();
      suspect = false;
      buffering = false;
      uiStatus("ONLINE", ST77XX_GREEN, currentChannel);
      uiLog("**", "False alarm", ST77XX_GREEN);
    }
    else if (millis() - suspectStart >= JAM_CONFIRM_MS)
    {
      Serial.println(F("\n*****************************************"));
      Serial.print  (F("[CRITICAL] Channel ")); Serial.print(currentChannel);
      Serial.println(F(" jammed (10s sustained)."));
      Serial.println(F("[ANTI-JAM] Initiating frequency-hopping..."));
      Serial.println(F("*****************************************"));
      uiStatus("JAMMED!", ST77XX_RED, currentChannel);
      uiLog("!!", "Jammed - hopping", ST77XX_RED);
      runAntiJam();
    }
  }
}

// ── Jam score decays over time so brief bursts don't accumulate ──
void updateJamDecay()
{
  unsigned long now = millis();
  if (now - lastDecay >= JAM_DECAY_MS)
  {
    int ticks = (now - lastDecay) / JAM_DECAY_MS;
    noiseScore -= ticks * JAM_DECAY_STEP;
    if (noiseScore < 0) noiseScore = 0;
    lastDecay += (unsigned long)ticks * JAM_DECAY_MS;
  }
}

// ── Drain the RX FIFO: print text, count noise, raise alarm ──
void handleIncomingChat()
{
  while (radio.available())
  {
    char incoming[PAYLOAD_SIZE] = "";
    radio.read(&incoming, PAYLOAD_SIZE);

    if (!isTextPacket(incoming))
    {
      // Jammer garbage -> feed detector
      noiseScore += JAM_NOISE_GAIN;
      if (noiseScore > JAM_NOISE_CAP) noiseScore = JAM_NOISE_CAP;
      if (suspect) noiseSinceSuspect++;
    }
    else
    {
      String msg = String(incoming);

      // Sender may still be retrying the initial handshake
      if (msg == "ACK_REQUEST")
      {
        char confirm[PAYLOAD_SIZE] = "ACK_CONFIRM";
        radio.stopListening();
        radio.write(&confirm, PAYLOAD_SIZE);
        radio.startListening();
      }
      else if (!isProtocol(msg))
      {
        Serial.print(F("[RECV] << ")); Serial.println(msg);
        uiLog("<<", msg, ST77XX_WHITE);
      }
    }
  }

  // Raise the alarm the moment the flood spikes
  if (!suspect && noiseScore >= JAM_SUSPECT_SCORE)
  {
    suspect = true;
    buffering = true;
    suspectStart = millis();
    lastAlert = 0;
    noiseSinceSuspect = 0;
    Serial.print(F("\n[ALERT] Interference detected on channel "));
    Serial.print(currentChannel);
    Serial.println(F(" — buffering outbound traffic, assessing for 10s..."));
    uiStatus("JAMMING!", ST77XX_RED, currentChannel);
    uiLog("!!", "Interference!", ST77XX_RED);
  }
}

// ── Read a typed line: send it, or buffer it if a jam is suspected ──
void handleOutgoingChat()
{
  if (!Serial.available()) return;

  String msg = Serial.readStringUntil('\n');
  msg.trim();
  if (msg.length() == 0) return;
  if (msg.length() >= PAYLOAD_SIZE) msg = msg.substring(0, PAYLOAD_SIZE - 1);

  if (buffering)
  {
    if (outCount < BUF_MAX)
    {
      outBuffer[outCount++] = msg;
      Serial.print(F("[BUFFERED] (held for retransmit) >> "));
      Serial.println(msg);
      uiLog("[]", msg, ST77XX_YELLOW);
    }
    else
    {
      Serial.println(F("[WARN] Buffer full — message dropped."));
    }
  }
  else
  {
    char payload[PAYLOAD_SIZE] = "";
    msg.toCharArray(payload, PAYLOAD_SIZE);
    sendPacket(payload);
    Serial.print(F("[SENT] >> ")); Serial.println(msg);
    uiLog(">>", msg, ST77XX_CYAN);
  }
}

// ── Transmit one packet, then return to listening ──
void sendPacket(const char *msg)
{
  radio.stopListening();
  radio.write(msg, PAYLOAD_SIZE);
  radio.startListening();
}

// ── False alarm: send everything we held back, normally ──
void flushBufferNormally()
{
  for (int i = 0; i < outCount; i++)
  {
    char payload[PAYLOAD_SIZE] = "";
    outBuffer[i].toCharArray(payload, PAYLOAD_SIZE);
    sendPacket(payload);
    Serial.print(F("[SENT] >> ")); Serial.println(outBuffer[i]);
    delay(40);
  }
  outCount = 0;
}

// =============================================================
//  ██  ANTI-JAM SEQUENCE  ██
// =============================================================
void runAntiJam()
{
  if (myRole == ROLE_SENDER) runHopSender();
  else                       runHopReceiver();

  Serial.print(F("[SECURE] Clean channel acquired: "));
  Serial.println(currentChannel);
  Serial.println(F("[ANTI-JAM] Both nodes synchronized. Channel is SAFE."));
  uiStatus("SECURE", ST77XX_GREEN, currentChannel);
  uiLog("**", "Ch " + String(currentChannel) + " secure", ST77XX_GREEN);

  runRetransmit();

  // Reset detector for the new (clean) channel
  outCount = 0;
  buffering = false;
  suspect = false;
  noiseScore = 0;
  noiseSinceSuspect = 0;
  lastDecay = millis();

  Serial.println(F("[LINK] Half-duplex comms resumed.\n"));
  uiStatus("ONLINE", ST77XX_GREEN, currentChannel);
  uiLog("**", "Comms resumed", ST77XX_GREEN);
}

// ── SENDER: sweep the hop list, probing each channel until the
//    receiver answers, then flood HOP_CONFIRM so it settles. ──
void runHopSender()
{
  bool locked = false;
  int idx = 0;
  uint8_t C = hopList[0];
  uiLog("~~", "Hopping...", ST77XX_YELLOW);

  while (!locked)
  {
    C = hopList[idx];
    radio.setChannel(C);

    Serial.print(F("[HOP] Probing channel ")); Serial.print(C); Serial.println(F("..."));
    { String l = "HOP>" + String(C); uiStatus(l.c_str(), ST77XX_YELLOW, C); }

    // Two probes per visit for a little margin
    radio.stopListening();
    char probe[PAYLOAD_SIZE] = "HOP_PROBE";
    radio.write(&probe, PAYLOAD_SIZE);
    radio.startListening();

    unsigned long t = millis();
    bool sentSecond = false;
    while (millis() - t < HOP_SWEEP_MS)
    {
      if (!sentSecond && (millis() - t) > HOP_SWEEP_MS / 2)   // second probe mid-dwell
      {
        radio.stopListening();
        radio.write(&probe, PAYLOAD_SIZE);
        radio.startListening();
        sentSecond = true;
      }
      if (radio.available())
      {
        char b[PAYLOAD_SIZE] = "";
        radio.read(&b, PAYLOAD_SIZE);
        if (String(b) == "HOP_ACK") { locked = true; break; }
      }
      yield();
    }

    if (!locked) idx = (idx + 1) % HOP_LEN;
  }

  // Receiver answered on C — lock it in and flood confirms so a single
  // dropped packet can't leave the receiver hanging.
  currentChannel = C;
  radio.setChannel(C);
  radio.stopListening();
  char confirm[PAYLOAD_SIZE] = "HOP_CONFIRM";
  for (int k = 0; k < 12; k++) { radio.write(&confirm, PAYLOAD_SIZE); delay(5); }
  radio.startListening();
  delay(150);   // let the receiver get into its retransmit listen
}

// ── RECEIVER: scan for the sweeper, then COMMIT to that channel and
//    stay there — never hop away once a probe is heard. ──
void runHopReceiver()
{
  bool committed = false;
  int idx = 0;
  uint8_t C = hopList[0];
  uiLog("~~", "Scanning...", ST77XX_YELLOW);

  // Phase 1: find the channel the sender is probing on.
  while (!committed)
  {
    C = hopList[idx];
    radio.setChannel(C);
    radio.startListening();

    Serial.print(F("[HOP] Listening on channel ")); Serial.print(C); Serial.println(F("..."));
    { String l = "SCAN " + String(C); uiStatus(l.c_str(), ST77XX_YELLOW, C); }

    unsigned long park = millis();
    while (millis() - park < HOP_PARK_MS)
    {
      if (radio.available())
      {
        char b[PAYLOAD_SIZE] = "";
        radio.read(&b, PAYLOAD_SIZE);
        if (String(b) == "HOP_PROBE") { committed = true; break; }
      }
      yield();
    }

    if (!committed) idx = (idx + 1) % HOP_LEN;
  }

  // Phase 2: committed to C. Keep ACKing here until the sender confirms.
  // We do NOT leave this channel anymore — that's what kept the two nodes
  // from ever syncing before.
  currentChannel = C;
  radio.setChannel(C);
  Serial.print(F("[HOP] Sender found on channel ")); Serial.print(C);
  Serial.println(F(" — locking on, awaiting confirm..."));
  { String l = "LOCK " + String(C); uiStatus(l.c_str(), ST77XX_YELLOW, C); }

  bool confirmed = false;
  while (!confirmed)
  {
    radio.stopListening();
    char ack[PAYLOAD_SIZE] = "HOP_ACK";
    for (int k = 0; k < 4; k++) { radio.write(&ack, PAYLOAD_SIZE); delay(4); }
    radio.startListening();

    unsigned long t = millis();
    while (millis() - t < 150)
    {
      if (radio.available())
      {
        char b[PAYLOAD_SIZE] = "";
        radio.read(&b, PAYLOAD_SIZE);
        String s = String(b);
        // CONFIRM is the signal; RETX_BEGIN means the sender already
        // moved on (our confirm was lost) — treat it as confirmation too.
        if (s == "HOP_CONFIRM" || s == "RETX_BEGIN") { confirmed = true; break; }
      }
      yield();
    }
  }
}

// =============================================================
//  ██  RETRANSMISSION  ██
//  Sequenced so the two batches never collide: sender first,
//  then receiver. Both nodes are already on the clean channel.
// =============================================================
void runRetransmit()
{
  Serial.println(F("[RETX] Retransmission phase started."));
  uiStatus("RETX", ST77XX_CYAN, currentChannel);
  uiLog("**", "Retransmitting", ST77XX_CYAN);
  delay(150);

  if (myRole == ROLE_SENDER)
  {
    sendRetxBatch();
    receiveRetxBatch();
  }
  else
  {
    receiveRetxBatch();
    sendRetxBatch();
  }

  Serial.println(F("[RETX] Retransmission phase complete."));
}

void sendRetxBatch()
{
  radio.stopListening();

  char begin[PAYLOAD_SIZE] = "RETX_BEGIN";
  for (int k = 0; k < 3; k++) { radio.write(&begin, PAYLOAD_SIZE); delay(5); }

  if (outCount == 0)
  {
    Serial.println(F("[RETX] No buffered messages to resend."));
  }
  else
  {
    Serial.print(F("[RETX] Re-sending ")); Serial.print(outCount);
    Serial.println(F(" buffered message(s)..."));
    for (int i = 0; i < outCount; i++)
    {
      char payload[PAYLOAD_SIZE] = "";
      outBuffer[i].toCharArray(payload, PAYLOAD_SIZE);
      radio.write(&payload, PAYLOAD_SIZE);
      Serial.print(F("[RETX] >> ")); Serial.println(outBuffer[i]);
      uiLog("R>", outBuffer[i], ST77XX_CYAN);
      delay(60);
    }
  }

  char end[PAYLOAD_SIZE] = "RETX_END";
  for (int k = 0; k < 3; k++) { radio.write(&end, PAYLOAD_SIZE); delay(5); }

  radio.startListening();
}

void receiveRetxBatch()
{
  radio.startListening();

  bool inBatch = false;
  bool done    = false;
  int  got     = 0;
  unsigned long t = millis();

  while (millis() - t < 4000 && !done)
  {
    if (radio.available())
    {
      char b[PAYLOAD_SIZE] = "";
      radio.read(&b, PAYLOAD_SIZE);
      String s = String(b);

      if (s == "RETX_BEGIN")
      {
        if (!inBatch)
        {
          inBatch = true;
          Serial.println(F("[RETX] Incoming retransmission from peer..."));
        }
        t = millis();
      }
      else if (s == "RETX_END")
      {
        if (inBatch) done = true;
      }
      else if (inBatch && isTextPacket(b) && !isProtocol(s))
      {
        got++;
        Serial.print(F("[RETX] << ")); Serial.println(s);
        uiLog("R<", s, ST77XX_CYAN);
        t = millis();
      }
    }
    yield();
  }

  if (inBatch && got == 0)
    Serial.println(F("[RETX] Peer had no buffered messages."));
}

// =============================================================
//  ██  JAMMER  ██
// =============================================================
void setupJammer()
{
  Serial.println(F("\n-- JAMMER MODE --"));
  Serial.println(F("[INFO] Enter target channel (0-125):"));

  while (true)
  {
    if (Serial.available())
    {
      String input = Serial.readStringUntil('\n');
      input.trim();
      int ch = input.toInt();
      if (ch >= 0 && ch <= 125) { jamChannel = (uint8_t)ch; break; }
      Serial.println(F("[ERROR] Invalid channel. Enter 0-125:"));
    }
    yield();
  }

  radio.setChannel(jamChannel);
  radio.stopListening();
  // We flood BOTH pipe addresses (set per-burst in the loop) so that the
  // sender (listens on NODE2) AND receiver (listens on NODE1) both get
  // buried in garbage and both detect the jam together.

  pinMode(JAM_BTN_PIN, INPUT_PULLUP);   // pushbutton: 1 press = jam, 2 = stop

  Serial.println(F("========================================="));
  Serial.print  (F("   Targeting channel: ")); Serial.println(jamChannel);
  Serial.println(F("   /jam     -> Start jamming   (or 1 button press)"));
  Serial.println(F("   /antijam -> Stop  jamming   (or 2 button presses)"));
  Serial.println(F("=========================================\n"));

  uiStatus("READY", ST77XX_GREEN, jamChannel);
  uiLog("**", "Target ch " + String(jamChannel), ST77XX_WHITE);
}

// Start / stop are factored out so the Serial commands AND the
// pushbutton drive exactly the same behaviour.
void jamStart()
{
  if (!jamming) jamBursts = 0;
  jamming = true;
  Serial.println(F("[JAMMER] >>> JAMMING ACTIVE <<<"));
  uiStatus("JAMMING", ST77XX_RED, jamChannel);
  uiLog("!!", "Flooding ch " + String(jamChannel), ST77XX_RED);
}

void jamStop()
{
  jamming = false;
  Serial.println(F("[JAMMER] --- Jamming stopped ---"));
  uiStatus("IDLE", ST77XX_GREEN, jamChannel);
  uiLog("**", "Jamming stopped", ST77XX_GREEN);
}

// Debounced single/double-press detector for the jammer button.
//  1 press  -> jamStart()   2 presses -> jamStop()
void pollJamButton()
{
  unsigned long now = millis();
  int reading = digitalRead(JAM_BTN_PIN);

  // debounce: only accept a level that has been stable long enough
  if (reading != btnLastReading)
  {
    btnLastChange = now;
    btnLastReading = reading;
  }
  if (now - btnLastChange > BTN_DEBOUNCE_MS && reading != btnStable)
  {
    btnStable = reading;
    if (btnStable == LOW)        // active-low: a fresh press
    {
      clickCount++;
      lastClickTime = now;
    }
  }

  // once the double-press window closes, act on how many presses landed
  if (clickCount > 0 && (now - lastClickTime > BTN_DOUBLE_MS))
  {
    if (clickCount == 1) jamStart();
    else                 jamStop();   // 2+ presses
    clickCount = 0;
  }
}

void loopJammer()
{
  pollJamButton();

  if (Serial.available())
  {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if      (cmd == "/jam")     jamStart();
    else if (cmd == "/antijam") jamStop();
    else Serial.println(F("[JAMMER] Unknown command. Use /jam or /antijam"));
  }

  if (jamming)
  {
    for (int i = 0; i < PAYLOAD_SIZE; i++)
      noisePayload[i] = (char)random(0, 256);

    // Hit both directions so sender and receiver both detect the jam.
    radio.openWritingPipe(pipeS2R);
    radio.write(&noisePayload, PAYLOAD_SIZE);
    radio.openWritingPipe(pipeR2S);
    radio.write(&noisePayload, PAYLOAD_SIZE);
    jamBursts++;

    if (millis() - lastJamMillis > 2000)
    {
      Serial.print(F("[JAMMER] Flooding channel "));
      Serial.print(jamChannel);
      Serial.println(F(" ..."));
      lastJamMillis = millis();
      // Keep the OLED alive with a burst counter so it reads as "active"
      uiLog(">>", String(jamBursts) + " bursts sent", ST77XX_RED);
    }
  }
}