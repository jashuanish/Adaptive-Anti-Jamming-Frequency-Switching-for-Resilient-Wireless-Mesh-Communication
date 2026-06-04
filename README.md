# Tactical Mesh Network & Frequency Hopping Simulator

A military-grade simulation of a dynamic mesh network under active signal jamming attacks. This project visualizes macro-routing across a battlefield mesh and micro-frequency hopping on specific node-to-node links.

## Key Features
- **Macro Routing (A* Algorithm)**: Automatically calculates the shortest path between any two hosts in a 9-node mesh network.
- **Edge-Specific AI Jamming**: An intelligent jammer independently scrambles frequencies on every physical link. What's clear between Host 1 and 2 might be blocked between Host 2 and 4.
- **Blind Trial-and-Error Hopping**: The sender does not have a priori knowledge of the jammer's state. It must blindly test frequencies on a link, bounce back if jammed, and try again, simulating realistic military signal transmission.
- **Auto-Correction**: Drops jammed packets and uses Levenshtein distance algorithms to reconstruct corrupted messages on the receiving end.
- **Tactical UI**: A dark, glowing, radar-style military dashboard for comprehensive situational awareness.

## Running the Application
1. **Start Backend**: `cd backend && python app.py` (Runs Flask on port 5000)
2. **Start Frontend**: `cd frontend && npm run dev` (Runs Vite on port 5173)

## Architecture
- **Backend**: Python/Flask engine simulating ticks, A* routing, and AI Jammer logic.
- **Frontend**: React/Vite with dynamic CSS keyframe animations to visualize physical packet hops.
