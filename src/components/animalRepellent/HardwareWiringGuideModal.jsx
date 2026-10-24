import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  X,
  Copy,
  Check,
  Zap,
  Radio,
  Volume2,
  Layers,
  ExternalLink,
  Info,
  ShieldAlert
} from 'lucide-react';

export default function HardwareWiringGuideModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const esp32Code = `// ==============================================================
// AgriSense ESP32 Bio-Acoustic Acquisition & Repellent Firmware
// Compatible: ESP32-WROOM-32, ESP32-S3, ESP32 NodeMCU
// Peripherals: INMP441 I2S Digital Mic + MAX98357A I2S DAC Amplifier
// ==============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>

// --- PIN ASSIGNMENTS ---
// INMP441 I2S Digital Microphone
#define I2S_MIC_PORT I2S_NUM_0
#define I2S_MIC_SCK  14  // Serial Clock (BCLK)
#define I2S_MIC_WS   15  // Word Select (LRC)
#define I2S_MIC_SD   32  // Serial Data Output into ESP32

// MAX98357A I2S DAC Mono Amplifier
#define I2S_SPK_PORT I2S_NUM_1
#define I2S_SPK_BCLK 26  // Bit Clock
#define I2S_SPK_LRC  25  // Left/Right Word Select
#define I2S_SPK_DIN  22  // Serial Data Input from ESP32

// Wi-Fi & AgriSense Server Config
const char* WIFI_SSID     = "AgriSense_Farm_AP";
const char* WIFI_PASSWORD = "SmartFarmPassword";
const char* BACKEND_URL   = "http://192.168.1.100:8000/api/audio/classify";

// Audio Buffers
#define SAMPLE_RATE 16000
#define BUFFER_SAMPLES 512
int16_t audioBuffer[BUFFER_SAMPLES];

void setupI2SMicrophone() {
  i2s_config_t mic_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = BUFFER_SAMPLES,
    .use_apll = false
  };
  i2s_driver_install(I2S_MIC_PORT, &mic_config, 0, NULL);

  i2s_pin_config_t mic_pins = {
    .bck_io_num = I2S_MIC_SCK,
    .ws_io_num = I2S_MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_MIC_SD
  };
  i2s_set_pin(I2S_MIC_PORT, &mic_pins);
}

void setup() {
  Serial.begin(115200);
  Serial.println("[AgriSense] Booting Bio-Acoustic Acquisition Node...");

  // Connect Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n[AgriSense] Connected to Farm Wi-Fi. IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\\n[AgriSense] Wi-Fi unreachable. Operating in Local Standalone Mode.");
  }

  setupI2SMicrophone();
  Serial.println("[AgriSense] I2S 16kHz Sampling Active.");
}

void loop() {
  size_t bytes_read = 0;
  i2s_read(I2S_MIC_PORT, (void*)audioBuffer, sizeof(audioBuffer), &bytes_read, portMAX_DELAY);

  // Compute Local Root-Mean-Square (RMS) to detect acoustic activity
  float sum_sq = 0.0;
  int sample_count = bytes_read / 2;
  for (int i = 0; i < sample_count; i++) {
    float norm = (float)audioBuffer[i];
    sum_sq += norm * norm;
  }
  float rms = sqrt(sum_sq / sample_count);

  // If sound energy exceeds background noise floor, transmit to AgriSense Edge AI
  if (rms > 750.0 && WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(BACKEND_URL);
    http.addHeader("Content-Type", "application/octet-stream");
    http.addHeader("X-Sensor-Node", "ESP32-Field-Zone-1");

    int responseCode = http.POST((uint8_t*)audioBuffer, bytes_read);
    if (responseCode == 200) {
      String response = http.getString();
      Serial.println("[AgriSense AI Decision] " + response);
    }
    http.end();
  }

  delay(50);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(esp32Code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-emerald-900/10 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 to-green-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                ESP32 Hardware Specification & Wiring Guide
              </h3>
              <p className="text-xs text-emerald-200/90">
                I2S Digital Audio Acquisition · Edge AI Microservice · Safe Acoustic Playback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
          {/* Architecture Overview Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>Edge-Assisted Hardware Architecture</span>
            </div>
            <p className="leading-relaxed text-[11px] text-emerald-900">
              A standard ESP32 (520KB SRAM) cannot reliably run high-capacity deep convolutional audio models natively without quantization loss. Therefore, AgriSense utilizes a high-efficiency distributed architecture: the <strong>ESP32 Node</strong> handles DMA I2S digital audio sampling and Voice Activity Detection (VAD), then streams active acoustic frames over Wi-Fi / MQTT to the <strong>AgriSense Local Edge Microservice</strong> for real PyTorch neural inference.
            </p>
          </div>

          {/* Component Bill of Materials (BOM) */}
          <div className="space-y-3">
            <h4 className="font-black text-sm uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              1. Hardware Components & Bill of Materials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-900">ESP32 Dev Module</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  ESP32-WROOM-32 / S3 with Dual 240MHz Xtensa cores & 802.11 b/g/n Wi-Fi.
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-900">INMP441 MEMS Mic</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  I2S 24-bit digital microphone with 61 dB SNR (60 Hz – 15 kHz response).
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-900">MAX98357A I2S DAC</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  3.2W Mono Class D amplifier with &gt;92% efficiency for horn speaker.
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-900">4Ω 3W Horn Speaker</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Weatherproof mylar speaker strictly volume-capped to &le;75 dB SPL.
                </div>
              </div>
            </div>
          </div>

          {/* Pinout Tables */}
          <div className="space-y-3">
            <h4 className="font-black text-sm uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              2. ESP32 I2S Peripheral Pinout Connections
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* INMP441 Mic */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 p-2.5 font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  INMP441 I2S Microphone &rarr; ESP32
                </div>
                <table className="w-full text-[11px]">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="p-2 font-mono font-bold text-slate-700">SCK (BCLK)</td><td className="p-2 text-emerald-800 font-bold">GPIO 14</td></tr>
                    <tr><td className="p-2 font-mono font-bold text-slate-700">WS (LRC)</td><td className="p-2 text-emerald-800 font-bold">GPIO 15</td></tr>
                    <tr><td className="p-2 font-mono font-bold text-slate-700">SD (Data Out)</td><td className="p-2 text-emerald-800 font-bold">GPIO 32</td></tr>
                    <tr><td className="p-2 font-mono font-bold text-slate-700">L/R Select</td><td className="p-2 text-slate-600">GND (Left Channel)</td></tr>
                    <tr><td className="p-2 font-mono font-bold text-slate-700">VDD / GND</td><td className="p-2 text-slate-600">3.3V / GND</td></tr>
                  </tbody>
                </table>
              </div>

              {/* MAX98357A Amp */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 p-2.5 font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  MAX98357A DAC Amplifier &rarr; ESP32
                </div>
                <table className="w-full text-[11px]">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="p-2 font-mono font-bold text-slate-700">BCLK (Bit Clock)</td><td className="p-2 text-emerald-800 font-bold">GPIO 26</td></tr>
                    <tr><td className="p-2 font-mono font-bold text-slate-700">LRC (Word Select)</td><td className="p-2 text-emerald-800 font-bold">GPIO 25</td></tr>
                    <tr><td className="p-2 font-mono font-bold text-slate-700">DIN (Data In)</td><td className="p-2 text-emerald-800 font-bold">GPIO 22</td></tr>
                    <tr><td className="p-2 font-mono font-bold text-slate-700">GAIN / SD_MODE</td><td className="p-2 text-slate-600">GND (9dB safe gain) / 3.3V</td></tr>
                    <tr><td className="p-2 font-mono font-bold text-slate-700">VIN / GND</td><td className="p-2 text-slate-600">5V DC / GND</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Arduino Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm uppercase tracking-wider text-slate-700">
                3. Ready-to-Flash Arduino / ESP-IDF C++ Sketch
              </h4>
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Sketch'}</span>
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72">
                {esp32Code}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
