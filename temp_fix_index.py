import re

with open('c:/Users/admin/Documents/trae_projects/Sunset-Tengiz/glm52-games/index-server.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Check current state
has_glm52 = "GLM 5.2" in content
has_qwen = "'Qwen 3.7 MAX'" in content or '"Qwen 3.7 MAX"' in content

print(f"Has GLM 5.2: {has_glm52}")
print(f"Has Qwen entry in code: {has_qwen}")

# Check if Qwen gradient exists
has_qwen_grad = "'Qwen 3.7 MAX'" in content and 'from-orange' in content
print(f"Has Qwen gradient: {has_qwen_grad}")

# Check counts object
counts_match = re.search(r"const counts = \{[^}]+\}", content)
if counts_match:
    print(f"Counts: {counts_match.group()[:200]}...")

# Check if count-qwen line exists
has_count_qwen = "count-qwen" in content
print(f"Has count-qwen: {has_count_qwen}")