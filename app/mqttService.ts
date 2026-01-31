import mqtt, { MqttClient } from "mqtt";

let client: MqttClient | null = null;

const BROKER_URL = "wss://test.mosquitto.org:8081/mqtt";

const STATUS_TOPIC = "ecleaning/pi/status";
const COMMAND_TOPIC = "ecleaning/pi/command";

export function connectMQTT(
  onStatus: (data: any) => void,
  onConnected?: () => void
) {
  client = mqtt.connect(BROKER_URL, {
    clientId: "ecleaning_android_" + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 3000
  });

  client.on("connect", () => {
    console.log("MQTT connected");
    client?.subscribe(STATUS_TOPIC);
    onConnected?.();
  });

  client.on("message", (topic, message) => {
    if (topic === STATUS_TOPIC) {
      try {
        const data = JSON.parse(message.toString());
        onStatus(data);
      } catch (e) {
        console.error("Invalid JSON", e);
      }
    }
  });

  client.on("error", err => {
    console.error("MQTT error", err);
  });
}

export function sendCommand(action: string, extra: any = {}) {
  if (!client || !client.connected) return;

  const payload = {
    action,
    source: "android",
    timestamp: Date.now(),
    ...extra
  };

  client.publish(COMMAND_TOPIC, JSON.stringify(payload));
}

export function disconnectMQTT() {
  client?.end();
}
