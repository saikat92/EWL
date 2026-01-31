import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { connectMQTT, sendCommand } from "../mqttService";

export default function ConnectionScreen() {
  const [status, setStatus] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    connectMQTT(
      data => {
        console.log("STATUS:", data);
        setStatus(data);
      },
      () => setConnected(true)
    );
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>MQTT: {connected ? "Connected" : "Connecting..."}</Text>

      <Text>State: {status?.state ?? "--"}</Text>
      <Text>Mode: {status?.mode ?? "--"}</Text>

      <Button title="START" onPress={() => sendCommand("start")} />
      <Button title="STOP" onPress={() => sendCommand("stop")} />
      <Button title="EMERGENCY" onPress={() => sendCommand("emergency")} />
    </View>
  );
}
