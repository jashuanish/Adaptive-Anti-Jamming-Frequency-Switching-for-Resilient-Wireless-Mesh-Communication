/*
 * ============================================================
 *  Generic NRF24L01 Node — Sender / Receiver / Jammer
 *  WITH Anti-Jamming, Channel Hopping & Message Buffering
 * ============================================================
 *  Upload the SAME sketch to every ESP8266/Arduino board.
 *  On boot the user picks a role via Serial Monitor.
 *
 *  Wiring (ESP8266):
 *    CE  -> GPIO 4
 *    CSN -> GPIO 5
 *    (SCK, MISO, MOSI on default SPI pins)
 *
 *  Anti-Jamming Protocol
 *  ---------------------
 *  SENDER detects jamming through write() failures over 10s.
 *  RECEIVER detects jamming through heartbeat timeout (12s).
 *  Both hop through the SAME 5 predefined channels until
 *  they find each other and re-establish communication.
 *  Buffered messages are retransmitted, then normal chat
 *  resumes in half-duplex mode.
 *
 *  Why heartbeat-based (not garbage-based):
 *  NRF24L01 picks up ambient RF noise that looks like
 *  "garbage" even with no jammer present. Heartbeat timeout
 *  is a reliable, false-positive-free detection method.
 * ============================================================
 */

#include <SPI.h>
#include <RF24.h>

// ─── Hardware pins ───────────────────────────────────────────
RF24 radio(4, 5);  // CE, CSN

// ─── Pipe addresses ─────────────────────────────────────────
const byte pipeS2R[6] = "PIPE1";   // Sender  -> Receiver
const byte pipeR2S[6] = "PIPE2";   // Receiver -> Sender

// ─── Roles ──────────────────────────────────────────────────
enum Role { ROLE_NONE, ROLE_SENDER, ROLE_RECEIVER, ROLE_JAMMER };
Role myRole = ROLE_NONE;

// ─── Communication state ────────────────────────────────────
bool connectionEstablished = false;

// ─── 5 predefined channels ──────────────────────────────────
// Both sender and receiver know this SAME list and hop
// through it in the SAME order, so they always meet.
const uint8_t NUM_CHANNELS = 5;
const uint8_t channelList[NUM_CHANNELS] = { 90, 100, 110, 75, 60 };
uint8_t currentChannelIndex = 0;  // index into channelList[]

// ─── Heartbeat (sender sends every 3s when idle) ────────────
const unsigned long HEARTBEAT_INTERVAL_MS = 3000;
unsigned long lastHeartbeatSent = 0;

// ─── Jamming detection timers ───────────────────────────────
const unsigned long SENDER_JAM_TIME_MS   = 10000;  // 10s of failures
const unsigned long RECEIVER_JAM_TIME_MS = 12000;  // 12s no valid packet

// Sender: tracks continuous failure window
bool          senderInFailWindow  = false;
unsigned long senderFailStartTime = 0;
unsigned long lastFailPrint       = 0;

// Receiver: tracks time since last valid packet
unsigned long lastValidPacketTime = 0;
bool          receiverJamWarned   = false;

// ─── Message buffer (circular, 16 slots) ────────────────────
const uint8_t MSG_BUF_SIZE = 16;
char msgBuffer[MSG_BUF_SIZE][32];
uint8_t bufHead  = 0;
uint8_t bufTail  = 0;
uint8_t bufCount = 0;

// ─── Jammer state ───────────────────────────────────────────
bool    jamming    = false;
uint8_t jamChannel = 90;
unsigned long lastJamMillis = 0;
char noisePayload[32];

// ─── Receiver half-duplex flag ──────────────────────────────
bool receiverCanSend = false;

// =============================================================
//  Forward declarations
// =============================================================
void setupSender();
void setupReceiver();
void setupJammer();
void loopSender();
void loopReceiver();
void loopJammer();
void printBanner();

void bufferPush(const char* msg);
bool bufferPop(char* out);
bool bufferIsEmpty();

bool senderHandshakeOnChannel(uint8_t chIdx);
bool receiverHandshakeOnChannel(uint8_t chIdx);
void senderAntiJamSequence();
void receiverAntiJamSequence();
void switchToChannel(uint8_t chIdx);

bool isValidMessage(const char* pkt);

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
    Serial.println(F("        Check wiring and power supply."));
    while (1);
  }

  radio.setPALevel(RF24_PA_MAX);
  radio.setDataRate(RF24_250KBPS);
  radio.setAutoAck(true);   // enable auto-ack to reduce noise
  radio.setRetries(5, 15);  // 5 x 250us delay, 15 retries

  switchToChannel(0);  // start on channel 90

  for (int i = 0; i < 32; i++)
    noisePayload[i] = (char)random(33, 126);

  printBanner();

  while (myRole == ROLE_NONE)
  {
    if (Serial.available())
    {
      String input = Serial.readStringUntil('\n');
      input.trim();
      if (input == "1")      myRole = ROLE_SENDER;
      else if (input == "2") myRole = ROLE_RECEIVER;
      else if (input == "3") myRole = ROLE_JAMMER;
      else Serial.println(F("Invalid choice. Enter 1, 2, or 3."));
    }
  }

  switch (myRole)
  {
    case ROLE_SENDER:   setupSender();   break;
    case ROLE_RECEIVER: setupReceiver(); break;
    case ROLE_JAMMER:   setupJammer();   break;
    default: break;
  }
}

// =============================================================
//  LOOP
// =============================================================
void loop()
{
  switch (myRole)
  {
    case ROLE_SENDER:   loopSender();   break;
    case ROLE_RECEIVER: loopReceiver(); break;
    case ROLE_JAMMER:   loopJammer();   break;
    default: break;
  }
}

// =============================================================
//  BANNER
// =============================================================
void printBanner()
{
  Serial.println(F(""));
  Serial.println(F("  ╔═══════════════════════════════════════════╗"));
  Serial.println(F("  ║   TACTICAL MESH NODE — Role Select        ║"));
  Serial.println(F("  ║   Anti-Jamming | 5-Channel Hopping        ║"));
  Serial.println(F("  ╠═══════════════════════════════════════════╣"));
  Serial.println(F("  ║  1 -> SENDER                              ║"));
  Serial.println(F("  ║  2 -> RECEIVER                            ║"));
  Serial.println(F("  ║  3 -> JAMMER                              ║"));
  Serial.println(F("  ╚═══════════════════════════════════════════╝"));
  Serial.print(F("  Available channels: "));
  for (int i = 0; i < NUM_CHANNELS; i++)
  {
    Serial.print(channelList[i]);
    if (i < NUM_CHANNELS - 1) Serial.print(F(", "));
  }
  Serial.println();
  Serial.print(F("  Select role: "));
}

// =============================================================
//  CHANNEL SWITCH HELPER
// =============================================================
void switchToChannel(uint8_t chIdx)
{
  currentChannelIndex = chIdx % NUM_CHANNELS;
  radio.setChannel(channelList[currentChannelIndex]);
}

// =============================================================
//  BUFFER HELPERS
// =============================================================

void bufferPush(const char* msg)
{
  if (bufCount >= MSG_BUF_SIZE)
  {
    Serial.println(F("  [BUFFER] FULL — oldest message dropped."));
    bufTail = (bufTail + 1) % MSG_BUF_SIZE;
    bufCount--;
  }
  strncpy(msgBuffer[bufHead], msg, 31);
  msgBuffer[bufHead][31] = '\0';
  bufHead = (bufHead + 1) % MSG_BUF_SIZE;
  bufCount++;

  Serial.print(F("  [BUFFER] Message saved ("));
  Serial.print(bufCount);
  Serial.println(F(" queued)"));
}

bool bufferPop(char* out)
{
  if (bufCount == 0) return false;
  strncpy(out, msgBuffer[bufTail], 32);
  bufTail = (bufTail + 1) % MSG_BUF_SIZE;
  bufCount--;
  return true;
}

bool bufferIsEmpty()
{
  return (bufCount == 0);
}

// =============================================================
//  MESSAGE VALIDATION
// =============================================================
// A valid message is one that starts with our known prefixes.
// This filters out ambient RF noise that NRF24L01 picks up.

bool isValidMessage(const char* pkt)
{
  // Protocol messages
  if (strcmp(pkt, "ACK_REQUEST") == 0) return true;
  if (strcmp(pkt, "ACK_CONFIRM") == 0) return true;
  if (strcmp(pkt, "HB")         == 0) return true;  // heartbeat
  if (strcmp(pkt, "BUF_START")  == 0) return true;
  if (strcmp(pkt, "BUF_END")    == 0) return true;

  // User messages start with "M:" prefix (2 bytes)
  if (pkt[0] == 'M' && pkt[1] == ':') return true;

  return false;
}

// Helper to build a tagged user message: "M:Hello" from "Hello"
void tagMessage(const char* raw, char* tagged)
{
  tagged[0] = 'M';
  tagged[1] = ':';
  strncpy(tagged + 2, raw, 29);
  tagged[31] = '\0';
}

// Helper to extract user text from tagged message: "Hello" from "M:Hello"
void untagMessage(const char* tagged, char* raw)
{
  strncpy(raw, tagged + 2, 30);
  raw[30] = '\0';
}


// =============================================================
// =============================================================
//  ██  SENDER  ██
// =============================================================
// =============================================================

bool senderHandshakeOnChannel(uint8_t chIdx)
{
  switchToChannel(chIdx);
  radio.openWritingPipe(pipeS2R);
  radio.openReadingPipe(1, pipeR2S);

  char ackPkt[32]  = "ACK_REQUEST";
  char response[32] = "";

  for (int a = 0; a < 15; a++)
  {
    radio.stopListening();
    bool sent = radio.write(&ackPkt, sizeof(ackPkt));

    if (sent)
    {
      radio.startListening();
      unsigned long start = millis();
      while (millis() - start < 400)
      {
        if (radio.available())
        {
          radio.read(&response, sizeof(response));
          if (strcmp(response, "ACK_CONFIRM") == 0)
          {
            radio.stopListening();
            return true;
          }
        }
      }
      radio.stopListening();
    }
    delay(200);
  }
  return false;
}

void setupSender()
{
  Serial.println(F("\n  ── SENDER MODE ───────────────────────"));
  Serial.println(F("  [INFO] Connecting to receiver..."));

  radio.openWritingPipe(pipeS2R);
  radio.openReadingPipe(1, pipeR2S);

  // Try initial handshake on default channel
  while (!senderHandshakeOnChannel(currentChannelIndex))
  {
    Serial.println(F("  [INFO] Receiver not found. Retrying..."));
    delay(1000);
  }

  connectionEstablished = true;
  senderInFailWindow = false;
  lastHeartbeatSent = millis();

  Serial.println(F(""));
  Serial.println(F("  ╔═════════════════════════════════════════╗"));
  Serial.println(F("  ║       CONNECTION ESTABLISHED!            ║"));
  Serial.print(F("  ║       Channel: "));
  Serial.print(channelList[currentChannelIndex]);
  Serial.println(F("                        ║"));
  Serial.println(F("  ╚═════════════════════════════════════════╝"));
  Serial.println(F(""));
  Serial.println(F("  [CHAT] Type a message and press Enter."));
  Serial.println(F("         Anti-jamming is ACTIVE.\n"));
}

// ─── SENDER: Anti-Jam Sequence ──────────────────────────────
void senderAntiJamSequence()
{
  Serial.println(F(""));
  Serial.println(F("  ╔═══════════════════════════════════════════════╗"));
  Serial.println(F("  ║  ██ JAMMING CONFIRMED — ANTI-JAM INITIATED ██ ║"));
  Serial.println(F("  ║     Searching for a clear channel...          ║"));
  Serial.println(F("  ╚═══════════════════════════════════════════════╝"));
  Serial.println(F(""));

  connectionEstablished = false;
  bool reconnected = false;
  int hopAttempt = 0;

  // Try each of the 5 channels (skip current jammed one)
  while (!reconnected)
  {
    // Move to the next channel in the list
    uint8_t nextIdx = (currentChannelIndex + 1) % NUM_CHANNELS;
    hopAttempt++;

    Serial.print(F("  [HOP "));
    Serial.print(hopAttempt);
    Serial.print(F("] Trying channel "));
    Serial.print(channelList[nextIdx]);
    Serial.println(F(" ..."));

    reconnected = senderHandshakeOnChannel(nextIdx);

    if (reconnected)
    {
      currentChannelIndex = nextIdx;
      Serial.print(F("         ✓ Receiver found on channel "));
      Serial.println(channelList[currentChannelIndex]);
    }
    else
    {
      Serial.print(F("         ✗ Channel "));
      Serial.print(channelList[nextIdx]);
      Serial.println(F(" — no receiver, trying next..."));
      currentChannelIndex = nextIdx;  // advance for next iteration
    }
  }

  // ── Connected on new channel! ────────────────────────────
  connectionEstablished = true;
  senderInFailWindow = false;
  lastHeartbeatSent = millis();

  Serial.println(F(""));
  Serial.println(F("  ╔═══════════════════════════════════════════════╗"));
  Serial.println(F("  ║  ✓  SAFE CHANNEL FOUND — RECONNECTED!        ║"));
  Serial.print(F("  ║     Channel: "));
  Serial.print(channelList[currentChannelIndex]);
  Serial.println(F("                                ║"));
  Serial.println(F("  ╚═══════════════════════════════════════════════╝"));
  Serial.println(F(""));

  // ── RETRANSMIT buffered messages ──────────────────────────
  if (!bufferIsEmpty())
  {
    Serial.println(F("  ┌──────────────────────────────────────────┐"));
    Serial.print(F("  │  RETRANSMISSION PHASE: "));
    Serial.print(bufCount);
    Serial.println(F(" message(s)     │"));
    Serial.println(F("  └──────────────────────────────────────────┘"));

    // Send BUF_START marker
    char marker[32] = "BUF_START";
    radio.stopListening();
    radio.write(&marker, sizeof(marker));
    delay(50);

    char outMsg[32];
    int msgNum = 0;
    while (bufferPop(outMsg))
    {
      msgNum++;
      radio.stopListening();
      bool ok = radio.write(&outMsg, sizeof(outMsg));
      if (ok)
      {
        // outMsg is tagged ("M:text"), extract the text for display
        char display[32];
        untagMessage(outMsg, display);
        Serial.print(F("  [RETX "));
        Serial.print(msgNum);
        Serial.print(F("] >> "));
        Serial.println(display);
      }
      else
      {
        Serial.print(F("  [RETX FAIL] Couldn't send, re-buffering..."));
        bufferPush(outMsg);
        Serial.println();
        senderAntiJamSequence();  // try again
        return;
      }
      delay(50);
    }

    // Send BUF_END marker
    char endMarker[32] = "BUF_END";
    radio.write(&endMarker, sizeof(endMarker));

    Serial.println(F("  [RETRANSMIT] All buffered messages delivered."));
  }
  else
  {
    Serial.println(F("  [BUFFER] Empty — nothing to retransmit."));
  }

  Serial.println(F(""));
  Serial.println(F("  ═══════════════════════════════════════════"));
  Serial.println(F("  NORMAL COMMUNICATION RESUMED"));
  Serial.println(F("  ═══════════════════════════════════════════\n"));
}

// ─── SENDER LOOP ────────────────────────────────────────────
void loopSender()
{
  if (!connectionEstablished) return;

  // ── Listen for incoming messages (100ms window) ───────────
  radio.startListening();
  unsigned long listenStart = millis();
  while (millis() - listenStart < 100)
  {
    if (radio.available())
    {
      char incoming[32] = "";
      radio.read(&incoming, sizeof(incoming));

      if (!isValidMessage(incoming))
        continue;  // silently ignore noise

      // Got a valid packet — channel is working
      if (senderInFailWindow)
      {
        senderInFailWindow = false;
        Serial.println(F("  [INFO] Channel clear — jam detection cancelled."));
      }

      // Display user messages (strip "M:" prefix)
      if (incoming[0] == 'M' && incoming[1] == ':')
      {
        char display[32];
        untagMessage(incoming, display);
        Serial.print(F("  [RECV] << "));
        Serial.println(display);
      }
      // Silently accept heartbeats and protocol packets
    }
  }
  radio.stopListening();

  // ── If in fail window, handle the 10-second countdown ─────
  if (senderInFailWindow)
  {
    unsigned long elapsed = millis() - senderFailStartTime;

    // Buffer any user-typed messages during jam window
    if (Serial.available())
    {
      String msg = Serial.readStringUntil('\n');
      msg.trim();
      if (msg.length() > 0)
      {
        char tagged[32];
        char raw[30];
        msg.toCharArray(raw, sizeof(raw));
        tagMessage(raw, tagged);
        bufferPush(tagged);
      }
    }

    // Show countdown every 2 seconds
    if (millis() - lastFailPrint > 2000)
    {
      unsigned long remaining = (SENDER_JAM_TIME_MS - elapsed) / 1000;
      if (remaining > 0 && remaining <= 10)
      {
        Serial.print(F("  [JAMMING] ▓▓▓ Send failures continuing — "));
        Serial.print(remaining);
        Serial.println(F("s until anti-jam ▓▓▓"));
      }
      lastFailPrint = millis();

      // Also try a test write to see if channel cleared
      radio.stopListening();
      char testPkt[32] = "HB";
      bool testOk = radio.write(&testPkt, sizeof(testPkt));
      if (testOk)
      {
        senderInFailWindow = false;
        lastHeartbeatSent = millis();
        Serial.println(F("  [INFO] Channel clear — jam detection cancelled."));
        return;
      }
    }

    // After 10 seconds → trigger anti-jam
    if (elapsed >= SENDER_JAM_TIME_MS)
    {
      senderAntiJamSequence();
    }

    return;  // skip normal send during jam window
  }

  // ── Send heartbeat if idle for 3 seconds ──────────────────
  if (millis() - lastHeartbeatSent >= HEARTBEAT_INTERVAL_MS)
  {
    radio.stopListening();
    char hb[32] = "HB";
    bool hbOk = radio.write(&hb, sizeof(hb));
    lastHeartbeatSent = millis();

    if (!hbOk)
    {
      // Heartbeat failed — possible jamming
      Serial.println(F("  [WARN] Heartbeat FAILED! (possible jamming)"));

      if (!senderInFailWindow)
      {
        senderInFailWindow = true;
        senderFailStartTime = millis();
        lastFailPrint = millis();
        Serial.println(F(""));
        Serial.println(F("  ┌───────────────────────────────────────────┐"));
        Serial.println(F("  │  ⚠  POSSIBLE JAMMING DETECTED            │"));
        Serial.println(F("  │     Monitoring for 10 seconds...          │"));
        Serial.println(F("  │     Messages you type will be buffered.   │"));
        Serial.println(F("  └───────────────────────────────────────────┘"));
        Serial.println(F(""));
      }
    }
  }

  // ── Send user-typed messages ──────────────────────────────
  if (Serial.available())
  {
    String msg = Serial.readStringUntil('\n');
    msg.trim();
    if (msg.length() == 0) return;

    // Tag the message with "M:" prefix
    char raw[30];
    char tagged[32];
    msg.toCharArray(raw, sizeof(raw));
    tagMessage(raw, tagged);

    radio.stopListening();
    bool success = radio.write(&tagged, sizeof(tagged));

    if (success)
    {
      Serial.print(F("  [SENT] >> "));
      Serial.println(msg);
      lastHeartbeatSent = millis();  // reset HB timer after real send
    }
    else
    {
      Serial.println(F("  [WARN] Send FAILED! (possible jamming)"));
      bufferPush(tagged);  // buffer with tag so retransmit works

      if (!senderInFailWindow)
      {
        senderInFailWindow = true;
        senderFailStartTime = millis();
        lastFailPrint = millis();
        Serial.println(F(""));
        Serial.println(F("  ┌───────────────────────────────────────────┐"));
        Serial.println(F("  │  ⚠  POSSIBLE JAMMING DETECTED            │"));
        Serial.println(F("  │     Monitoring for 10 seconds...          │"));
        Serial.println(F("  │     Messages you type will be buffered.   │"));
        Serial.println(F("  └───────────────────────────────────────────┘"));
        Serial.println(F(""));
      }
    }
  }
}


// =============================================================
// =============================================================
//  ██  RECEIVER  ██
// =============================================================
// =============================================================

bool receiverHandshakeOnChannel(uint8_t chIdx)
{
  switchToChannel(chIdx);
  radio.openReadingPipe(1, pipeS2R);
  radio.openWritingPipe(pipeR2S);
  radio.startListening();

  unsigned long timeout = millis();
  const unsigned long HANDSHAKE_TIMEOUT = 6000;  // 6s per channel

  while (millis() - timeout < HANDSHAKE_TIMEOUT)
  {
    if (radio.available())
    {
      char incoming[32] = "";
      radio.read(&incoming, sizeof(incoming));

      if (strcmp(incoming, "ACK_REQUEST") == 0)
      {
        Serial.println(F("         ACK_REQUEST received!"));
        radio.stopListening();
        char confirm[32] = "ACK_CONFIRM";
        radio.write(&confirm, sizeof(confirm));
        radio.startListening();
        return true;
      }
    }
  }
  return false;
}

void setupReceiver()
{
  Serial.println(F("\n  ── RECEIVER MODE ─────────────────────"));
  Serial.println(F("  [INFO] Waiting for sender connection..."));

  radio.openReadingPipe(1, pipeS2R);
  radio.openWritingPipe(pipeR2S);

  while (!receiverHandshakeOnChannel(currentChannelIndex))
  {
    Serial.println(F("  [INFO] Waiting for sender..."));
  }

  connectionEstablished = true;
  receiverCanSend = false;
  receiverJamWarned = false;
  lastValidPacketTime = millis();

  Serial.println(F(""));
  Serial.println(F("  ╔═════════════════════════════════════════╗"));
  Serial.println(F("  ║       CONNECTION ESTABLISHED!            ║"));
  Serial.print(F("  ║       Channel: "));
  Serial.print(channelList[currentChannelIndex]);
  Serial.println(F("                        ║"));
  Serial.println(F("  ╚═════════════════════════════════════════╝"));
  Serial.println(F(""));
  Serial.println(F("  [CHAT] Half-duplex: reply after receiving."));
  Serial.println(F("         Anti-jamming is ACTIVE.\n"));
}

// ─── RECEIVER: Anti-Jam Sequence ────────────────────────────
void receiverAntiJamSequence()
{
  Serial.println(F(""));
  Serial.println(F("  ╔═══════════════════════════════════════════════╗"));
  Serial.println(F("  ║  ██ JAMMING CONFIRMED — ANTI-JAM INITIATED ██ ║"));
  Serial.println(F("  ║     Searching for sender on clear channel...  ║"));
  Serial.println(F("  ╚═══════════════════════════════════════════════╝"));
  Serial.println(F(""));

  connectionEstablished = false;
  receiverCanSend = false;
  bool reconnected = false;
  int hopAttempt = 0;

  while (!reconnected)
  {
    uint8_t nextIdx = (currentChannelIndex + 1) % NUM_CHANNELS;
    hopAttempt++;

    Serial.print(F("  [HOP "));
    Serial.print(hopAttempt);
    Serial.print(F("] Listening on channel "));
    Serial.print(channelList[nextIdx]);
    Serial.println(F(" ..."));

    reconnected = receiverHandshakeOnChannel(nextIdx);

    if (reconnected)
    {
      currentChannelIndex = nextIdx;
      Serial.print(F("         ✓ Sender found on channel "));
      Serial.println(channelList[currentChannelIndex]);
    }
    else
    {
      Serial.print(F("         ✗ Channel "));
      Serial.print(channelList[nextIdx]);
      Serial.println(F(" — no sender, trying next..."));
      currentChannelIndex = nextIdx;
    }
  }

  // ── Connected on new channel! ────────────────────────────
  connectionEstablished = true;
  receiverJamWarned = false;
  lastValidPacketTime = millis();

  Serial.println(F(""));
  Serial.println(F("  ╔═══════════════════════════════════════════════╗"));
  Serial.println(F("  ║  ✓  SAFE CHANNEL FOUND — RECONNECTED!        ║"));
  Serial.print(F("  ║     Channel: "));
  Serial.print(channelList[currentChannelIndex]);
  Serial.println(F("                                ║"));
  Serial.println(F("  ╚═══════════════════════════════════════════════╝"));
  Serial.println(F(""));

  // ── Receive retransmitted buffered messages ───────────────
  Serial.println(F("  [RETRANSMIT] Waiting for buffered messages..."));

  radio.startListening();
  unsigned long retxTimeout = millis();
  int retxCount = 0;

  while (millis() - retxTimeout < 15000)
  {
    if (radio.available())
    {
      char incoming[32] = "";
      radio.read(&incoming, sizeof(incoming));

      if (!isValidMessage(incoming)) continue;

      if (strcmp(incoming, "BUF_START") == 0)
      {
        Serial.println(F("  [RETRANSMIT] Receiving buffered messages:"));
        retxTimeout = millis();
        continue;
      }

      if (strcmp(incoming, "BUF_END") == 0)
      {
        Serial.print(F("  [RETRANSMIT] Complete — "));
        Serial.print(retxCount);
        Serial.println(F(" message(s) recovered."));
        break;
      }

      if (strcmp(incoming, "ACK_REQUEST") == 0 ||
          strcmp(incoming, "ACK_CONFIRM") == 0 ||
          strcmp(incoming, "HB") == 0)
      {
        retxTimeout = millis();
        continue;
      }

      // User message (tagged with "M:")
      if (incoming[0] == 'M' && incoming[1] == ':')
      {
        retxCount++;
        char display[32];
        untagMessage(incoming, display);
        Serial.print(F("  [RETX "));
        Serial.print(retxCount);
        Serial.print(F("] << "));
        Serial.println(display);
        retxTimeout = millis();
      }
    }
  }

  lastValidPacketTime = millis();

  Serial.println(F(""));
  Serial.println(F("  ═══════════════════════════════════════════"));
  Serial.println(F("  NORMAL COMMUNICATION RESUMED"));
  Serial.println(F("  ═══════════════════════════════════════════\n"));
}

// ─── RECEIVER LOOP ──────────────────────────────────────────
void loopReceiver()
{
  if (!connectionEstablished) return;

  radio.startListening();

  // ── Read any available packets ────────────────────────────
  if (radio.available())
  {
    char incoming[32] = "";
    radio.read(&incoming, sizeof(incoming));

    // Silently discard noise / non-valid packets
    if (!isValidMessage(incoming))
      return;

    // Valid packet received — reset jam detection timer
    lastValidPacketTime = millis();
    if (receiverJamWarned)
    {
      receiverJamWarned = false;
      Serial.println(F("  [INFO] Heartbeat received — jam detection cancelled."));
    }

    // Heartbeat — just acknowledge internally
    if (strcmp(incoming, "HB") == 0)
      return;

    // Protocol packets — ignore
    if (strcmp(incoming, "ACK_REQUEST") == 0 ||
        strcmp(incoming, "ACK_CONFIRM") == 0 ||
        strcmp(incoming, "BUF_START") == 0 ||
        strcmp(incoming, "BUF_END") == 0)
      return;

    // User message (tagged with "M:")
    if (incoming[0] == 'M' && incoming[1] == ':')
    {
      char display[32];
      untagMessage(incoming, display);
      Serial.print(F("  [RECV] << "));
      Serial.println(display);

      receiverCanSend = true;
      Serial.println(F("  [INFO] You may now type a reply."));
    }
  }

  // ── Heartbeat timeout detection ───────────────────────────
  unsigned long sinceLastValid = millis() - lastValidPacketTime;

  // Show warning after 6 seconds of no valid packets
  if (sinceLastValid > 6000 && !receiverJamWarned)
  {
    receiverJamWarned = true;
    Serial.println(F(""));
    Serial.println(F("  ┌───────────────────────────────────────────┐"));
    Serial.println(F("  │  ⚠  No heartbeat from sender!            │"));
    Serial.println(F("  │     Possible jamming detected...          │"));
    Serial.println(F("  │     Anti-jam in ~6 seconds if no signal.  │"));
    Serial.println(F("  └───────────────────────────────────────────┘"));
    Serial.println(F(""));
  }

  // Trigger anti-jam after 12 seconds
  if (sinceLastValid >= RECEIVER_JAM_TIME_MS)
  {
    receiverAntiJamSequence();
    return;
  }

  // ── If receiver is allowed to send, check Serial ──────────
  if (receiverCanSend && Serial.available())
  {
    String msg = Serial.readStringUntil('\n');
    msg.trim();
    if (msg.length() == 0) return;

    char raw[30];
    char tagged[32];
    msg.toCharArray(raw, sizeof(raw));
    tagMessage(raw, tagged);

    radio.stopListening();
    bool success = radio.write(&tagged, sizeof(tagged));
    radio.startListening();

    if (success)
    {
      Serial.print(F("  [SENT] >> "));
      Serial.println(msg);
      receiverCanSend = false;
      lastValidPacketTime = millis();  // own send counts as activity
      Serial.println(F("  [INFO] Waiting for next message from sender..."));
    }
    else
    {
      Serial.println(F("  [ERROR] Send failed! Try again."));
    }
  }
}


// =============================================================
// =============================================================
//  ██  JAMMER  ██
// =============================================================
// =============================================================

void setupJammer()
{
  Serial.println(F("\n  ── JAMMER MODE ───────────────────────"));
  Serial.print(F("  Available channels: "));
  for (int i = 0; i < NUM_CHANNELS; i++)
  {
    Serial.print(channelList[i]);
    if (i < NUM_CHANNELS - 1) Serial.print(F(", "));
  }
  Serial.println();
  Serial.println(F("  [INFO] Enter the target channel number (0-125):"));

  while (true)
  {
    if (Serial.available())
    {
      String input = Serial.readStringUntil('\n');
      input.trim();
      int ch = input.toInt();
      if (ch >= 0 && ch <= 125)
      {
        jamChannel = (uint8_t)ch;
        break;
      }
      else
        Serial.println(F("  [ERROR] Invalid channel. Enter 0-125:"));
    }
  }

  radio.setChannel(jamChannel);
  radio.setAutoAck(false);   // jammer doesn't need ACK
  radio.openWritingPipe(pipeS2R);
  radio.stopListening();

  Serial.println(F(""));
  Serial.println(F("  ╔═══════════════════════════════════════╗"));
  Serial.print(F("  ║   Targeting channel: "));
  Serial.print(jamChannel);
  Serial.println(F("                ║"));
  Serial.println(F("  ╠═══════════════════════════════════════╣"));
  Serial.println(F("  ║   /jam     -> Start jamming            ║"));
  Serial.println(F("  ║   /antijam -> Stop  jamming            ║"));
  Serial.println(F("  ╚═══════════════════════════════════════╝"));
  Serial.println(F(""));
}

void loopJammer()
{
  if (Serial.available())
  {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "/jam")
    {
      jamming = true;
      Serial.println(F("  [JAMMER] ▓▓▓ JAMMING ACTIVE ▓▓▓"));
    }
    else if (cmd == "/antijam")
    {
      jamming = false;
      Serial.println(F("  [JAMMER] ░░░ Jamming stopped ░░░"));
    }
    else
    {
      Serial.println(F("  [JAMMER] Unknown command. Use /jam or /antijam"));
    }
  }

  if (jamming)
  {
    for (int i = 0; i < 32; i++)
      noisePayload[i] = (char)random(0, 255);

    radio.write(&noisePayload, sizeof(noisePayload));

    if (millis() - lastJamMillis > 2000)
    {
      Serial.print(F("  [JAMMER] Flooding channel "));
      Serial.print(jamChannel);
      Serial.println(F(" ..."));
      lastJamMillis = millis();
    }
  }
}
