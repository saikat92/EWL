// mqttService.ts
import mqtt, { MqttClient } from "mqtt";

let client: MqttClient | null = null;

const BROKER_URL  = "mqtt://192.168.4.1:1883";
const SNAPSHOT_TOPIC = "eclean/status/snapshot";

// ── Topic map: command name → Pi topic ──────────────────────────────────────
const TOPIC_MAP: Record<string, string> = {
  state:     "eclean/control/state",
  speed:     "eclean/control/speed",
  direction: "eclean/control/direction",
  uv:        "eclean/control/uv",
  vegetable: "eclean/control/vegetable",
  duration:  "eclean/control/duration",
  estop:     "eclean/control/estop",
};

// ── Connect ──────────────────────────────────────────────────────────────────
export function connectMQTT(
  onStatus: (data: PiSnapshot) => void,
  onConnected?: () => void
) {
  if (client?.connected) return;

  client = mqtt.connect(BROKER_URL, {
    clientId: "ecleaning_android_" + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 3000,
  });

  client.on("connect", () => {
    console.log("[MQTT] Connected to broker");
    // Subscribe to Pi status snapshots
    client?.subscribe(SNAPSHOT_TOPIC, (err) => {
      if (err) console.error("[MQTT] Subscribe error:", err);
    });
    // Send a handshake so Pi QR screen advances immediately
    publishRaw("eclean/control/state", { value: "Machine On" });
    onConnected?.();
  });

  client.on("message", (topic, message) => {
    if (topic === SNAPSHOT_TOPIC) {
      try {
        const raw = JSON.parse(message.toString());
        // Map Pi field names → app field names
        const mapped: PiSnapshot = mapSnapshot(raw);
        onStatus(mapped);
      } catch (e) {
        console.error("[MQTT] Bad JSON:", e);
      }
    }
  });

  client.on("error", (err) => console.error("[MQTT] Error:", err));
  client.on("close", () => console.log("[MQTT] Connection closed"));
}

// ── Send typed command to correct Pi topic ───────────────────────────────────
export function sendCommand(type: keyof typeof TOPIC_MAP, value: any) {
  const topic = TOPIC_MAP[type];
  if (!topic) {
    console.warn(`[MQTT] Unknown command type: ${type}`);
    return;
  }
  publishRaw(topic, { value, timestamp: new Date().toISOString() });
}

// ── Convenience commands ─────────────────────────────────────────────────────
export const DeviceCommands = {
  machineOn:        () => sendCommand("state",     "Machine On"),
  machineOff:       () => sendCommand("state",     "Idle"),
  autoCleaning:     () => sendCommand("state",     "Automatic Cleaning Mode selected"),
  manualCleaning:   () => sendCommand("state",     "Manual Cleaning Mode selected"),
  conveyorStart:    () => sendCommand("state",     "Conveyor Running.."),
  conveyorStop:     () => sendCommand("state",     "Conveyor Stopped"),
  uvOn:             () => sendCommand("uv",        "on"),
  uvOff:            () => sendCommand("uv",        "off"),
  setSpeed:   (rpm: number) => sendCommand("speed", rpm),
  setForward:       () => sendCommand("direction", "FORWARD"),
  setBackward:      () => sendCommand("direction", "BACKWARD"),
  setVegetable: (v: string) => sendCommand("vegetable", v),
  setDuration: (s: number) => sendCommand("duration", s),
  cleaningStart:    () => sendCommand("state",     "Cleaning Started"),
  cleaningComplete: () => sendCommand("state",     "Cleaning completes. Collect Packet"),
  restart:          () => sendCommand("state",     "Restarting system..."),
  estop:            () => sendCommand("estop",     "1"),
};

export function disconnectMQTT() {
  client?.end();
  client = null;
}

// ── Internal ─────────────────────────────────────────────────────────────────
function publishRaw(topic: string, payload: object) {
  if (!client?.connected) {
    console.warn("[MQTT] Not connected — cannot publish");
    return;
  }
  client.publish(topic, JSON.stringify(payload), { qos: 1 });
}

// ── Type: what Pi actually sends ─────────────────────────────────────────────
export interface PiSnapshot {
  // Mapped (app-friendly) names
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

// Map Pi snake_case → app camelCase
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