import random

class Jammer:
    def __init__(self):
        self.frequencies = ['F1', 'F2', 'F3', 'F4', 'F5']
        self.dynamic_mode = False
        self.jammed_edges = {} # {(n1, n2): {freq: bool}}

    def initialize_edges(self, edges_list):
        self.jammed_edges = {}
        for edge in edges_list:
            n1, n2 = min(edge), max(edge)
            self.jammed_edges[(n1, n2)] = {f: False for f in self.frequencies}

    def set_dynamic_mode(self, enabled):
        self.dynamic_mode = enabled

    def step(self):
        if self.dynamic_mode:
            for edge in self.jammed_edges:
                # Randomly pick 0 to 3 frequencies to jam on this specific link
                num_to_jam = random.randint(0, 3)
                jammed = random.sample(self.frequencies, num_to_jam)
                self.jammed_edges[edge] = {f: (f in jammed) for f in self.frequencies}
        else:
            # If not dynamic, just keep everything clear or we can leave whatever was there.
            # We'll clear it when toggled off to be safe.
            for edge in self.jammed_edges:
                self.jammed_edges[edge] = {f: False for f in self.frequencies}

    def get_interference_for_edge(self, n1, n2):
        n1, n2 = min(n1, n2), max(n1, n2)
        return self.jammed_edges.get((n1, n2), {f: False for f in self.frequencies})
        
    def get_all_interference(self):
        # Format for JSON serialization: "H1-H2": { ... }
        out = {}
        for (n1, n2), freqs in self.jammed_edges.items():
            out[f"{n1}-{n2}"] = freqs
        return out
