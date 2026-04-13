import re
import os

files = [
    'src/pages/FluxoDiario.tsx',
    'src/pages/Ajustes.tsx',
    'src/pages/Conciliacao.tsx',
    'src/pages/Fechamento.tsx'
]

for file in files:
    if not os.path.exists(file):
        print(f"File not found: {file}")
        continue
        
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add import
    if "import { Company, listCompanies } from '../services/companyService';" not in content:
        content = re.sub(r"(import .* from '../components/Layout';)", r"\1\nimport { Company, listCompanies } from '../services/companyService';", content)

    # 2. Add state and effect
    state_injection = """  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  useEffect(() => {
    const loadComps = async () => {
      try {
        const data = await listCompanies(true);
        setCompanies(data);
        if (data.length > 0) setCompanyId(data[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadComps();
  }, []);
"""
    
    if "const [companies, setCompanies]" not in content:
        content = re.sub(r"(const \[companyId, setCompanyId\] = useState\(1\);)", r"\1\n" + state_injection, content)

    # 3. Replace select
    select_pattern = re.compile(r'<select[^>]*value=\{companyId\}[^>]*>.*?<\/select>', re.DOTALL)
    
    def select_replacer(match):
        original = match.group(0)
        tag_match = re.match(r'(<select[^>]*value=\{companyId\}[^>]*)>', original)
        if not tag_match:
            return original
        
        opening_tag = tag_match.group(1)
        if 'disabled=' not in opening_tag:
            opening_tag += ' disabled={isLoadingCompanies || companies.length === 0}'
            
        new_select = f"""{opening_tag}>
                  {{companies.length === 0 ? (
                    <option value="">Carregando...</option>
                  ) : (
                    companies.map(c => <option key={{c.id}} value={{c.id}}>{{c.name}}</option>)
                  )}}
                </select>"""
        return new_select

    content = select_pattern.sub(select_replacer, content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated files successfully.")
