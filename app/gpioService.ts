// api.ts
const BASE_URL = 'http://192.168.10.6:5000'; // Replace with your RPi IP

export const API = {
  async getStatus() {
    try {
      const response = await fetch(`${BASE_URL}/api/status`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching status:', error);
      throw error;
    }
  },

  async controlConveyor(action: string, speed?: number) {
    try {
      const response = await fetch(`${BASE_URL}/api/control/conveyor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, speed }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error controlling conveyor:', error);
      throw error;
    }
  },

  async controlUVLight(action: string) {
    try {
      const response = await fetch(`${BASE_URL}/api/control/uv_light`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error controlling UV light:', error);
      throw error;
    }
  },

  async emergencyStop() {
    try {
      const response = await fetch(`${BASE_URL}/api/control/emergency_stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Error with emergency stop:', error);
      throw error;
    }
  },

  async resetSystem() {
    try {
      const response = await fetch(`${BASE_URL}/api/control/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Error resetting system:', error);
      throw error;
    }
  },
};