#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// ======================
// Konfigurasi WiFi & MQTT
// ======================
const char* ssid = "realme 8i";
const char* password = "11111111";
const char* mqtt_server = "10.41.129.43"; // Ganti dengan IP Broker Mosquitto Anda
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
int nilaiLDR = 0;
bool dhtError = false;

// Variabel Waktu (millis)
unsigned long lastSensorReadTime = 0;
unsigned long lastLcdUpdateTime = 0;
unsigned long lastMqttPublishTime = 0;

const long sensorReadInterval = 2000; // Baca sensor tiap 2 detik
const long lcdUpdateInterval = 2000;  // Update LCD tiap 2 detik bergantian
const long mqttPublishInterval = 5000; // Kirim MQTT tiap 5 detik

int lcdState = 0; // 0 = Tampil Suhu/Kelembaban, 1 = Tampil Cahaya

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
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Tunggu 5 detik sebelum mencoba lagi
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  // I2C ESP32
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
    nilaiLDR = analogRead(LDR_ANALOG);

    if (isnan(suhu) || isnan(kelembapan)) {
      dhtError = true;
      Serial.println("Gagal membaca sensor DHT11!");
    } else {
      dhtError = false;
      
      // Logika Alert Independen sesuai PRD
      // Suhu > 32 °C ATAU Kelembaban < 50 % -> Aktifkan Alarm
      if (suhu > 32.0 || kelembapan < 50.0 || nilaiLDR < 2000) {
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
        lcd.print("Intensitas Cahaya");
        
        lcd.setCursor(0, 1);
        lcd.print("ADC: ");
        lcd.print(nilaiLDR);
        
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
      // Bentuk JSON sesuai PRD dengan penambahan unique_code
      String payload = "{";
      payload += "\"unique_code\": \"BSF-001\", ";
      payload += "\"temperature\": " + String(suhu, 1) + ", ";
      payload += "\"humidity\": " + String(kelembapan, 0) + ", ";
      payload += "\"light_intensity\": " + String(nilaiLDR);
      payload += "}";

      Serial.print("Publish pesan: ");
      Serial.println(payload);
      
      // Publish ke topik "sensor/data"
      client.publish("sensor/data", payload.c_str());
    }
  }
}