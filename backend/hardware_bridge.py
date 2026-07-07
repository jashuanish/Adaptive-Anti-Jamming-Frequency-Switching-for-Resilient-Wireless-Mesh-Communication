"""
Hardware Bridge — Socket.IO server that relays serial/MQTT data to the browser.

Usage:
  python hardware_bridge.py                  # runs on port 5001
  SERIAL_PORT=COM3 python hardware_bridge.py # auto-connect to serial

Frontend connects via:
  import { connectSocket } from './lib/hardware'
  const s = connectSocket('http://localhost:5001')
  s.on('sensor_data', (d) => console.log(d))
"""
import os, threading, time, json
import eventlet
eventlet.monkey_patch()

import socketio
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
sio = socketio.Server(cors_allowed_origins='*', async_mode='eventlet')
wsgi_app = socketio.WSGIApp(sio, app)

# ── Serial thread ────────────────────────────────────────────────────────────

def serial_reader(port_name, baud=9600):
    """Read lines from serial port and broadcast to all clients."""
    try:
        import serial
        port = serial.Serial(port_name, baud, timeout=1)
        print(f'[serial] connected to {port_name} @ {baud}')
        while True:
            line = port.readline().decode('utf-8', errors='replace').strip()
            if line:
                sio.emit('sensor_data', {'source': 'serial', 'raw': line, 'ts': time.time()})
    except Exception as e:
        print(f'[serial] error: {e}')

# ── MQTT bridge ──────────────────────────────────────────────────────────────

def start_mqtt_bridge(broker='localhost', port=1883, topics=('#',)):
    try:
        import paho.mqtt.client as mqtt

        def on_message(client, userdata, msg):
            try:
                payload = json.loads(msg.payload)
            except Exception:
                payload = msg.payload.decode('utf-8', errors='replace')
            sio.emit('sensor_data', {'source': 'mqtt', 'topic': msg.topic, 'payload': payload, 'ts': time.time()})

        client = mqtt.Client()
        client.on_message = on_message
        client.connect(broker, port, 60)
        for topic in topics:
            client.subscribe(topic)
        client.loop_start()
        print(f'[mqtt] connected to {broker}:{port}')
    except Exception as e:
        print(f'[mqtt] error: {e}')

# ── Socket.IO events ─────────────────────────────────────────────────────────

@sio.event
def connect(sid, environ):
    print(f'[ws] client connected: {sid}')
    sio.emit('status', {'connected': True}, to=sid)

@sio.event
def disconnect(sid):
    print(f'[ws] client disconnected: {sid}')

@sio.on('command')
def handle_command(sid, data):
    """Receive a command from the browser and forward to hardware."""
    print(f'[cmd] {data}')
    # Add your serial write or MQTT publish here
    sio.emit('command_ack', {'ok': True, 'echo': data})

# ── Simulation emitter (demo when no real hardware) ──────────────────────────

def simulate_sensor():
    import math, random
    t = 0
    while True:
        eventlet.sleep(0.1)
        t += 0.1
        sio.emit('sensor_data', {
            'source': 'sim',
            'ts': time.time(),
            'values': {
                'signal': math.sin(t) * 50 + 50 + random.uniform(-2, 2),
                'noise': random.uniform(0, 30),
                'rssi': -40 - abs(math.sin(t * 0.3)) * 30,
            }
        })

if __name__ == '__main__':
    serial_port = os.environ.get('SERIAL_PORT')
    if serial_port:
        threading.Thread(target=serial_reader, args=(serial_port,), daemon=True).start()
    else:
        print('[bridge] No SERIAL_PORT set — running sensor simulation')
        eventlet.spawn(simulate_sensor)

    mqtt_broker = os.environ.get('MQTT_BROKER')
    if mqtt_broker:
        start_mqtt_bridge(broker=mqtt_broker)

    print('[bridge] Starting hardware bridge on http://localhost:5001')
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5001)), wsgi_app)
