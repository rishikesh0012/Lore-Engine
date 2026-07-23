import sys

def verify(filename, text, term1, term2):
    print(f"--- Verification for {filename} ---")
    print(f"Total Character Count: {len(text)}")
    print(f"First 300 Characters: {text[:300]}")
    t_lower = text.lower()
    has_term1 = term1.lower() in t_lower
    has_term2 = term2.lower() in t_lower
    print(f"Contains '{term1}': {has_term1}")
    print(f"Contains '{term2}': {has_term2}")
    if not (has_term1 and has_term2):
        print(f"WARNING: {filename} failed verification!")
    print("\n")

def main():
    text1 = open("data/sources/hesiod_theogony.txt").read()
    verify("hesiod_theogony.txt", text1, "Zeus", "Cronos")

    text2 = open("data/sources/homer_iliad.txt").read()
    verify("homer_iliad.txt", text2, "Achilles", "Troy")
    
    text3 = open("data/sources/homer_odyssey.txt").read()
    verify("homer_odyssey.txt", text3, "Odysseus", "Penelope")
    
    text4 = open("data/sources/ovid_metamorphoses.txt").read()
    verify("ovid_metamorphoses.txt", text4, "Jupiter", "Daphne")

if __name__ == "__main__":
    main()
