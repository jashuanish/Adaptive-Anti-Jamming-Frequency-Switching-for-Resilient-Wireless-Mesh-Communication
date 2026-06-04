# Project Context & Scope: Adaptive Anti-Jamming Frequency Optimization

## 1. Project Idea & Overview
In secure military communications, messages must be sent over radio frequency (RF) networks. Adversaries deploy intelligent jammers to block these communications by intentionally injecting high levels of interference across one or multiple frequency bands. 

This project simulates a tactical battlefield network where a **Sender** must transmit a secure message across a network of frequencies (represented as a weighted graph), while an intelligent **Jammer** actively attempts to block the transmission. 

The goal of this project is to apply **Design and Analysis of Algorithms (DAA)** concepts to simulate and compare routing algorithms against jammers, and to introduce novel algorithmic techniques for both sides of the electronic warfare scenario.

## 2. Novel Algorithmic Contributions (Algorithmic Warfare)
To make this project stand out, we are introducing custom algorithms:

### For the Sender (Anti-Jamming)
1. **Predictive Graph-Hopping Algorithm (PGHA)**: Instead of simply choosing the current safest node (Greedy), the PGHA uses a Rolling-Window Dynamic Programming approach. It builds a probability matrix of the jammer's past moves and computes the optimal future path that minimizes the expected interference, predicting where the jammer will strike next and avoiding it proactively.
2. **Error-Correction Word Completion Algorithm**: When a message is sent over a jammed frequency, packets (characters) may be lost. The system implements a predictive Trie-based or Levenshtein-distance word completion algorithm. If the receiver gets "T_RG_T", the algorithm reconstructs the original word "TARGET", ensuring communication integrity despite jamming.

### For the Jammer (Adversary)
1. **Adversarial Min-Max Jammer (AMMJ)**: Turning the tables, we improve the jammer using Game Theory. The jammer calculates the sender's most likely escape routes (edges with lowest switching costs) and targets those specific bottlenecks to trap the sender in high-interference zones, maximizing packet loss.

## 3. Data Flow & Architecture
1. **Simulation Engine (Backend)**: Maintains a dynamic `Graph` of frequency nodes. At every time tick, it updates interference levels via the `Jammer` logic and asks the `Algorithms` module to calculate the next hop for the Sender.
2. **Message Transmission**: The sender transmits a predefined message character by character. If interference exceeds reliability, the character is dropped. The Word Completion Algorithm attempts to reconstruct dropped characters on the receiving end.
3. **Frontend Dashboard**: Polls the `/api/state` endpoint every second to fetch the current graph state, jammed nodes, and algorithm performance. It visually renders the graph and metrics.

## 4. File Structure

```text
/backend/
├── app.py              # Flask API (Endpoints: /api/state, /api/step, /api/override_node)
├── simulation.py       # Core Simulation Engine & Graph Data Structure
├── algorithms.py       # PGHA, Dijkstra, Greedy, DP, A*, Word Completion logic
├── jammer.py           # AMMJ, Random, Sweep, Single, Multi Jamming strategies
└── requirements.txt    # Python dependencies (Flask, Flask-Cors)

/frontend/
├── src/
│   ├── index.css               # Design system, glassmorphism, wave animations
│   ├── App.jsx                 # Main application shell
│   ├── components/
│   │   ├── Dashboard.jsx       # State management and API polling
│   │   ├── NetworkGraph.jsx    # SVG rendering of nodes and wave signals
│   │   ├── MetricsCharts.jsx   # Chart.js visualization of packet loss / cost
│   │   └── ControlPanel.jsx    # User UI to manually jam nodes or set strategies
├── package.json        # Node dependencies (React, Chart.js, Vite)
└── vite.config.js      # Vite configuration
```

## 5. Note to Other Agents
If you are reading this file, you have full context of the project. Do not revert the UI back to simple CSS; the frontend relies heavily on animated SVGs ("Wave Signals") for `NetworkGraph.jsx`. When modifying the simulation logic, ensure that the API contracts in `backend/app.py` remain consistent so the React polling loop in `Dashboard.jsx` does not break.
