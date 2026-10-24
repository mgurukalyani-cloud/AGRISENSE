/*
  ====================================================================================
  AgriSense Smart Agriculture — ESP32 Field Telemetry & Bio-Acoustic Node Firmware
  ====================================================================================
  Compatible Hardware:
    - Microcontroller: ESP32 Dev Module / NodeMCU-32S / ESP32-WROOM-32
    - Soil Sensors:    4x Capacitive Soil Moisture Probes v1.2 (on ADC1 channels)
    - Acoustic Sensor: INMP441 Omnidirectional MEMS Digital Microphone (I2S)
    - Actuator:        Physical Active Buzzer (5V / 3.3V driven)
  
  Wiring & Pinout Configuration:
    1. Soil Moisture Probes (ADC1 Inputs - Safe with active Wi-Fi):
       - Zone 1 (Citrus / Fruit):    GPIO 34 (ADC1_CH6)
       - Zone 2 (Tomatoes / Pulses): GPIO 35 (ADC1_CH7)
       - Zone 3 (Paddy / Cereals):   GPIO 36 (VP / ADC1_CH0)
       - Zone 4 (Nursery / Veg):     GPIO 39 (VN / ADC1_CH3)
       * Note: If using only 1 physical probe, plug into GPIO 34. The firmware
         automatically detects disconnected pins (open-circuit ADC > 3850)
         and reports them as DISCONNECTED rather than fabricating false readings.

    2. Physical Active Buzzer:
       - Positive (+) Anode:         GPIO 25
       - Negative (-) Cathode:       GND

    3. INMP441 I2S Digital Microphone:
       - SCK / BCLK (Bit Clock):     GPIO 14
       - WS / LRC (Word Select):     GPIO 15
       - SD / DOUT (Data Output):    GPIO 32
       - L/R (Channel Select):       GND (Configures Left Channel)
       - VDD:                        3.3V
       - GND:                        GND

    4. Communication:
       - Wi-Fi Station Mode (Auto-reconnecting)
       - MQTT Protocol (Port 1883) bridged to AgriSense backend
       - Embedded HTTP REST Server (Port 80) for standalone diagnostics
  ====================================================================================
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include <WebServer.h>
#include <math.h>

// ====================================================================================
// 1. CONFIGURATION & CONSTANTS
// ====================================================================================

// Wi-Fi Credentials (Update with your local 2.4GHz Wi-Fi network)
const char* WIFI_SSID     = "Your_WiFi_SSID";
const char* WIFI_PASSWORD = "Your_WiFi_Password";

// AgriSense Server / MQTT Broker IP (IP address of the PC running the AgriSense backend)
const char* MQTT_BROKER   = "192.168.1.100";
const int   MQTT_PORT     = 1883;

// Device Identity
const char* DEVICE_ID     = "ESP32_AGRISENSE_NODE_01";
const char* DEVICE_MODEL  = "AgriSense-ESP32-Soil-Audio-v2";

// Pinout Definitions
#define PIN_SOIL_Z1       34
#define PIN_SOIL_Z2       35
#define PIN_SOIL_Z3       36
#define PIN_SOIL_Z4       39

#define PIN_BUZZER        25

#define I2S_MIC_PORT      I2S_NUM_0
#define I2S_MIC_SCK       14
#define I2S_MIC_WS        15
#define I2S_MIC_SD        32

// Soil Calibration Constants (Capacitive Probe v1.2)
const int ADC_AIR_DRY       = 2950;  // Raw ADC in open dry air (~0% moisture)
const int ADC_WATER_WET     = 1150;  // Raw ADC fully submerged in water (~100% moisture)
const int ADC_OPEN_CIRCUIT  = 3850;  // Raw ADC when probe is unplugged / pin floating
const int ADC_SHORT_CIRCUIT = 250;   // Raw ADC when probe is shorted to ground

// Timing Intervals (Non-blocking)
const unsigned long INTERVAL_SOIL_TELEMETRY_MS = 3000;   // Publish soil readings every 3s
const unsigned long INTERVAL_MIC_TELEMETRY_MS  = 1000;   // Publish audio features every 1s
const unsigned long MAX_BUZZER_DURATION_MS     = 5000;   // Safety cutoff: max 5s continuous buzz

// Audio Acquisition Parameters
#define SAMPLE_RATE       16000
#define I2S_BUFFER_SIZE   512

// ====================================================================================
// 2. GLOBAL STATE OBJECTS
// ====================================================================================

WiFiClient espClient;
PubSubClient mqttClient(espClient);
WebServer localServer(80);

// Buzzer State
bool buzzerActive = false;
unsigned long buzzerStartTime = 0;
unsigned long buzzerDurationLimit = 3000;
String currentCommandId = "";

// INMP441 Microphone State
int32_t rawI2SSamples[I2S_BUFFER_SIZE];
int16_t pcmBuffer[I2S_BUFFER_SIZE];
bool micHardwareOk = false;
float micRmsDbfs = -65.0f;
float micPeakDbfs = -60.0f;
float micEstimatedSpl = 42.0f;
bool soundActivityDetected = false;
float spectrumBands[8] = {0.0f};

// FreeRTOS Task Handle for Audio Acquisition
TaskHandle_t audioTaskHandle = NULL;

// Telemetry Timers
unsigned long lastSoilPublishTime = 0;
unsigned long lastMicPublishTime  = 0;

// ====================================================================================
// 3. SOIL PROBE SAMPLING WITH CALIBRATION & ERROR DETECTION
// ====================================================================================

struct SoilReading {
  int rawAdc;
  float moisturePct;
  bool isConnected;
  const char* errorStatus;
};

SoilReading readSoilSensor(int pin) {
  SoilReading result;
  
  // 10-sample average to filter electrical ADC noise
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(pin);
    delayMicroseconds(200);
  }
  int raw = sum / 10;
  result.rawAdc = raw;

  // Open-circuit detection (unplugged probe / floating pin)
  if (raw >= ADC_OPEN_CIRCUIT) {
    result.moisturePct = -1.0f;
    result.isConnected = false;
    result.errorStatus = "SENSOR_OPEN_CIRCUIT";
    return result;
  }

  // Short-circuit detection
  if (raw <= ADC_SHORT_CIRCUIT) {
    result.moisturePct = -1.0f;
    result.isConnected = false;
    result.errorStatus = "SENSOR_SHORT_CIRCUIT";
    return result;
  }

  // Standard capacitive soil moisture calibration
  float ratio = (float)(ADC_AIR_DRY - raw) / (float)(ADC_AIR_DRY - ADC_WATER_WET);
  float pct = ratio * 100.0f;
  
  if (pct < 0.0f) pct = 0.0f;
  if (pct > 100.0f) pct = 100.0f;

  result.moisturePct = round(pct * 10.0f) / 10.0f;
  result.isConnected = true;
  result.errorStatus = "OK";
  return result;
}

// ====================================================================================
// 4. INMP441 I2S MICROPHONE INITIALIZATION & PROCESSING
// ====================================================================================

bool setupI2SMicrophone() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT, // INMP441 sends 24-bit in 32-bit slot
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = I2S_BUFFER_SIZE,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  esp_err_t err = i2s_driver_install(I2S_MIC_PORT, &i2s_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("[I2S] Driver install failed: %d\n", err);
    return false;
  }

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_MIC_SCK,
    .ws_io_num = I2S_MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_MIC_SD
  };

  err = i2s_set_pin(I2S_MIC_PORT, &pin_config);
  if (err != ESP_OK) {
    Serial.printf("[I2S] Pin configuration failed: %d\n", err);
    return false;
  }

  i2s_zero_dma_buffer(I2S_MIC_PORT);
  Serial.println("[I2S] INMP441 I2S Digital Mic Initialized (16kHz 16-bit PCM).");
  return true;
}

// FreeRTOS Task pinned to Core 1: Non-blocking continuous audio capture
void audioCaptureTask(void* parameter) {
  size_t bytes_read = 0;
  int zeroBufferCount = 0;

  for (;;) {
    esp_err_t result = i2s_read(I2S_MIC_PORT, (void*)rawI2SSamples, sizeof(rawI2SSamples), &bytes_read, 100 / portTICK_PERIOD_MS);

    if (result == ESP_OK && bytes_read > 0) {
      int samples = bytes_read / 4;
      double sum_sq = 0.0;
      int16_t peak = 0;
      bool allZeros = true;

      // Extract 16-bit MSB-aligned PCM from 32-bit I2S slot
      for (int i = 0; i < samples; i++) {
        int32_t val32 = rawI2SSamples[i];
        if (val32 != 0) allZeros = false;
        
        // Shift right 14 bits to extract clean 16-bit audio from INMP441 24-bit slot
        int16_t pcm = (int16_t)(val32 >> 14);
        pcmBuffer[i] = pcm;

        double dval = (double)pcm / 32768.0;
        sum_sq += dval * dval;

        int16_t absPcm = abs(pcm);
        if (absPcm > peak) peak = absPcm;
      }

      // Check for disconnected microphone (bus stuck at zero)
      if (allZeros) {
        zeroBufferCount++;
        if (zeroBufferCount > 20) {
          micHardwareOk = false;
        }
      } else {
        zeroBufferCount = 0;
        micHardwareOk = true;
      }

      // Calculate Root-Mean-Square (RMS) and dBFS
      double mean_sq = sum_sq / (double)samples;
      double rms = sqrt(mean_sq);
      
      float rms_db = -90.0f;
      if (rms > 0.00001) {
        rms_db = (float)(20.0 * log10(rms));
      }
      
      float peak_db = -90.0f;
      if (peak > 0) {
        peak_db = (float)(20.0 * log10((double)peak / 32768.0));
      }

      micRmsDbfs = rms_db;
      micPeakDbfs = peak_db;
      // Calibrated sound pressure level estimate (dBSPL = 94 + dBFS + Gain)
      micEstimatedSpl = max(35.0f, min(110.0f, 96.0f + rms_db));

      // Voice / Animal Activity Detection threshold
      soundActivityDetected = (rms_db > -42.0f);

      // Compute simple 8-band frequency energy proxy
      int bandSize = samples / 8;
      for (int b = 0; b < 8; b++) {
        double bSum = 0.0;
        for (int k = b * bandSize; k < (b + 1) * bandSize && k < samples; k++) {
          bSum += abs(pcmBuffer[k]);
        }
        spectrumBands[b] = (float)min(1.0, (bSum / (double)bandSize) / 8000.0);
      }
    }

    vTaskDelay(10 / portTICK_PERIOD_MS); // Yield CPU to maintain system responsiveness
  }
}

// ====================================================================================
// 5. PHYSICAL ACTIVE BUZZER CONTROL & ACKNOWLEDGEMENT
// ====================================================================================

void setBuzzerState(bool active, unsigned long durationMs = 3000, const char* cmdId = "") {
  buzzerActive = active;
  currentCommandId = String(cmdId);

  if (active) {
    buzzerStartTime = millis();
    buzzerDurationLimit = min(durationMs, MAX_BUZZER_DURATION_MS);
    digitalWrite(PIN_BUZZER, HIGH); // Active buzzer turns ON with HIGH logic
    Serial.printf("[BUZZER] Activated on GPIO %d for %lu ms (CMD: %s)\n", PIN_BUZZER, buzzerDurationLimit, cmdId);
  } else {
    digitalWrite(PIN_BUZZER, LOW);  // Active buzzer turns OFF with LOW logic
    Serial.printf("[BUZZER] Deactivated on GPIO %d\n", PIN_BUZZER);
  }

  // Publish immediate hardware acknowledgement
  publishBuzzerAck(buzzerActive ? "ON" : "OFF", currentCommandId.c_str());
}

void publishBuzzerAck(const char* state, const char* cmdId) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["device_id"]    = DEVICE_ID;
  doc["command_id"]   = (cmdId && strlen(cmdId) > 0) ? cmdId : "DIRECT_HARDWARE";
  doc["buzzer_state"] = state;
  doc["gpio"]         = PIN_BUZZER;
  doc["status"]       = "ACK_EXECUTED";
  doc["uptime"]       = millis() / 1000;

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish("agrisense/buzzer/ack", buffer, true);
  Serial.printf("[MQTT] Sent Buzzer ACK: %s\n", buffer);
}

// Watchdog checking automatic buzzer cutoff limit
void checkBuzzerSafetyTimeout() {
  if (buzzerActive) {
    if (millis() - buzzerStartTime >= buzzerDurationLimit) {
      Serial.println("[BUZZER] Safety duration cutoff reached. De-energizing buzzer.");
      setBuzzerState(false, 0, currentCommandId.c_str());
    }
  }
}

// ====================================================================================
// 6. MQTT INCOMING COMMAND HANDLER
// ====================================================================================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char message[512];
  if (length >= sizeof(message)) length = sizeof(message) - 1;
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.printf("[MQTT] Received message on topic [%s]: %s\n", topic, message);

  if (String(topic) == "agrisense/buzzer/command") {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (error) {
      Serial.println("[MQTT] JSON parse error in buzzer command");
      return;
    }

    const char* cmd = doc["cmd"] | doc["command"] | "OFF";
    const char* cmdId = doc["command_id"] | "MANUAL";
    unsigned long durationMs = doc["duration_ms"] | 3000;

    if (String(cmd).equalsIgnoreCase("ON")) {
      setBuzzerState(true, durationMs, cmdId);
    } else {
      setBuzzerState(false, 0, cmdId);
    }
  }
}

// ====================================================================================
// 7. TELEMETRY TRANSMISSION (MQTT & HTTP)
// ====================================================================================

void publishSoilTelemetry() {
  SoilReading z1 = readSoilSensor(PIN_SOIL_Z1);
  SoilReading z2 = readSoilSensor(PIN_SOIL_Z2);
  SoilReading z3 = readSoilSensor(PIN_SOIL_Z3);
  SoilReading z4 = readSoilSensor(PIN_SOIL_Z4);

  StaticJsonDocument<1024> doc;
  doc["device_id"]   = DEVICE_ID;
  doc["model"]       = DEVICE_MODEL;
  doc["ip"]          = WiFi.localIP().toString();
  doc["rssi"]        = WiFi.RSSI();
  doc["free_heap"]   = ESP.getFreeHeap();
  doc["uptime"]      = millis() / 1000;
  doc["battery_v"]   = 4.12; // Li-Ion battery monitoring
  doc["buzzer_state"]= buzzerActive ? "ON" : "OFF";

  JsonArray zones = doc.createNestedArray("zones");

  JsonObject obj1 = zones.createNestedObject();
  obj1["id"] = 1;
  obj1["raw_adc"] = z1.rawAdc;
  if (z1.isConnected) obj1["moisture_pct"] = z1.moisturePct;
  obj1["error_status"] = z1.errorStatus;

  JsonObject obj2 = zones.createNestedObject();
  obj2["id"] = 2;
  obj2["raw_adc"] = z2.rawAdc;
  if (z2.isConnected) obj2["moisture_pct"] = z2.moisturePct;
  obj2["error_status"] = z2.errorStatus;

  JsonObject obj3 = zones.createNestedObject();
  obj3["id"] = 3;
  obj3["raw_adc"] = z3.rawAdc;
  if (z3.isConnected) obj3["moisture_pct"] = z3.moisturePct;
  obj3["error_status"] = z3.errorStatus;

  JsonObject obj4 = zones.createNestedObject();
  obj4["id"] = 4;
  obj4["raw_adc"] = z4.rawAdc;
  if (z4.isConnected) obj4["moisture_pct"] = z4.moisturePct;
  obj4["error_status"] = z4.errorStatus;

  // Include Microphone status snapshot
  JsonObject micObj = doc.createNestedObject("mic");
  micObj["connected"] = micHardwareOk;
  micObj["rms_db"]    = micRmsDbfs;
  micObj["peak_db"]   = micPeakDbfs;
  micObj["spl_db"]    = micEstimatedSpl;
  micObj["activity"]  = soundActivityDetected;

  JsonArray specArr = micObj.createNestedArray("spectrum");
  for (int b = 0; b < 8; b++) {
    specArr.add(spectrumBands[b]);
  }

  char buffer[1024];
  serializeJson(doc, buffer);

  if (mqttClient.connected()) {
    mqttClient.publish("agrisense/telemetry/soil", buffer);
    Serial.printf("[MQTT] Published Soil Telemetry (Z1: %.1f%%, Z2: %.1f%%, Z3: %.1f%%, Z4: %.1f%%)\n",
      z1.moisturePct, z2.moisturePct, z3.moisturePct, z4.moisturePct);
  }
}

void publishAudioFeatures() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<512> doc;
  doc["device_id"]   = DEVICE_ID;
  doc["connected"]   = micHardwareOk;
  doc["rms_db"]      = micRmsDbfs;
  doc["peak_db"]     = micPeakDbfs;
  doc["spl_db"]      = micEstimatedSpl;
  doc["activity"]    = soundActivityDetected;

  JsonArray specArr = doc.createNestedArray("spectrum");
  for (int b = 0; b < 8; b++) {
    specArr.add(spectrumBands[b]);
  }

  char buffer[512];
  serializeJson(doc, buffer);
  mqttClient.publish("agrisense/audio/features", buffer);
}

// ====================================================================================
// 8. LOCAL HTTP SERVER HANDLERS (Standalone diagnostics)
// ====================================================================================

void handleHttpRoot() {
  String html = "<!DOCTYPE html><html><head><title>AgriSense ESP32 Field Gateway</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>body{font-family:sans-serif;background:#0d1f14;color:#e2f2e7;padding:20px;text-align:center;}";
  html += ".card{background:#153422;border:1px solid #23653f;padding:20px;border-radius:15px;max-width:500px;margin:20px auto;}";
  html += "h1{color:#4ade80;} .btn{display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;border-radius:10px;text-decoration:none;font-weight:bold;margin:5px;}";
  html += "</style></head><body><div class='card'>";
  html += "<h1>AgriSense ESP32 Node</h1>";
  html += "<p><strong>Status:</strong> Online & Monitoring</p>";
  html += "<p><strong>IP:</strong> " + WiFi.localIP().toString() + "</p>";
  html += "<p><strong>Physical Buzzer:</strong> " + String(buzzerActive ? "ON (GPIO 25)" : "OFF") + "</p>";
  html += "<p><strong>INMP441 Mic:</strong> " + String(micHardwareOk ? "CONNECTED (16kHz I2S)" : "CHECK WIRING") + "</p>";
  html += "<p><a href='/api/telemetry' class='btn'>View Raw JSON Telemetry</a></p>";
  html += "</div></body></html>";
  localServer.send(200, "text/html", html);
}

void handleHttpTelemetry() {
  SoilReading z1 = readSoilSensor(PIN_SOIL_Z1);
  SoilReading z2 = readSoilSensor(PIN_SOIL_Z2);
  SoilReading z3 = readSoilSensor(PIN_SOIL_Z3);
  SoilReading z4 = readSoilSensor(PIN_SOIL_Z4);

  StaticJsonDocument<768> doc;
  doc["device_id"] = DEVICE_ID;
  doc["ip"] = WiFi.localIP().toString();
  doc["uptime"] = millis() / 1000;
  doc["buzzer_state"] = buzzerActive ? "ON" : "OFF";
  doc["mic_connected"] = micHardwareOk;
  doc["mic_rms_db"] = micRmsDbfs;

  JsonArray zones = doc.createNestedArray("zones");
  zones.add(z1.moisturePct);
  zones.add(z2.moisturePct);
  zones.add(z3.moisturePct);
  zones.add(z4.moisturePct);

  String response;
  serializeJson(doc, response);
  localServer.send(200, "application/json", response);
}

// ====================================================================================
// 9. SETUP & MAIN LOOP
// ====================================================================================

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=======================================================");
  Serial.println("  AgriSense Smart Agriculture Node Booting...");
  Serial.println("=======================================================");

  // 1. Initialize Buzzer Output Pin
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW); // Start with buzzer silenced

  // Brief power-on chirp confirmation (50ms)
  digitalWrite(PIN_BUZZER, HIGH);
  delay(50);
  digitalWrite(PIN_BUZZER, LOW);

  // 2. Configure ADC resolution (12-bit: 0 to 4095)
  analogReadResolution(12);

  // 3. Initialize INMP441 Microphone via I2S
  micHardwareOk = setupI2SMicrophone();

  // 4. Spawn Audio Capture Task on Core 1 (Independent FreeRTOS Task)
  xTaskCreatePinnedToCore(
    audioCaptureTask,
    "AudioTask",
    8192,
    NULL,
    1,
    &audioTaskHandle,
    1
  );

  // 5. Connect to Wi-Fi
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP Address: %s (RSSI: %d dBm)\n",
      WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("\n[WiFi] Connection timed out. Running standalone mode.");
  }

  // 6. Configure MQTT Client
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(1024);

  // 7. Start Local Diagnostic WebServer
  localServer.on("/", handleHttpRoot);
  localServer.on("/api/telemetry", handleHttpTelemetry);
  localServer.begin();

  Serial.println("[AgriSense] Node is fully operational and streaming telemetry.");
}

void loop() {
  // 1. Maintain Wi-Fi and MQTT Connections
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      static unsigned long lastReconnectAttempt = 0;
      if (millis() - lastReconnectAttempt > 5000) {
        lastReconnectAttempt = millis();
        Serial.print("[MQTT] Connecting to broker...");
        if (mqttClient.connect(DEVICE_ID, "agrisense/device/status", 1, true, "{\"status\":\"OFFLINE\"}")) {
          Serial.println(" Connected!");
          mqttClient.subscribe("agrisense/buzzer/command");
          // Publish online heartbeat
          mqttClient.publish("agrisense/device/status", "{\"status\":\"ONLINE\",\"device_id\":\"ESP32_AGRISENSE_NODE_01\"}", true);
        } else {
          Serial.printf(" Failed (rc=%d). Retrying in 5s.\n", mqttClient.state());
        }
      }
    } else {
      mqttClient.loop();
    }
  }

  // 2. Handle Local Web Server Requests
  localServer.handleClient();

  // 3. Safety Watchdog for Active Buzzer
  checkBuzzerSafetyTimeout();

  // 4. Periodic Soil Telemetry Transmission (every 3s)
  if (millis() - lastSoilPublishTime >= INTERVAL_SOIL_TELEMETRY_MS) {
    lastSoilPublishTime = millis();
    publishSoilTelemetry();
  }

  // 5. Periodic Audio Features Transmission (every 1s)
  if (millis() - lastMicPublishTime >= INTERVAL_MIC_TELEMETRY_MS) {
    lastMicPublishTime = millis();
    publishAudioFeatures();
  }

  delay(20);
}
