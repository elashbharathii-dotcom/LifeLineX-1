#include <Wire.h>
#include <MPU6050_light.h>

MPU6050 mpu(Wire);

float roll, pitch, yaw;

void setup() {
  Serial.begin(115200);  // Start serial communication

  Wire.begin(21, 22);    // ESP32: SDA = GPIO 21, SCL = GPIO 22

  byte status = mpu.begin();  // Initialize MPU6050

  if (status != 0) {
    Serial.print("MPU6050 initialization failed. Status: ");
    Serial.println(status);

    while (1) {
      delay(100);
    }
  }

  Serial.println("MPU6050 connected.");

  delay(1000);

  Serial.println("Keep MPU6050 STILL - calibrating...");
  mpu.calcOffsets();      // Keep sensor STILL during calibration
  Serial.println("Calibration complete.");
}

void loop() {
  mpu.update();           // Read latest sensor values

  roll  = mpu.getAngleX();
  pitch = mpu.getAngleY();
  yaw   = mpu.getAngleZ();

  // Send values over USB as: roll,pitch,yaw
  Serial.print(roll);
  Serial.print(',');

  Serial.print(pitch);
  Serial.print(',');

  Serial.println(yaw);

  delay(10);              // Wait 10ms before next reading
}