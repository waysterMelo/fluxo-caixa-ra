import glob
import re

def fix_params(match):
    name = match.group(1)
    params_str = match.group(2)
    
    # Simple split by comma, ignoring commas inside brackets/parentheses
    params = []
    current = []
    depth = 0
    for char in params_str:
        if char == ',' and depth == 0:
            params.append("".join(current).strip())
            current = []
        else:
            if char == '(': depth += 1
            elif char == ')': depth -= 1
            current.append(char)
    if current:
        params.append("".join(current).strip())

    # Separate dependencies (which are now mandatory) from others with defaults
    deps_params = []
    other_params = []
    for p in params:
        if ('deps.' in p) and '=' not in p:
            deps_params.append(p)
        else:
            other_params.append(p)
    
    return f'{name}({", ".join(deps_params + other_params)}):'

for f in glob.glob('app/api/v1/*.py'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = re.sub(r'(def\s+\w+)\((.*?)\)\s*:', fix_params, content, flags=re.DOTALL)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)
