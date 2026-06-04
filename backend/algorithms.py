import heapq

def word_completion(corrupted_word, dictionary):
    """
    Uses Levenshtein distance (with wildcard '_') to guess the missing word.
    """
    if not corrupted_word: return corrupted_word
    
    def levenshtein(s1, s2):
        if len(s1) < len(s2): return levenshtein(s2, s1)
        if len(s2) == 0: return len(s1)
        prev_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            curr_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = prev_row[j + 1] + 1
                deletions = curr_row[j] + 1
                substitutions = prev_row[j] + (0 if c1 == '_' else (c1 != c2))
                curr_row.append(min(insertions, deletions, substitutions))
            prev_row = curr_row
        return prev_row[-1]

    best_match = corrupted_word
    best_dist = float('inf')
    for word in dictionary:
        dist = levenshtein(corrupted_word, word)
        if dist < best_dist:
            best_dist = dist
            best_match = word
            
    return best_match if best_dist <= len(corrupted_word) / 2 else corrupted_word

def HAFO(graph, current_node, target_node, freq_history):
    """
    Hybrid Adaptive Frequency Optimization (HAFO)
    - Macro Routing: A* Pathfinding through physical mesh
    - Micro Hopping: Historical Threat DP to pick safest frequency
    """
    if current_node == target_node:
        return current_node, 'F1'
        
    def heuristic(n1, n2):
        return ((graph.nodes[n1]['x'] - graph.nodes[n2]['x'])**2 + (graph.nodes[n1]['y'] - graph.nodes[n2]['y'])**2)**0.5

    open_set = []
    heapq.heappush(open_set, (0, current_node))
    came_from = {}
    
    g_score = {node: float('inf') for node in graph.nodes}
    g_score[current_node] = 0
    
    f_score = {node: float('inf') for node in graph.nodes}
    f_score[current_node] = heuristic(current_node, target_node)
    
    while open_set:
        _, curr = heapq.heappop(open_set)
        
        if curr == target_node:
            break
            
        for neighbor, cost in graph.edges[curr].items():
            tentative_g = g_score[curr] + cost
            if tentative_g < g_score[neighbor]:
                came_from[neighbor] = curr
                g_score[neighbor] = tentative_g
                f_score[neighbor] = g_score[neighbor] + heuristic(neighbor, target_node)
                heapq.heappush(open_set, (f_score[neighbor], neighbor))
                
    path = []
    curr = target_node
    while curr in came_from:
        path.append(curr)
        curr = came_from[curr]
    path.reverse()
    
    next_node = path[0] if path else current_node
    
    # Pick safest frequency based on history (lower is safer)
    best_freq = min(freq_history.keys(), key=lambda f: freq_history[f])
    
    return next_node, best_freq
