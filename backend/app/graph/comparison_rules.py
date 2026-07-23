import os
from neo4j import GraphDatabase
from typing import Optional, List, Dict
from app.config import settings

class GraphComparison:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            settings.neo4j_uri, 
            auth=(settings.neo4j_user, settings.neo4j_password)
        )

    def close(self):
        self.driver.close()

    def get_overlap(self, entity_type: Optional[str] = None) -> List[Dict]:
        query = """
        MATCH (a)-[r1]->(b1)
        MATCH (a2)-[r2]->(b2)
        WHERE type(r1) = type(r2)
          AND type(r1) <> 'MENTIONED_IN'
          AND r1.source <> r2.source
          AND (a = a2 OR (a.canonical_id IS NOT NULL AND a.canonical_id = a2.canonical_id))
          AND (b1 = b2 OR (b1.canonical_id IS NOT NULL AND b1.canonical_id = b2.canonical_id))
          AND ($entity_type IS NULL OR $entity_type IN labels(a))
        RETURN DISTINCT a.label AS entity, type(r1) AS relation,
               b1.label AS target, r1.source AS source_a, r2.source AS source_b
        """
        with self.driver.session() as session:
            result = session.run(query, entity_type=entity_type)
            return [dict(record) for record in result]

    def get_conflicts(self, entity_type: Optional[str] = None) -> List[Dict]:
        q1 = """
        MATCH (parent1)-[r1:PARENT_OF]->(child)
        MATCH (parent2)-[r2:PARENT_OF]->(child2)
        WHERE r1.source <> r2.source
          AND (child = child2 OR (child.canonical_id IS NOT NULL AND child.canonical_id = child2.canonical_id))
          AND parent1 <> parent2
          AND (parent1.canonical_id IS NULL OR parent2.canonical_id IS NULL OR parent1.canonical_id <> parent2.canonical_id)
          AND ($entity_type IS NULL OR $entity_type IN labels(child))
        RETURN child.label AS entity, 'disputed parentage' AS conflict_type,
               parent1.label AS claim_a_target, r1.source AS source_a,
               parent2.label AS claim_b_target, r2.source AS source_b
        """

        q2 = """
        MATCH (a)-[r1:ALLIES_WITH]->(b)
        MATCH (a2)-[r2:OPPOSES]->(b2)
        WHERE r1.source <> r2.source
          AND (a = a2 OR (a.canonical_id IS NOT NULL AND a.canonical_id = a2.canonical_id))
          AND (b = b2 OR (b.canonical_id IS NOT NULL AND b.canonical_id = b2.canonical_id))
          AND ($entity_type IS NULL OR $entity_type IN labels(a))
        RETURN a.label AS entity, 'allies vs opposes' AS conflict_type,
               b.label AS claim_a_target, r1.source AS source_a,
               b2.label AS claim_b_target, r2.source AS source_b
        """

        q3 = """
        MATCH (a)-[r1]->(b1)
        MATCH (a2)-[r2]->(b2)
        WHERE type(r1) = type(r2)
          AND type(r1) IN ['MARRIED_TO', 'SIBLING_OF', 'CAUSED_BY', 'LED_TO', 'LOCATED_AT']
          AND r1.source <> r2.source
          AND (a = a2 OR (a.canonical_id IS NOT NULL AND a.canonical_id = a2.canonical_id))
          AND b1 <> b2
          AND (b1.canonical_id IS NULL OR b2.canonical_id IS NULL OR b1.canonical_id <> b2.canonical_id)
          AND ($entity_type IS NULL OR $entity_type IN labels(a))
        RETURN DISTINCT a.label AS entity, type(r1) AS conflict_type,
               b1.label AS claim_a_target, r1.source AS source_a,
               b2.label AS claim_b_target, r2.source AS source_b
        """

        results = []
        with self.driver.session() as session:
            for record in session.run(q1, entity_type=entity_type):
                d = dict(record)
                d['relation'] = 'PARENT_OF'
                d['confidence'] = 'High'
                results.append(d)
                
            for record in session.run(q2, entity_type=entity_type):
                d = dict(record)
                d['relation'] = 'ALLIES_WITH/OPPOSES'
                d['confidence'] = 'High'
                results.append(d)
                
            for record in session.run(q3, entity_type=entity_type):
                d = dict(record)
                d['relation'] = d['conflict_type']
                d['conflict_type'] = 'divergent target'
                d['confidence'] = 'Lower - verify manually'
                results.append(d)
                
        return results

    def get_most_contested(self, entity_type: Optional[str] = None) -> List[Dict]:
        conflicts = self.get_conflicts(entity_type)
        grouped = {}
        for c in conflicts:
            ent = c['entity']
            if ent not in grouped:
                grouped[ent] = []
            grouped[ent].append({
                'relation': c['relation'],
                'conflict_type': c['conflict_type'],
                'claim_a_target': c['claim_a_target'],
                'source_a': c['source_a'],
                'claim_b_target': c['claim_b_target'],
                'source_b': c['source_b'],
                'confidence': c['confidence']
            })
        
        results = []
        for ent, confs in grouped.items():
            results.append({
                'entity': ent,
                'conflicts': confs,
                'conflict_count': len(confs)
            })
            
        results.sort(key=lambda x: x['conflict_count'], reverse=True)
        return results

    def get_key_figures(self, source_name: str) -> List[Dict]:
        query = """
        MATCH (s:Source {name: $sourceName})<-[:MENTIONED_IN]-(e)
        MATCH (e)-[rel]-()
        WHERE type(rel) <> "MENTIONED_IN"
        WITH e, count(rel) AS connections
        ORDER BY connections DESC LIMIT 10
        RETURN e.label AS label, e.id AS id, connections
        """
        with self.driver.session() as session:
            result = session.run(query, sourceName=source_name)
            return [dict(record) for record in result]

    def get_shortest_path(self, from_id: str, to_id: str) -> List[Dict]:
        query = """
        MATCH p = shortestPath((a {id: $fromId})-[*..6]-(b {id: $toId}))
        RETURN [n IN nodes(p) | {id: n.id, label: n.label}] AS path_nodes,
               [r IN relationships(p) | {type: type(r), source: r.source}] AS path_rels
        """
        with self.driver.session() as session:
            result = session.run(query, fromId=from_id, toId=to_id)
            return [dict(record) for record in result]

if __name__ == "__main__":
    print("Running verification for Conflicts...")
    comp = GraphComparison()
    conflicts = comp.get_conflicts(None)
    if not conflicts:
        print("VERIFICATION FAILURE: No conflicts returned!")
    else:
        print(f"Found {len(conflicts)} conflicts. Displaying up to 2:")
        for c in conflicts[:2]:
            print(c)
    comp.close()
