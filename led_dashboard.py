from flask import Flask, render_template, request, jsonify
import RPi.GPIO as GPIO

app = Flask(__name__)

# Using BCM numbering (GPIO numbers)
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

# Define LED pins by BCM number
LED1_PIN = 17  # Physical pin 11
LED2_PIN = 18  # Physical pin 12

# Setup pins as output
GPIO.setup(LED1_PIN, GPIO.OUT)
GPIO.setup(LED2_PIN, GPIO.OUT)

# Initially turn off LEDs
GPIO.output(LED1_PIN, GPIO.LOW)
GPIO.output(LED2_PIN, GPIO.LOW)

# Store LED status
led_status = {
    'led1': False,
    'led2': False
}

@app.route('/')
def index():
    return render_template('index.html', status=led_status)

@app.route('/api/led/<led_id>', methods=['POST'])
def control_led(led_id):
    global led_status
    
    if led_id not in ['1', '2']:
        return jsonify({'error': 'Invalid LED ID'}), 400
    
    data = request.get_json()
    if 'status' not in data:
        return jsonify({'error': 'Status not provided'}), 400
    
    status = data['status']
    pin = LED1_PIN if led_id == '1' else LED2_PIN
    
    if status:
        GPIO.output(pin, GPIO.HIGH)
        led_status[f'led{led_id}'] = True
        print(f"LED {led_id} turned ON (GPIO {pin})")
    else:
        GPIO.output(pin, GPIO.LOW)
        led_status[f'led{led_id}'] = False
        print(f"LED {led_id} turned OFF (GPIO {pin})")
    
    return jsonify({'success': True, 'led': led_id, 'status': status})

@app.route('/api/status')
def get_status():
    return jsonify(led_status)

# Clean up on exit
def cleanup():
    GPIO.cleanup()

if __name__ == '__main__':
    try:
        print("Starting LED Control Server")
        print(f"LED 1 connected to GPIO {LED1_PIN} (Physical pin 11)")
        print(f"LED 2 connected to GPIO {LED2_PIN} (Physical pin 12)")
        print("Access the dashboard at: http://127.0.0.1:5000")
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        cleanup()
