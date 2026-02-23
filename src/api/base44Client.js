import { supabase, hasSupabaseConfig } from '@/lib/supabaseClient'

function parseSort(sort) {
  if (!sort) return { column: 'id', ascending: true }
  const descending = sort.startsWith('-')
  const column = descending ? sort.slice(1) : sort
  return { column, ascending: !descending }
}

async function list(table, sort) {
  if (!hasSupabaseConfig) return []
  try {
    const { column, ascending } = parseSort(sort)
    const { data, error } = await supabase.from(table).select('*').order(column, { ascending })
    if (error) throw error
    return data || []
  } catch (e) {
    console.error(`Erro ao listar ${table}:`, e?.message || e)
    return []
  }
}

async function create(table, payload) {
  if (!hasSupabaseConfig) return payload
  try {
    let toInsert = payload
    if (table === 'transacoes') {
      const iso = /^\d{4}-\d{2}-\d{2}$/
      const dmy = /^\d{2}\/\d{2}\/\d{4}$/
      const dm = /^\d{2}\/\d{2}$/
      const mesRef = (payload.fatura_mes_ref || '').trim()
      function fixDate(raw) {
        if (!raw) return mesRef ? `${mesRef}-01` : null
        const s = String(raw).trim()
        if (iso.test(s)) return s
        if (dmy.test(s)) {
          const [dd, mm, yyyy] = s.split('/')
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
        }
        if (dm.test(s) && mesRef) {
          const [yyyy, mmRef] = mesRef.split('-')
          const [dd, mm] = s.split('/')
          const finalMonth = (mm || mmRef).padStart(2, '0')
          return `${yyyy}-${finalMonth}-${dd.padStart(2, '0')}`
        }
        return s
      }
      function ensureIso(str) {
        const s = String(str || '').trim()
        if (iso.test(s)) return s
        if (dm.test(s) && mesRef) {
          const [yyyy, mmRef] = mesRef.split('-')
          const [dd, mm] = s.split('/')
          const finalMonth = (mm || mmRef).padStart(2, '0')
          return `${yyyy}-${finalMonth}-${dd.padStart(2, '0')}`
        }
        if (dmy.test(s)) {
          const [dd, mm, yyyy] = s.split('/')
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
        }
        return mesRef ? `${mesRef}-01` : '1970-01-01'
      }
      function normMoney(v) {
        if (v == null) return 0
        let s = String(v).trim()
        s = s.replace(/\s+/g, '')
        // Remove tudo exceto dígitos e separadores , .
        s = s.replace(/[^0-9,.\-]/g, '')
        const hasComma = s.includes(',')
        const hasDot = s.includes('.')
        if (hasComma && hasDot) {
          // Formato tipo 1.234,56 -> remove milhares e troca vírgula por ponto
          s = s.replace(/\./g, '').replace(',', '.')
        } else if (hasComma && !hasDot) {
          // Formato 1234,56 -> vírgula vira ponto
          s = s.replace(',', '.')
        }
        return parseFloat(s) || 0
      }
      toInsert = {
        ...payload,
        data: ensureIso(fixDate(payload.data)),
        valor: normMoney(payload.valor),
        parcela_atual: (payload.parcela_atual === null || payload.parcela_atual === undefined) ? null : Number(payload.parcela_atual),
        parcela_total: (payload.parcela_total === null || payload.parcela_total === undefined) ? null : Number(payload.parcela_total),
      }
      if (!toInsert.hash_unico) {
        const pAtual = toInsert.parcela_atual || 0
        toInsert.hash_unico = `${toInsert.data}_${toInsert.valor}_${toInsert.descricao}_${pAtual}`
      }
      try {
        const { data, error } = await supabase
          .from(table)
          .upsert(toInsert, { onConflict: 'hash_unico', ignoreDuplicates: true })
          .select()
          .maybeSingle()
        if (error) throw error
        return data || toInsert
      } catch (err) {
        if (err?.code === '42P10') {
          const { data: existing } = await supabase.from(table).select('*').eq('hash_unico', toInsert.hash_unico).maybeSingle()
          if (existing) return existing
          const { data, error } = await supabase.from(table).insert(toInsert).select().single()
          if (error) throw error
          return data
        }
        throw err
      }
    } else {
      if (table === 'faturas') {
        // Faturas usa mes_referencia como PK, então create deve ser um upsert
        const { data, error } = await supabase.from(table).upsert(toInsert).select().single()
        if (error) throw error
        return data
      }
      const { data, error } = await supabase.from(table).insert(toInsert).select().single()
      if (error) throw error
      return data
    }
  } catch (e) {
    console.error(`Erro ao criar em ${table}:`, e?.message || e)
    throw e
  }
}

async function update(table, id, payload) {
  if (!hasSupabaseConfig) return { id, ...payload }
  try {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().maybeSingle()
    if (error) throw error
    return data
  } catch (e) {
    console.error(`Erro ao atualizar ${table}:${id}:`, e?.message || e)
    throw e
  }
}

async function remove(table, id) {
  if (!hasSupabaseConfig) return true
  try {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) {
    console.error(`Erro ao deletar ${table}:${id}:`, e?.message || e)
    throw e
  }
}

export const base44 = {
  entities: {
    Transacao: {
      list: (sort) => list('transacoes', sort),
      create: (payload) => create('transacoes', payload),
      update: (id, payload) => update('transacoes', id, payload),
      delete: (id) => remove('transacoes', id),
      deleteByMonth: async (mes) => {
        if (!hasSupabaseConfig) return true
        const { error } = await supabase.from('transacoes').delete().eq('fatura_mes_ref', mes)
        if (error) throw error
        return true
      },
      updateMany: async (ids, payload) => {
        if (!hasSupabaseConfig) return payload
        const { data, error } = await supabase.from('transacoes').update(payload).in('id', ids).select()
        if (error) throw error
        return data
      }
    },
    Pagamento: {
      list: (sort) => list('pagamentos', sort),
      create: (payload) => create('pagamentos', payload),
      update: (id, payload) => update('pagamentos', id, payload),
      delete: (id) => remove('pagamentos', id),
    },
    Fechamento: {
      list: (sort) => list('fechamentos', sort),
      create: (payload) => create('fechamentos', payload),
      update: (id, payload) => update('fechamentos', id, payload),
      delete: (id) => remove('fechamentos', id),
    },
    RegraClassificacao: {
      list: (sort) => list('regras_classificacao', sort),
      create: (payload) => create('regras_classificacao', payload),
      update: (id, payload) => update('regras_classificacao', id, payload),
      delete: (id) => remove('regras_classificacao', id),
    },
    Saque: {
      list: (sort) => list('saques', sort),
      create: (payload) => create('saques', payload),
      update: (id, payload) => update('saques', id, payload),
      delete: (id) => remove('saques', id),
    },
    Fatura: {
      list: (sort) => list('faturas', sort),
      create: (payload) => create('faturas', payload),
      update: (id, payload) => update('faturas', id, payload),
      delete: (id) => remove('faturas', id),
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const file_url = URL.createObjectURL(file)
        return { file_url, file }
      },
      InvokeLLM: async ({ prompt, file_urls, file }) => {
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
        if (!apiKey || !file) {
          console.warn('LLM integration not configured corretamente (API key ou arquivo ausente).')
          return { transacoes: [] }
        }
        const toBase64 = (f) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const bytes = new Uint8Array(reader.result)
              let binary = ''
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i])
              }
              resolve(btoa(binary))
            }
            reader.onerror = reject
            reader.readAsArrayBuffer(f)
          })
        const dataB64 = await toBase64(file)
        const strictPrompt = `${prompt}

Retorne os dados como um objeto JSON compacto para economizar espaço e evitar truncamento:
{
  "transacoes": [
    ["YYYY-MM-DD", "descricao", valor, parcela_atual_ou_null, parcela_total_ou_null]
  ]
}

Regras:
- Retorne SOMENTE JSON válido.
- "valor" deve ser número puro (ponto decimal).
- Se tiver 1/10 parcelas, use 1 e 10. Se não parcelado, use null.`

        console.log('--- Base44 Integrations v1.2 (Compact Mode) ---')
        const body = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: strictPrompt },
                {
                  inline_data: {
                    mime_type: file.type || 'application/pdf',
                    data: dataB64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 65536,
            responseMimeType: "application/json"
          }
        }
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (!resp.ok) {
          const errText = await resp.text().catch(() => '')
          const message = `Erro IA (${resp.status}): ${errText}`
          console.error('Erro Gemini:', resp.status, errText)
          throw new Error(message)
        }
        const json = await resp.json()
        let rawText = ''
        try {
          rawText = json.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
          console.log('Resposta bruta da IA (tamanho):', rawText.length)

          let text = rawText
          if (text.includes('```')) {
            text = text.replace(/```json|```/g, '').trim()
          }

          // Tenta parsear. Se falhar por truncamento, tenta reparar de forma agressiva
          let parsed
          try {
            parsed = JSON.parse(text)
          } catch (firstError) {
            console.warn('JSON quebrado detectado, tentando reparo agressivo...')
            let repaired = text.trim()

            // Caso 1: Terminou no meio de uma string
            const lastQuoteIndex = repaired.lastIndexOf('"')
            const lastOpenBrace = repaired.lastIndexOf('{')
            const lastOpenBracket = repaired.lastIndexOf('[')

            // Se a última aspa for depois de qualquer abertura de bloco, ela pode estar órfã ou ser o fim de um campo
            // Mas o erro "Unterminated string" geralmente significa que falta fechar a última aspa.
            if ((repaired.match(/"/g) || []).length % 2 !== 0) {
              repaired += '"'
            }

            // Remove pontuação final comum em truncamentos
            repaired = repaired.replace(/,[^,]*$/g, '')

            // Tenta fechar colchetes e chaves na ordem inversa
            const stack = []
            for (let char of repaired) {
              if (char === '{' || char === '[') stack.push(char)
              else if (char === '}') stack.pop()
              else if (char === ']') stack.pop()
            }
            while (stack.length) {
              const opener = stack.pop()
              repaired += (opener === '{' ? '}' : ']')
            }

            try {
              parsed = JSON.parse(repaired)
              console.log('Reparo agressivo funcionou!')
            } catch (secondError) {
              // Se ainda falhar, tenta apenas o fechamento básico
              try {
                parsed = JSON.parse(repaired + ']}')
              } catch (e) {
                throw firstError
              }
            }
          }

          // Converte o formato compacto de volta para objetos
          const transacoes = Array.isArray(parsed?.transacoes) ? parsed.transacoes.map(row => {
            if (Array.isArray(row)) {
              return {
                data: row[0] || '',
                descricao: row[1] || 'Sem descrição',
                valor: typeof row[2] === 'string' ? parseFloat(row[2].replace(/[^\d.-]/g, '')) : (row[2] || 0),
                parcela_atual: row[3] ?? null,
                parcela_total: row[4] ?? null
              }
            }
            return {
              data: row.data || '',
              descricao: row.descricao || 'Sem descrição',
              valor: typeof row.valor === 'string' ? parseFloat(row.valor.replace(/[^\d.-]/g, '')) : (row.valor || 0),
              parcela_atual: row.parcela_atual ?? null,
              parcela_total: row.parcela_total ?? null
            }
          }) : []

          console.log('Transações processadas:', transacoes.length)
          return { transacoes }
        } catch (e) {
          console.error('Falha crítica no processamento da IA:', rawText)
          console.error(e)
          return { transacoes: [] }
        }
      }
    }
  }
}
