import os
import re

files = ['public/student-dashboard.html', 'public/teacher-dashboard.html', 'public/school-dashboard.html', 'public/system-admin.html']

def patch_file(path):
    print(f'Patching {path}...')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Fonts
        content = re.sub(r'family=Be\+Vietnam\+Pro:[^\"]+', 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900', content)
        content = content.replace('family=Be+Vietnam+Pro', 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900')
        content = content.replace('Font chữ Be Vietnam Pro', 'Font chữ Plus Jakarta Sans & Inter')
        content = content.replace('Google Fonts: Be Vietnam Pro', 'Google Fonts: Plus Jakarta Sans & Inter')
        
        # Font-family CSS
        content = content.replace("font-family: 'Be Vietnam Pro', sans-serif;", "font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;")
        content = content.replace("font-family: 'Be Vietnam Pro', sans-serif !important;", "font-family: 'Inter', 'Plus Jakarta Sans', sans-serif !important;")

        # 2. Colors (:root)
        content = content.replace('--primary: #6366f1;', '--primary: #ffffff;')
        content = content.replace('--primary-glow: rgba(99, 102, 241, 0.6);', '--primary-glow: rgba(255, 255, 255, 0.15);')
        content = content.replace('--secondary: #a855f7;', '--secondary: #c4c7ca;')
        content = content.replace('--secondary-glow: rgba(168, 85, 247, 0.6);', '--secondary-glow: rgba(196, 199, 202, 0.15);')
        content = content.replace('--accent: #06b6d4;', '--accent: #ffffff;')
        content = content.replace('--bg-dark: #0f0c29;', '--bg-dark: #121318;')
        content = content.replace('--card-radius: 24px;', '--card-radius: 20px;')

        # 3. Sidebar Alignment (.nav-item)
        content = content.replace('padding: 11px 16px;', 'padding: 10px 12px;')
        content = content.replace('gap: 12px;', 'gap: 10px;')
        
        # Icon width
        content = re.sub(r'(\.nav-item\s+i\s*\{[^}]*?width:\s*)20px', r'\1 18px', content)

        # 4. Background
        content = content.replace('background: radial-gradient(circle at 50% 50%, #0f0c29 0%, #050510 100%);', 'background: #121318;')
        content = content.replace('background: #0f0c29;', 'background: #121318;')
        
        # Hide orbs
        content = content.replace('.orb {\n            position: absolute;', '.orb {\n            display: none;\n            position: absolute;')
        content = content.replace('.orb {\r\n            position: absolute;', '.orb {\r\n            display: none;\r\n            position: absolute;')

        # 5. Body background dot-grid
        content = re.sub(r'(body\s*\{[^}]*?background(-color)?:\s*var\(--bg-dark\);)', r'\1\n            background-image: radial-gradient(#ffffff10 1px, transparent 1px);\n            background-size: 40px 40px;', content)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Successfully patched {path}')
    except Exception as e:
        print(f'Error patching {path}: {e}')

if __name__ == "__main__":
    for f in files:
        patch_file(f)
