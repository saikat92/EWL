import mqtt, { MqttClient } from "mqtt";

let client: MqttClient | null = null;

// WebSocket port — React Native mqtt uses WS, not raw TCP
const BROKER_URL     = "ws://192.168.4.1:9001";
const SNAPSHOT_TOPIC = "eclean/status/snapshot";

const TOPIC_MAP: Record<string, string> = {
  state:     "eclean/control/state",
  speed:     "eclean/control/speed",
  direction: "eclean/control/direction",
  uv:        "eclean/control/uv",
  vegetable: "eclean/control/vegetable",
  duration:  "eclean/control/duration",
  estop:     "eclean/control/estop",
};

// ── Connect ───────────────────────────────────────────────────────────────────
export function connectMQTT(
  onStatus:    (data: PiSnapshot) => void,
  onConnected?: () => void,
  onError?:    (err: string) => void,
) {
  // Destroy stale client
  if (client) {
    try { client.end(true); } catch {}
    client = null;
  }

  console.log(`[MQTT] Connecting to ${BROKER_URL}`);

  client = mqtt.connect(BROKER_URL, {
    clientId:        "ecleaning_android_" + Math.random().toString(16).slice(2, 10),
    clean:           true,
    connectTimeout:  6000,
    reconnectPeriod: 0,        // disable auto-reconnect — we handle it manually
    keepalive:       30,
  });

  client.on("connect", () => {
    console.log("[MQTT] ✓ Connected");
    client?.subscribe(SNAPSHOT_TOPIC, { qos: 1 }, (err) => {
      if (err) console.error("[MQTT] Subscribe error:", err);
      else console.log("[MQTT] Subscribed to", SNAPSHOT_TOPIC);
    });
    // Send handshake so Pi QR screen knows Android is present
    publishRaw("eclean/control/state", { value: "Machine On" });
    onConnected?.();
  });

  client.on("message", (topic, message) => {
    console.log("[MQTT] Message on", topic, ":", message.toString().slice(0, 80));
    if (topic === SNAPSHOT_TOPIC) {
      try {
        const raw    = JSON.parse(message.toString());
        const mapped = mapSnapshot(raw);
        onStatus(mapped);
      } catch (e) {
        console.error("[MQTT] JSON parse error:", e);
      }
    }
  });

  client.on("error", (err) => {
    console.error("[MQTT] Error:", err.message);
    onError?.(err.message);
  });

  client.on("close", () => {
    console.log("[MQTT] Connection closed");
  });

  client.on("offline", () => {
    console.log("[MQTT] Client offline");
  });
}

// ── Send command ──────────────────────────────────────────────────────────────
export function sendCommand(type: keyof typeof TOPIC_MAP, value: any) {
  const topic = TOPIC_MAP[type];
  if (!topic) {
    console.warn(`[MQTT] Unknown command type: "${type}"`);
    return;
  }
  if (!client) {
    console.warn("[MQTT] No client instance");
    return;
  }
  if (!client.connected) {
    console.warn("[MQTT] Client not connected — command dropped:", type, value);
    return;
  }
  const payload = JSON.stringify({ value, timestamp: new Date().toISOString() });
  console.log(`[MQTT] → ${topic}:`, payload);
  client.publish(topic, payload, { qos: 1 });
}

// ── Disconnect ────────────────────────────────────────────────────────────────
export function disconnectMQTT() {
  if (client) {
    try { client.end(true); } catch {}
    client = null;
    console.log("[MQTT] Disconnected");
  }
}

export function isMQTTConnected(): boolean {
  return client?.connected === true;
}

// ── DeviceCommands ────────────────────────────────────────────────────────────
export const DeviceCommands = {
  machineOn:        () => sendCommand("state",     "Machine On"),
  machineOff:       () => sendCommand("state",     "Idle"),
  autoCleaning:     () => sendCommand("state",     "Automatic Cleaning Mode selected"),
  manualCleaning:   () => sendCommand("state",     "Manual Cleaning Mode selected"),
  conveyorStart:    () => sendCommand("state",     "Conveyor Running.."),
  conveyorStop:     () => sendCommand("state",     "Conveyor Stopped"),
  uvOn:             () => sendCommand("uv",        "on"),
  uvOff:            () => sendCommand("uv",        "off"),
  setSpeed:   (rpm: number) => sendCommand("speed",     rpm),
  setForward:       () => sendCommand("direction", "FORWARD"),
  setBackward:      () => sendCommand("direction", "BACKWARD"),
  setVegetable: (v: string) => sendCommand("vegetable", v),
  setDuration:  (s: number) => sendCommand("duration",  s),
  cleaningStart:    () => sendCommand("state",     "Cleaning Started"),
  cleaningComplete: () => sendCommand("state",     "Cleaning completes. Collect Packet"),
  restart:          () => sendCommand("state",     "Restarting system..."),
  estop:            () => sendCommand("estop",     "1"),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PiSnapshot {
  deviceState:       string;
  motorRPM:          number;
  uvActive:          boolean;
  conveyorDirection: string;
  elapsedSeconds:    number;
  targetDuration:    number;
  vegetableType:     string;
  cycleCount:        number;
  wifiConnected:     boolean;
  mqttConnected:     boolean;
  deviceIp:          string;
  cpuTemp:           number;
  lastError:         string | null;
  lastUpdate:        number;
}

function mapSnapshot(raw: any): PiSnapshot {
  return {
    deviceState:       raw.device_state        ?? "Idle",
    motorRPM:          raw.motor_speed_rpm      ?? 0,
    uvActive:          raw.uv_active            ?? false,
    conveyorDirection: raw.conveyor_direction   ?? "STOP",
    elapsedSeconds:    raw.elapsed_seconds      ?? 0,
    targetDuration:    raw.target_duration      ?? 0,
    vegetableType:     raw.vegetable_type       ?? "Not Set",
    cycleCount:        raw.cycle_count          ?? 0,
    wifiConnected:     raw.wifi_connected       ?? false,
    mqttConnected:     raw.mqtt_connected       ?? false,
    deviceIp:          raw.device_ip            ?? "—",
    cpuTemp:           raw.cpu_temp             ?? 0,
    lastError:         raw.last_error           ?? null,
    lastUpdate:        Date.now(),
  };
}

function publishRaw(topic: string, payload: object) {
  if (!client?.connected) return;
  client.publish(topic, JSON.stringify(payload), { qos: 1 });
}