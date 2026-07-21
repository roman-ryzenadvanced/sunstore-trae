import re

with open('c:/Users/admin/Documents/trae_projects/Sunset-Tengiz/glm52-games/index-server.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Check for key strings
print("=== Index Verification ===")
print(f"Has 'count-qwen': {'count-qwen' in content}")
print(f"Has 'count-glm52': {'count-glm52' in content}")
print(f"Has Qwen gradient: {'Qwen 3.7 MAX' in content and 'from-orange' in content}")
print(f"Has Qwen desc: {'Qwen 3.7 MAX' in content and 'cognitive training' in content}")

# Count tabs
tab_count = content.count('data-model="Qwen 3.7 MAX"')
print(f"Qwen tab defined: {tab_count > 0}")

# Check if projects have both GLM and Qwen
glm52_count = content.count('"model": "GLM 5.2"')
qwen_count = content.count('"model": "Qwen 3.7 MAX"')
print(f"GLM 5.2 projects: {glm52_count}")
print(f"Qwen 3.7 MAX projects: {qwen_count}")