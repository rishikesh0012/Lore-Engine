from neo4j import GraphDatabase
import logging

from app.config import settings

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self.driver = None

    def connect(self):
        try:
            self.driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password)
            )
            # Verify connection
            self.driver.verify_connectivity()
            logger.info("Connected to Neo4j successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise

    def close(self):
        if self.driver:
            self.driver.close()

    def execute_write(self, cypher_query, parameters=None):
        if not self.driver:
            self.connect()
        with self.driver.session() as session:
            try:
                result = session.execute_write(self._run_query, cypher_query, parameters)
                return result
            except Exception as e:
                logger.error(f"Write error: {e}")
                logger.error(f"Query: {cypher_query}")
                logger.error(f"Parameters: {parameters}")
                raise

    def execute_read(self, cypher_query, parameters=None):
        if not self.driver:
            self.connect()
        with self.driver.session() as session:
            try:
                result = session.execute_read(self._run_query, cypher_query, parameters)
                return result
            except Exception as e:
                logger.error(f"Read error: {e}")
                raise

    @staticmethod
    def _run_query(tx, query, parameters):
        result = tx.run(query, parameters or {})
        return [record.data() for record in result]

# Global instance
db_client = Neo4jClient()
