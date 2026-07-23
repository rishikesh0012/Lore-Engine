DEITY_ALIASES = {
    "zeus": "zeus_jupiter", "jupiter": "zeus_jupiter", "jove": "zeus_jupiter",
    "hera": "hera_juno", "juno": "hera_juno",
    "poseidon": "poseidon_neptune", "neptune": "poseidon_neptune",
    "aphrodite": "aphrodite_venus", "venus": "aphrodite_venus",
    "ares": "ares_mars", "mars": "ares_mars",
    "hermes": "hermes_mercury", "mercury": "hermes_mercury",
    "hades": "hades_pluto", "pluto": "hades_pluto", "dis": "hades_pluto",
    "athena": "athena_minerva", "athene": "athena_minerva", "minerva": "athena_minerva",
    "artemis": "artemis_diana", "diana": "artemis_diana",
    "demeter": "demeter_ceres", "ceres": "demeter_ceres",
    "cronus": "cronus_saturn", "cronos": "cronus_saturn", "saturn": "cronus_saturn",
    "persephone": "persephone_proserpina", "proserpina": "persephone_proserpina",
    "dionysus": "dionysus_bacchus", "bacchus": "dionysus_bacchus",
    "hephaestus": "hephaestus_vulcan", "vulcan": "hephaestus_vulcan",
    "odysseus": "odysseus_ulysses", "ulysses": "odysseus_ulysses",
}

def get_canonical_id(entity_text: str) -> str | None:
    return DEITY_ALIASES.get(entity_text.lower().strip())
