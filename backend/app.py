from flask import Flask, jsonify, request
from flask_cors import CORS
from simulation import SimulationEngine

app = Flask(__name__)
CORS(app)

sim = SimulationEngine()

@app.route('/api/state', methods=['GET'])
def get_state():
    return jsonify(sim.get_state())

@app.route('/api/step', methods=['POST'])
def step():
    sim.running = True
    sim.step()
    return jsonify(sim.get_state())

@app.route('/api/reset', methods=['POST'])
def reset():
    sim.reset_states()
    return jsonify(sim.get_state())

@app.route('/api/set_route', methods=['POST'])
def set_route():
    data = request.json
    source = data.get('source')
    target = data.get('target')
    if source and target:
        sim.set_route(source, target)
    return jsonify(sim.get_state())

@app.route('/api/toggle_jam', methods=['POST'])
def toggle_jam():
    data = request.json
    freq = data.get('freq')
    is_jammed = data.get('is_jammed')
    sim.jammer.toggle_freq(freq, is_jammed)
    return jsonify(sim.get_state())

@app.route('/api/toggle_dynamic_jammer', methods=['POST'])
def toggle_dynamic_jammer():
    data = request.json
    enabled = data.get('enabled')
    sim.jammer.set_dynamic_mode(enabled)
    return jsonify(sim.get_state())

if __name__ == '__main__':
    app.run(debug=True, port=5000)
