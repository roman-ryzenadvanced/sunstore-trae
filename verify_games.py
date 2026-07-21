import os
import glob
import re

files = [
    ('01', 'Water Sort Puzzle'),
    ('02', 'Memory Matrix'),
    ('03', 'Simon Sequence'),
    ('04', 'Reaction Rush'),
    ('05', 'Stroop Color Test'),
    ('06', 'One Line Stroke'),
    ('11', 'Pop It Galaxy'),
    ('12', 'Slime Lab'),
    ('15', 'Zen Sand Rake'),
]

for num, expected in files:
    pattern = f'c:/Users/admin/Documents/trae_projects/Sunset-Tengiz/glm52-games/{num}-*.html'
    matches = glob.glob(pattern)
    if matches:
        with open(matches[0], 'r') as f:
            content = f.read()
            h1_match = re.search(r'<h1[^>]*>([^<]+)</h1>', content)
            if h1_match:
                actual = h1_match.group(1).strip()
                status = '✓' if expected == actual else '✗'
                print(f'{num}: Expected \"{expected}\", got \"{actual}\" {status}')
            else:
                print(f'{num}: No h1 found')
    else:
        print(f'{num}: File not found')