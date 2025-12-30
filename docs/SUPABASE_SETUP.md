# Supabase Setup

## Passos
- Crie um projeto no Supabase e copie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para `.env.local`.
- Rode o SQL de `supabase/schema.sql` em `Table Editor → Run SQL` para criar as tabelas.
- Habilite o armazenamento (opcional) se desejar upload real de arquivos.

## Tabelas
- `transacoes`: dados extraídos da fatura, com `fatura_mes_ref` (YYYY-MM), `dono`, `categoria`.
- `pagamentos`: registros de pagamentos com `mes_referencia`.
- `fechamentos`: saldo final do mês por usuário.
- `regras_classificacao`: regras sugeridas por descrição.

## RLS
- Políticas liberadas para uso com `anon key` durante o desenvolvimento.
- Em produção, restrinja conforme necessidade (auth).

## Variáveis de Ambiente
- Defina em `.env.local`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Google Document AI (Opcional)
- Para habilitar análise de PDFs com IA, forneça:
  - `VITE_GOOGLE_API_KEY`
  - `VITE_GOOGLE_PROJECT_ID`
  - `VITE_GOOGLE_LOCATION`
  - `VITE_GOOGLE_DOCUMENT_AI_PROCESSOR_ID`
- A integração está stubada no cliente; podemos conectar via um endpoint backend.
