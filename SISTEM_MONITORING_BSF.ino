#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <Preferences.h>
#include <ArduinoJson.h>

// ======================
// Konfigurasi WiFi & MQTT
// ======================
const char* ssid = "Adesukma";
const char* password = "25354555";
const char* mqtt_server = "192.168.100.6"; // Ganti dengan IP Broker Mosquitto Anda
const int mqtt_port = 1883;

// ======================
// Pin Sensor
// ======================
#define DHTPIN 4
#define DHTTYPE DHT11
#define LDR_ANALOG 34

// ======================
// Pin Output
// ======================
#define LED_MERAH 25
#define LED_HIJAU 26
#define BUZZER 27

// device name
#define DEVICE_ID "BSF-001"
#define TOPIC_CONFIG  "threshold/config/" DEVICE_ID

// ======================
// Inisialisasi Objek
// ======================
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// ======================
// Variabel Global
// ======================
float suhu = 0;
float kelembapan = 0;
float lightIntensity = 0.0;
bool dhtError = false;

// Variabel Threshold (Bisa diupdate via MQTT)
float tempWarn = 30.0;
float tempCrit = 32.0;
float humidWarn = 60.0;
float humidCrit = 50.0;
float lightWarn = 30.0;
float lightCrit = 50.0;

Preferences preferences;

// Variabel Waktu (millis)
unsigned long lastSensorReadTime = 0;
unsigned long lastLcdUpdateTime = 0;
unsigned long lastMqttPublishTime = 0;

const long sensorReadInterval = 2000;  // Baca sensor tiap 2 detik
const long lcdUpdateInterval = 2000;   // Update LCD tiap 2 detik bergantian
const long mqttPublishInterval = 5000; // Kirim MQTT tiap 5 detik

int lcdState = 0; // 0 = Tampil Suhu/Kelembaban, 1 = Tampil Cahaya

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Pesan tiba di topik: ");
  Serial.println(topic);

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.c_str());
    return;
  }

  // Update variabel jika key tersedia di JSON
  if (doc.containsKey("temp_warning")) tempWarn = doc["temp_warning"];
  if (doc.containsKey("temp_critical")) tempCrit = doc["temp_critical"];
  if (doc.containsKey("humid_warning")) humidWarn = doc["humid_warning"];
  if (doc.containsKey("humid_critical")) humidCrit = doc["humid_critical"];
  if (doc.containsKey("light_warning")) lightWarn = doc["light_warning"];
  if (doc.containsKey("light_critical")) lightCrit = doc["light_critical"];

  // Simpan ke NVS
  preferences.begin("thresholds", false);
  preferences.putFloat("tempWarn", tempWarn);
  preferences.putFloat("tempCrit", tempCrit);
  preferences.putFloat("humidWarn", humidWarn);
  preferences.putFloat("humidCrit", humidCrit);
  preferences.putFloat("lightWarn", lightWarn);
  preferences.putFloat("lightCrit", lightCrit);
  preferences.end();

  Serial.println("Thresholds diperbarui dan disimpan.");
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop terus sampai terhubung kembali
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // Mencoba Connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      // Berlangganan menggunakan macro TOPIC_CONFIG yang sudah didefinisikan di atas
      client.subscribe(TOPIC_CONFIG);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  // Load Preferences
  preferences.begin("thresholds", true); // read-only mode
  tempWarn = preferences.getFloat("tempWarn", 30.0);
  tempCrit = preferences.getFloat("tempCrit", 32.0);
  humidWarn = preferences.getFloat("humidWarn", 60.0);
  humidCrit = preferences.getFloat("humidCrit", 50.0);
  lightWarn = preferences.getFloat("lightWarn", 30.0);
  lightCrit = preferences.getFloat("lightCrit", 50.0);
  preferences.end();

  // I2C ESP32 (SDA, SCL)
  Wire.begin(21, 22);

  // LCD
  lcd.init();
  lcd.backlight();

  // DHT11
  dht.begin();

  // Output LED dan buzzer
  pinMode(LED_MERAH, OUTPUT);
  pinMode(LED_HIJAU, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  digitalWrite(LED_MERAH, LOW);
  digitalWrite(LED_HIJAU, LOW);
  digitalWrite(BUZZER, LOW);

  lcd.setCursor(0, 0);
  lcd.print("Memulai Sistem");
  lcd.setCursor(0, 1);
  lcd.print("Connecting...");
  
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  lcd.clear();
}

void loop() {
  // Jaga koneksi MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long currentMillis = millis();

  // ==========================================
  // 1. Baca Sensor dan Logika Threshold Lokal
  // ==========================================
  if (currentMillis - lastSensorReadTime >= sensorReadInterval) {
    lastSensorReadTime = currentMillis;

    suhu = dht.readTemperature();
    kelembapan = dht.readHumidity();
    int rawLDR = analogRead(LDR_ANALOG);
    lightIntensity = ((4095.0 - rawLDR) / 4095.0) * 100.0;

    if (isnan(suhu) || isnan(kelembapan)) {
      dhtError = true;
      Serial.println("Gagal membaca sensor DHT11!");
    } else {
      dhtError = false;
      
      // Logika Alert Independen (Kritikal: terlalu panas, terlalu kering, atau terlalu terang)
      if (suhu > tempCrit || kelembapan < humidCrit || lightIntensity > lightCrit) {
        digitalWrite(LED_MERAH, HIGH);
        digitalWrite(BUZZER, HIGH);
        digitalWrite(LED_HIJAU, LOW);
      } else {
        digitalWrite(LED_MERAH, LOW);
        digitalWrite(BUZZER, LOW);
        digitalWrite(LED_HIJAU, HIGH);
      }
    }
  }

  // ==========================================
  // 2. Update Layar LCD Bergantian
  // ==========================================
  if (currentMillis - lastLcdUpdateTime >= lcdUpdateInterval) {
    lastLcdUpdateTime = currentMillis;
    lcd.clear();

    if (dhtError) {
      lcd.setCursor(0, 0);
      lcd.print("DHT11 Error");
      lcd.setCursor(0, 1);
      lcd.print("Cek Kabel");
    } else {
      if (lcdState == 0) {
        // Tampilan 1: Suhu & Kelembaban
        lcd.setCursor(0, 0);
        lcd.print("Suhu: ");
        lcd.print(suhu, 1);
        lcd.print("C");
        
        lcd.setCursor(0, 1);
        lcd.print("Kelembaban: ");
        lcd.print(kelembapan, 0);
        lcd.print("%");
        
        lcdState = 1; // Ganti ke state berikutnya
      } else {
        // Tampilan 2: Intensitas Cahaya
        lcd.setCursor(0, 0);
        lcd.print("Cahaya Maggot");
        
        lcd.setCursor(0, 1);
        lcd.print("Intensitas: ");
        lcd.print(lightIntensity, 0);
        lcd.print("%");
        
        lcdState = 0; // Kembali ke state awal
      }
    }
  }

  // ==========================================
  // 3. Kirim Payload JSON via MQTT (Setiap 5 dtk)
  // ==========================================
  if (currentMillis - lastMqttPublishTime >= mqttPublishInterval) {
    lastMqttPublishTime = currentMillis;

    if (!dhtError) {
      // Perbaikan String JSON: Menggunakan format yang valid dengan DEVICE_ID
      String payload = "{";
      payload += "\"unique_code\": \"" DEVICE_ID "\", ";
      payload += "\"temperature\": " + String(suhu, 1) + ", ";
      payload += "\"humidity\": " + String(kelembapan, 0) + ", ";
      payload += "\"light_intensity\": " + String(lightIntensity, 1);
      payload += "}";

      Serial.print("Publish pesan: ");
      Serial.println(payload);
      
      // Publish ke topik "sensor/data"
      client.publish("sensor/data", payload.c_str());
    }
  }
}