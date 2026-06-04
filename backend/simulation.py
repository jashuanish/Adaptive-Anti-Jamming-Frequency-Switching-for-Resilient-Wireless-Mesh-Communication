import random
import heapq
from jammer import Jammer
from algorithms import word_completion

class MeshGraph:
    def __init__(self):
        self.nodes = {}
        self.edges = {}
        
    def add_node(self, node_id, x, y):
        self.nodes[node_id] = {'x': x, 'y': y}
        self.edges[node_id] = {}
        
    def add_edge(self, n1, n2):
        dist = ((self.nodes[n1]['x'] - self.nodes[n2]['x'])**2 + (self.nodes[n1]['y'] - self.nodes[n2]['y'])**2)**0.5
        self.edges[n1][n2] = dist
        self.edges[n2][n1] = dist

class SimulationEngine:
    def __init__(self):
        self.graph = MeshGraph()
        self.jammer = Jammer()
        self.running = False
        self.current_step = 0
        
        self.full_message = "TARGET ACQUIRED MISSION COMPLETE"
        self.dictionary = ["TARGET", "ACQUIRED", "MISSION", "COMPLETE"]
        
        self.source_host = 'H1'
        self.target_host = 'H9'
        
        self.setup_mesh()
        self.reset_states()
        
    def setup_mesh(self):
        positions = {
            'H1': (10, 50), 'H2': (30, 20), 'H3': (30, 80), 'H4': (50, 20),
            'H5': (50, 50), 'H6': (50, 80), 'H7': (70, 20), 'H8': (70, 80),
            'H9': (90, 50)
        }
        for hid, (x, y) in positions.items():
            self.graph.add_node(hid, x, y)
            
        edges = [
            ('H1', 'H2'), ('H1', 'H3'), ('H2', 'H4'), ('H2', 'H5'),
            ('H3', 'H5'), ('H3', 'H6'), ('H4', 'H7'), ('H5', 'H7'),
            ('H5', 'H8'), ('H6', 'H8'), ('H7', 'H9'), ('H8', 'H9')
        ]
        for n1, n2 in edges:
            self.graph.add_edge(n1, n2)
            
        # Initialize jammer with physical edges
        self.jammer.initialize_edges(edges)

    def calculate_macro_path(self):
        def heuristic(n1, n2):
            return ((self.graph.nodes[n1]['x'] - self.graph.nodes[n2]['x'])**2 + (self.graph.nodes[n1]['y'] - self.graph.nodes[n2]['y'])**2)**0.5

        open_set = []
        heapq.heappush(open_set, (0, self.source_host))
        came_from = {}
        g_score = {node: float('inf') for node in self.graph.nodes}
        g_score[self.source_host] = 0
        f_score = {node: float('inf') for node in self.graph.nodes}
        f_score[self.source_host] = heuristic(self.source_host, self.target_host)
        
        while open_set:
            _, curr = heapq.heappop(open_set)
            if curr == self.target_host:
                break
            for neighbor, cost in self.graph.edges[curr].items():
                tentative_g = g_score[curr] + cost
                if tentative_g < g_score[neighbor]:
                    came_from[neighbor] = curr
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = g_score[neighbor] + heuristic(neighbor, self.target_host)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))
                    
        path = []
        curr = self.target_host
        while curr in came_from:
            path.append(curr)
            curr = came_from[curr]
        path.append(self.source_host)
        path.reverse()
        return path if path[0] == self.source_host else [self.source_host]

    def set_route(self, source, target):
        self.source_host = source
        self.target_host = target
        self.reset_states()

    def reset_states(self):
        self.current_step = 0
        self.running = False
        self.macro_path = self.calculate_macro_path()
        self.current_path_idx = 0
        
        self.state = {
            'current_host': self.macro_path[0],
            'target_host': self.macro_path[1] if len(self.macro_path) > 1 else self.macro_path[0],
            'attempted_freqs': [], # Frequencies tried on CURRENT hop
            'freq_tried': None,
            'hop_success': False,
            'packet_loss': 0,
            'message_idx': 0,
            'received_message': "",
            'corrected_message': ""
        }
        
    def update_word_completion(self):
        words = self.state['received_message'].split(' ')
        last_word = words[-1]
        if last_word:
            corrected_word = word_completion(last_word, self.dictionary)
            if len(words) == 1:
                self.state['corrected_message'] = corrected_word
            else:
                # Keep previous words as they are, replace the last one
                self.state['corrected_message'] = ' '.join(words[:-1]) + ' ' + corrected_word
                
    def step(self):
        if not self.running: return
        if self.state['message_idx'] >= len(self.full_message):
            self.running = False
            return
            
        self.current_step += 1
        
        # Advance dynamic jammer if enabled
        self.jammer.step()
        
        curr = self.state['current_host']
        nxt = self.state['target_host']
        
        # Trial-and-Error Logic: Sender doesn't know what is jammed.
        # It picks a random untried frequency for this hop.
        jammed_for_link = self.jammer.get_interference_for_edge(curr, nxt)
        untried_freqs = [f for f in self.jammer.frequencies if f not in self.state['attempted_freqs']]
        
        char = self.full_message[self.state['message_idx']]

        if not untried_freqs:
            # All 5 frequencies failed! The character is completely dropped.
            if char != ' ':
                self.state['received_message'] += '_'
            else:
                self.state['received_message'] += ' '
                
            self.state['packet_loss'] += 1
            self.state['message_idx'] += 1
            self.current_path_idx = 0
            self.state['current_host'] = self.macro_path[0]
            self.state['target_host'] = self.macro_path[1] if len(self.macro_path) > 1 else self.macro_path[0]
            self.state['attempted_freqs'] = []
            self.state['freq_tried'] = None
            self.update_word_completion()
            return
            
        # Pick one to try
        selected_freq = random.choice(untried_freqs)
        is_jammed = jammed_for_link[selected_freq]
        
        self.state['freq_tried'] = selected_freq
        self.state['hop_success'] = not is_jammed
        self.state['attempted_freqs'].append(selected_freq)

        if is_jammed:
            self.state['packet_loss'] += 1
            # Bounce back, stay on current host for next tick to retry
        else:
            # Hop successful!
            if self.current_path_idx < len(self.macro_path) - 1:
                self.current_path_idx += 1
                
                if self.current_path_idx < len(self.macro_path) - 1:
                    # Still traveling along the path
                    self.state['current_host'] = self.macro_path[self.current_path_idx]
                    self.state['target_host'] = self.macro_path[self.current_path_idx + 1]
                    self.state['attempted_freqs'] = [] # Reset for next hop
                else:
                    # Arrived at the final destination!
                    self.state['received_message'] += char
                    self.state['message_idx'] += 1
                    
                    # Reset back to the start for the next character's journey
                    self.current_path_idx = 0
                    self.state['current_host'] = self.macro_path[0]
                    self.state['target_host'] = self.macro_path[1] if len(self.macro_path) > 1 else self.macro_path[0]
                    self.state['attempted_freqs'] = []
                    
                    self.update_word_completion()

    def get_state(self):
        return {
            'step': self.current_step,
            'running': self.running,
            'full_message': self.full_message,
            'nodes': self.graph.nodes,
            'edges': [
                {'source': n1, 'target': n2, 'cost': dist} 
                for n1, neighbors in self.graph.edges.items() 
                for n2, dist in neighbors.items() if n1 < n2
            ],
            'macro_path': self.macro_path,
            'state': self.state,
            'frequencies': self.jammer.frequencies,
            'jammed_freqs': self.jammer.get_all_interference(),
            'dynamic_mode': self.jammer.dynamic_mode
        }
