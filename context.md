# Project Context: Tactical Mesh Network Simulator

## Concept
In military operations, messages are sent over radio signals. Enemy jammers can block one or more frequencies. We are simulating a resilient mesh network that actively dodges these jammed frequencies to deliver critical data. 

## The Unique Twist
To make this project unique, highly visual, and scientifically accurate:
1. **Dynamic Edge-Specific Jamming**: Jammers don't blanket an entire map perfectly. Our jammer actively scrambles specific frequencies on specific physical links between nodes. 
2. **Blind Trial-and-Error**: The sender does NOT magically know which frequencies are jammed. It must attempt a transmission, detect a failure (a simulated dropped packet / missing ACK), and rapidly hop to a new frequency on that same link to try again.
3. **Word Completion Algorithm**: If a transmission fails entirely across all 5 frequencies, the character is officially dropped. The receiving end uses a Levenshtein distance word-completion algorithm to guess the missing letters and reconstruct the data payload.

## Data Flow
1. **Routing**: The user selects a Source and Target host. The Python backend calculates the shortest path (e.g., H1 -> H2 -> H4 -> H7) across a 9-node mesh network using the A* algorithm.
2. **Jamming**: The AI Jammer continuously randomizes interference matrices for every single physical edge `(n1, n2): {F1: True, F2: False...}`.
3. **Transmission**: The backend ticks every 800ms. On each tick, the packet blindly attempts an untried frequency on its current link. If clear, it successfully hops to the next node. If jammed, it bounces back and tries a new frequency on the next tick.
4. **Visualization**: The React frontend polls the backend and renders two distinct visual layers:
   - *Layer 1 (Macro)*: The 9-node physical mesh and shortest path, complete with pulsing active connections.
   - *Layer 2 (Micro)*: A linear, unrolled wide-area view of the active path, showing the 5 frequency channels for every link, with the packet physically bouncing off jammed channels or shooting across clear ones using dynamic CSS keyframes.
