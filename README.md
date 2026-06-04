# Comparative Analysis of Adaptive Anti-Jamming Frequency Optimization Algorithms

## Project Overview
In modern military operations, secure radio frequency (RF) communication is critical. Adversaries use advanced electronic warfare techniques, specifically intelligent multi-frequency jamming, to disrupt these communications. 

This project simulates a tactical battlefield network where a **Sender** must transmit a secure message across a network of frequencies (represented as a weighted graph), while an intelligent **Jammer** actively attempts to block the transmission.

To solve this, we apply Design and Analysis of Algorithms (DAA) concepts to simulate and compare classical routing algorithms (Greedy, Dijkstra, Dynamic Programming, A*) against **novel, custom-designed algorithms** created specifically for this project.

## Novel Algorithmic Contributions (Algorithmic Warfare)

To make this project unique and step beyond standard Frequency Hopping (FHSS), we introduce two novel algorithms:

### 1. Predictive Graph-Hopping Algorithm (PGHA) - *Sender Algorithm*
Standard algorithms like Dijkstra only look at the *current* state of the network. The **PGHA** maintains a rolling history of the jammer's attacks. By modeling the jammer's behavior as a Markov chain, it computes a probability matrix to predict which nodes the jammer is likely to strike *next*. It then uses Dynamic Programming to find a path that minimizes both current switching costs and *expected future interference*.

### 2. Adversarial Min-Max Jammer (AMMJ) - *Jammer Algorithm*
Turning the tables to improve the adversary, the **AMMJ** uses game theory. Instead of randomly jamming frequencies, it analyzes the sender's current location on the graph and identifies the neighbors with the lowest switching costs (the easiest escape routes). It specifically targets these bottlenecks to trap the sender in high-interference zones, maximizing packet loss.

## Tech Stack
* **Frontend**: React.js, Vite, Vanilla CSS (Glassmorphism / Wave Animations), Chart.js
* **Backend**: Python, Flask
* **Algorithms**: Greedy, Priority Queue, Dijkstra, Dynamic Programming, A* Search, PGHA (Custom), AMMJ (Custom Game Theory)

## How to Run Locally

### 1. Start the Backend (Simulation Engine)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate
pip install -r requirements.txt # (Flask, Flask-Cors)
python app.py
```

### 2. Start the Frontend (Dashboard)
```bash
cd frontend
npm install
npm run dev
```
Open your browser to `http://localhost:5173` to interact with the simulation.
