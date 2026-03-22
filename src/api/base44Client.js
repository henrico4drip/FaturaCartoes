import { db, hasFirebaseConfig } from '@/lib/firebaseClient'
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, getDoc, writeBatch } from 'firebase/firestore'

function parseSort(sort) {
  if (!sort) return { column: 'id', ascending: true }
  const descending = sort.startsWith('-')
  const column = descending ? sort.slice(1) : sort
  return { column, ascending: !descending }
}

async function list(tableName, sortStr) {
  if (!hasFirebaseConfig) {
    console.warn(`[Firebase] Chaves de configuração ausentes para listar ${tableName}`);
    return [];
  }
  try {
    const { column, ascending } = parseSort(sortStr);
    const q = query(collection(db, tableName), orderBy(column, ascending ? 'asc' : 'desc'));
    console.log(`[Firebase] Solicitando listagem: ${tableName} (sort: ${sortStr})`);
    const snapshot = await getDocs(q);
    console.log(`[Firebase] Sucesso: ${snapshot.size} itens em ${tableName}`);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn(`[Firebase] Erro na consulta ordenada de ${tableName}, tentando fallback:`, e.message);
    try {
      const fallbackQ = query(collection(db, tableName));
      const fallbackSnap = await getDocs(fallbackQ);
      console.log(`[Firebase] Sucesso Fallback: ${fallbackSnap.size} itens em ${tableName}`);
      let docs = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const { column, ascending } = parseSort(sortStr);
      docs.sort((a, b) => {
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
      return docs;
    } catch (err2) {
      console.error(`[Firebase] Falha crítica ao listar ${tableName}:`, err2?.message || err2);
      return [];
    }
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function create(tableName, payload) {
  if (!hasFirebaseConfig) return payload
  try {
    let toInsert = { ...payload }

    // Add created_at if missing
    if (!toInsert.created_at) {
      toInsert.created_at = new Date().toISOString()
    }

    if (tableName === 'transacoes') {
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
        ...toInsert,
        data: ensureIso(fixDate(payload.data)),
        valor: normMoney(payload.valor),
        parcela_atual: (payload.parcela_atual === null || payload.parcela_atual === undefined) ? null : Number(payload.parcela_atual),
        parcela_total: (payload.parcela_total === null || payload.parcela_total === undefined) ? null : Number(payload.parcela_total),
      }
      if (!toInsert.hash_unico) {
        const pAtual = toInsert.parcela_atual || 0
        toInsert.hash_unico = `${toInsert.data}_${toInsert.valor}_${toInsert.descricao}_${pAtual}`
      }

      // upsert logic for hash_unico
      const q = query(collection(db, tableName), where("hash_unico", "==", toInsert.hash_unico))
      const existing = await getDocs(q)
      if (!existing.empty) {
        const docToUpdate = existing.docs[0]
        return { id: docToUpdate.id, ...docToUpdate.data() }
      }
    } else if (tableName === 'faturas') {
      // Faturas usa mes_referencia como PK
      const d = doc(db, tableName, toInsert.mes_referencia)
      await setDoc(d, toInsert, { merge: true })
      return { id: toInsert.mes_referencia, ...toInsert }
    } else if (tableName === 'fechamentos') {
      // Fechamentos usa mes e usuario
      const d_id = `${toInsert.mes}_${toInsert.usuario}`
      const d = doc(db, tableName, d_id)
      await setDoc(d, toInsert, { merge: true })
      return { id: d_id, ...toInsert }
    }

    // Default insert
    const insertId = generateId()
    const d = doc(db, tableName, insertId)
    await setDoc(d, toInsert)
    return { id: insertId, ...toInsert }
  } catch (e) {
    console.error(`Erro ao criar em ${tableName}:`, e?.message || e)
    throw e
  }
}

async function update(tableName, id, payload) {
  if (!hasFirebaseConfig) return { id, ...payload }
  try {
    const d = doc(db, tableName, String(id))
    await updateDoc(d, payload)
    const after = await getDoc(d)
    return { id: after.id, ...after.data() }
  } catch (e) {
    console.error(`Erro ao atualizar ${tableName}:${id}:`, e?.message || e)
    throw e
  }
}

async function remove(tableName, id) {
  if (!hasFirebaseConfig) return true
  try {
    const d = doc(db, tableName, String(id))
    await deleteDoc(d)
    return true
  } catch (e) {
    console.error(`Erro ao deletar ${tableName}:${id}:`, e?.message || e)
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
      deleteByMonth: async (mes, arquivo_nome) => {
        if (!hasFirebaseConfig) return true;
        try {
          let conditions = [where('fatura_mes_ref', '==', mes)];
          if (arquivo_nome) {
            conditions.push(where('arquivo_nome', '==', arquivo_nome));
          }
          const q = query(collection(db, 'transacoes'), ...conditions);
          const snapshot = await getDocs(q);

          const batch = writeBatch(db);
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          return true;
        } catch (e) {
          console.error("Erro ao deletar por mês:", e);
          throw e;
        }
      },
      updateMany: async (ids, payload) => {
        if (!hasFirebaseConfig || !ids || ids.length === 0) return payload;
        try {
          const batch = writeBatch(db);
          ids.forEach(id => {
            const dRef = doc(db, 'transacoes', String(id));
            batch.update(dRef, payload);
          });
          await batch.commit();
          return payload;
        } catch (e) {
          console.error("Erro ao atualizar lote:", e);
          throw e;
        }
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
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
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
