# Comprehensive Project Report
**Project Title:** Tactical Mesh Network & Frequency Hopping Simulator: A Dual-Layer Approach to Electronic Counter-Countermeasures (ECCM)

---

## 1. Abstract
In modern military and tactical operations, secure and resilient communication is a critical requirement. Adversaries frequently employ electronic warfare (EW) tactics, specifically signal jamming, to disrupt data transmission. This project presents a highly realistic simulation of a resilient mesh network that actively mitigates dynamic signal jamming. 

By combining macro-level network routing (A* algorithm) with micro-level frequency hopping (blind trial-and-error state machines) and payload reconstruction (Levenshtein distance), this simulator provides a scientifically accurate model of dynamic electronic counter-countermeasures (ECCM). Unlike traditional simulators that provide the sender with omniscient knowledge of the jammer's state, this project introduces a "blind" trial-and-error mechanism, heavily emphasizing the novelty of edge-specific, dynamic AI jamming.

---

## 2. Introduction
### 2.1 Problem Statement
Traditional communication networks rely on static frequencies or predefined backup channels. In a highly contested electronic warfare environment, jammers can dynamically blanket multiple frequencies, causing severe packet loss and communication blackouts. Existing simulations and academic projects often oversimplify this scenario by assuming the sender possesses *a priori* knowledge of the jammer's state—allowing the sender to perfectly avoid jammed frequencies. This is highly unrealistic in real-world theater operations, where a sender only discovers a frequency is jammed upon transmission failure.

### 2.2 Motivation
The motivation behind this project is to bridge the gap between theoretical network simulations and real-world tactical environments. By building a system where the sender must actively "probe" the network to find open channels, the project demonstrates the true complexities of designing resilient communication algorithms.

### 2.3 Objectives
1. To simulate a multi-hop mesh network capable of dynamic routing.
2. To introduce an Edge-Specific AI Jammer that independently scrambles frequencies on every physical link.
3. To implement a "blind" trial-and-error transmission algorithm that dynamically adapts to jamming without prior knowledge.
4. To implement error-correction algorithms capable of reconstructing dropped packets.
5. To provide a rich, military-grade visual dashboard for situational awareness and data monitoring.

---

## 3. Novelty & Proposed System
### 3.1 Existing Systems vs. Proposed System
- **Existing Systems:** Often utilize global jamming (if Frequency 1 is jammed, it is jammed everywhere on the map). Senders usually route around jammed frequencies instantly, implying perfect knowledge of the enemy jammer.
- **Proposed System (The Novelty):** 
  - **Edge-Specific Jamming:** The jammer targets specific physical links. Frequency 1 might be completely blocked between Node A and Node B, but entirely clear between Node B and Node C.
  - **Blind Trial-and-Error:** The sender does not know what is jammed. It must physically attempt a transmission on a frequency. If it fails (simulating a missing Acknowledgement/ACK), the algorithm records a failure and retries a different frequency on the same link.

---

## 4. System Architecture
The project is built on a decoupled, dual-layer architecture separating the heavy algorithmic logic from the dynamic visual rendering.

### 4.1 Backend (Simulation Engine)
- **Framework:** Python / Flask
- **Role:** Acts as the brain of the simulation. It maintains the physical topology of the mesh network, manages the AI jammer matrix, calculates routes, and executes the simulation tick-by-tick.
- **Data State:** Maintains a JSON-serializable state machine pushed to the frontend on every tick, containing current packet location, attempted frequencies, and packet loss metrics.

### 4.2 Frontend (Tactical UI)
- **Framework:** React.js / Vite / Vanilla CSS
- **Role:** Polls the backend every 800ms and renders a highly dynamic, military-grade radar interface. 
- **Animation:** Uses CSS keyframe animations (`hopSuccess`, `hopFail`) triggered by React keys to visualize the physical movement and bouncing of packets across the network.

---

## 5. Algorithmic Implementations
The resilience of the network is achieved through four primary algorithmic layers working in tandem.

### 5.1 Macro-Routing (A* Search Algorithm)
- **Purpose:** Geographical routing of the signal across the battlefield.
- **Implementation:** The network consists of a 9-node physical mesh with weighted edges. When a user defines a Source (e.g., H1) and Target (e.g., H9), the backend employs the A* search algorithm to calculate the optimal path. A* uses a heuristic based on the Euclidean distance between node coordinates to guarantee the shortest path while optimizing search time.

### 5.2 Edge-Specific AI Jammer
- **Purpose:** To create a highly unpredictable hostile electronic environment.
- **Implementation:** The jammer maintains an independent interference matrix for every physical edge in the network graph: `jammed_edges[(node1, node2)][frequency] = True/False`. On every simulation tick, if "Dynamic Mode" is active, a randomizer independently scrambles the jammed frequencies for *every single link*, ensuring the environment is never static.

### 5.3 Micro-Frequency Hopping (Blind Trial-and-Error)
- **Purpose:** To simulate realistic signal transmission without omniscient knowledge.
- **Implementation:** 
  1. The sender looks at the current physical link it must cross.
  2. It evaluates a list of 5 available frequencies and filters out any it has already tried on this specific hop (`attempted_freqs`).
  3. It randomly selects one untried frequency and attempts transmission.
  4. **Failure (Jammed):** If the frequency is jammed, the transmission fails. The packet "bounces" back to the current node. The system increments the `packet_loss` counter, adds the frequency to `attempted_freqs`, and waits for the next tick to retry.
  5. **Success (Clear):** The packet successfully crosses the link to the next node. `attempted_freqs` is cleared, and the process begins again for the next physical link.
  6. **Total Failure:** If all 5 frequencies are tried and fail, the packet is officially dropped, represented by an underscore `_` in the payload string.

### 5.4 Payload Reconstruction (Levenshtein Distance)
- **Purpose:** To reconstruct data corrupted by total transmission failure.
- **Implementation:** As characters are received, they form words. If packets are dropped (e.g., `T_RGET`), the receiving node employs a Word Completion Algorithm. It compares the corrupted string against a predefined tactical dictionary using the Levenshtein distance metric. It calculates the minimum number of single-character edits (insertions, deletions, substitutions) required to change the corrupted word into a valid dictionary word, successfully reconstructing the data (e.g., `TARGET`).

---

## 6. Visualizations and User Interface
The frontend provides comprehensive situational awareness through a bespoke "Dark Mode" tactical UI, featuring glowing neon accents and radar scanlines.

### 6.1 Physical Mesh View (Layer 1)
Displays the geographical layout of the 9 hosts. It uses dynamic CSS to draw the physical connections. The active A* calculated route pulses with a glowing green neon effect to indicate the macro-path the data is utilizing.

### 6.2 Wide-Area Link Visualizer (Layer 2)
Unrolls the active route into a linear sequence at the bottom of the dashboard. Instead of a cluttered web, it displays a clean, horizontal flow (e.g., `[H1] === [H2] === [H4]`).
- **Data Channels:** Displays all 5 physical frequency lines between every node on the path. 
- **Jammer Visibility:** Visually highlights which specific lines are currently under active jamming attack (glowing red lines).
- **Physical Animations:** The packet physically animates across the lines. If it hits a red line, a `hopFail` CSS animation physically bounces the packet off the wall back to the sender. If clear, a `hopSuccess` animation shoots the packet to the next host.

### 6.3 Link Metrics & Decoding Panel
Real-time telemetry displays transmission progress, total hops executed, and packets dropped. It also provides a side-by-side view of the "Raw Intercepted Signal" (containing dropped `_` packets) and the "Auto-Corrected Output" handled by the Levenshtein algorithm.

---

## 7. Results & Observations
During testing, the simulation accurately modeled real-world ECCM behavior:
- **Low Jamming Environments:** Packets routed swiftly with minimal bouncing, resulting in 100% data integrity without reliance on Levenshtein correction.
- **High Dynamic Jamming Environments:** The blind trial-and-error algorithm successfully adapted to rapidly shifting interference matrices. While packet transit times increased (due to retries and bounces), the system consistently found open channels. In cases of total link saturation causing packet drops, the Levenshtein distance algorithm successfully reconstructed tactical keywords.

---

## 8. Conclusion
This simulation successfully demonstrates the severe complexities of tactical data transmission in hostile EW environments. By eliminating the unrealistic assumption of omniscient jammer knowledge, and merging intelligent network routing (A*) with realistic blind-frequency hopping and payload auto-correction, the project offers a highly novel and accurate representation of modern military communication resilience.

---

## 9. Future Scope
- **Dynamic A* Rerouting:** If a physical link is completely saturated (100% jammed for an extended period), the system could dynamically trigger a recalculation of the A* algorithm to find an entirely new geographical path.
- **Machine Learning Integration:** Implementing an ML model on the sender node to analyze historical packet loss data and predict the jammer's behavior, thereby prioritizing frequencies statistically less likely to be jammed.
- **Multi-Stream Data:** Simulating multiple concurrent messages traversing the mesh simultaneously to test network congestion and bandwidth limitations.
