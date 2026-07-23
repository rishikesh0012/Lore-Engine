import os
import urllib.request
from bs4 import BeautifulSoup

def clean_html(html_content, is_hesiod=False):
    soup = BeautifulSoup(html_content, 'html.parser')
    text = soup.get_text(separator=" ", strip=True)
    
    # Strip Gutenberg header and footer
    start_marker = "*** START OF THE PROJECT GUTENBERG EBOOK"
    end_marker = "*** END OF THE PROJECT GUTENBERG EBOOK"
    
    # The markers might have slight variations in the HTML text representation
    # We can search for substrings
    start_idx = text.find(start_marker)
    if start_idx == -1:
        start_idx = text.find("*** START OF THIS PROJECT GUTENBERG EBOOK")
    if start_idx == -1:
        start_idx = text.find("***START OF THE PROJECT GUTENBERG")
        
    end_idx = text.find(end_marker)
    if end_idx == -1:
        end_idx = text.find("*** END OF THIS PROJECT GUTENBERG EBOOK")
    if end_idx == -1:
        end_idx = text.find("***END OF THE PROJECT GUTENBERG")

    if start_idx != -1:
        # Move past the marker line (approximate by looking for next newline or just jumping ahead)
        text = text[start_idx + len(start_marker):]
        # Some extra text might remain like " ***"
        if text.startswith(" ***") or text.startswith("***"):
            text = text[4:]
            
    if end_idx != -1:
        # We need to find the relative index again because we sliced
        rel_end_idx = text.find(end_marker)
        if rel_end_idx == -1:
            rel_end_idx = text.find("*** END OF THIS PROJECT GUTENBERG EBOOK")
        if rel_end_idx != -1:
            text = text[:rel_end_idx]

    if is_hesiod:
        # Extract THE THEOGONY
        # The true start of Theogony text is marked by "THE THEOGONY (ll. 1-25)" in this specific file.
        # It ends right before "THE CATALOGUES OF WOMEN AND EOIAE" which immediately follows.
        theo_start = text.find("THE THEOGONY (ll. 1-25)")
        works_start = text.find("THE CATALOGUES OF WOMEN AND EOIAE")
        
        if theo_start != -1 and works_start != -1:
            text = text[theo_start:works_start]
        elif theo_start != -1:
            text = text[theo_start:]

    return text.strip()

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
    os.makedirs("data/sources", exist_ok=True)
    
    # 1. Hesiod's Theogony
    print("Fetching Hesiod...")
    url = "https://www.gutenberg.org/files/348/348-h/348-h.htm"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    text = clean_html(html, is_hesiod=True)
    with open("data/sources/hesiod_theogony.txt", "w", encoding="utf-8") as f:
        f.write(text)
    verify("hesiod_theogony.txt", text, "Zeus", "Cronos")

    # 2. Homer's Iliad
    print("Fetching Iliad...")
    url = "https://www.gutenberg.org/files/2199/2199-h/2199-h.htm"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    text = clean_html(html)
    with open("data/sources/homer_iliad.txt", "w", encoding="utf-8") as f:
        f.write(text)
    verify("homer_iliad.txt", text, "Achilles", "Troy")

    # 3. Homer's Odyssey
    print("Fetching Odyssey...")
    url = "https://www.gutenberg.org/files/1727/1727-h/1727-h.htm"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    text = clean_html(html)
    with open("data/sources/homer_odyssey.txt", "w", encoding="utf-8") as f:
        f.write(text)
    verify("homer_odyssey.txt", text, "Odysseus", "Penelope")

    # 4. Ovid's Metamorphoses
    print("Fetching Ovid Part 1...")
    url1 = "https://www.gutenberg.org/files/21765/21765-h/21765-h.htm"
    req1 = urllib.request.Request(url1, headers={'User-Agent': 'Mozilla/5.0'})
    html1 = urllib.request.urlopen(req1).read().decode('utf-8', errors='ignore')
    text1 = clean_html(html1)
    
    print("Fetching Ovid Part 2...")
    url2 = "https://www.gutenberg.org/files/26073/26073-h/26073-h.htm"
    req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
    html2 = urllib.request.urlopen(req2).read().decode('utf-8', errors='ignore')
    text2 = clean_html(html2)
    
    ovid_text = text1 + "\n" + text2
    with open("data/sources/ovid_metamorphoses.txt", "w", encoding="utf-8") as f:
        f.write(ovid_text)
    verify("ovid_metamorphoses.txt", ovid_text, "Jupiter", "Daphne")

if __name__ == "__main__":
    main()
