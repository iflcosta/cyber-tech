#!/usr/bin/env node
/**
 * ============================================================================
 * EXTRATOR DIRETO DO WHATSAPP DESKTOP (WINDOWS) — CYBER INFORMÁTICA
 * ============================================================================
 *
 * Lê diretamente o banco IndexedDB/LevelDB local do aplicativo WhatsApp Desktop
 * da Microsoft Store (`5319275A.WhatsAppDesktop_*`), descomprime os blocos
 * Snappy (.ldb) e logs (.log), decodifica os registros Protobuf (`binarySyncData`)
 * e objetos V8 (`contact`, `chat`, `lid-mapping`) e gera as listas prontas
 * para a campanha de Suporte em TI.
 *
 * Uso:
 *   node tools/whatsapp-leads/extract-whatsapp-desktop.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

// Ignorar robôs de grandes corporações nacionais / 0800 / apps de banco e varejo nacional
const BOT_EXCLUDE_REGEX =
  /\b(99 app|99pay|ifood|shopee|mercado livre|mercado pago|nubank|serasa experian|pagbank|pagaleve|infinitepay|enel\b|energisa|atendimento caixa|casas bahia|pernambucanas|lu do magalu|google ads|grupo netshoes|fmu\b|uninove|cruzeiro do sul|ung\b|gran cursos|gran ensino|descomplica|dio bootcamps|^dio$|^tim$|^vivoo?$|vivo comunica|jeitto|supersim|ibest|joom brasil|atendente virtual)\b/i;

// Ignorar falsos positivos onde "Loja" ou "Escola" era apenas anotação interna para pessoa física
const FALSE_POSITIVE_B2B_REGEX =
  /\b(cliente loja|ednir loja|luis fernando loja|luiz cliente loja|marco pc loja|matheus loja|lu escola|marcia escola|rute escola|terezinha escola|vilma escola|aliciele escol)\b/i;

const NICHE_RULES = [
  {
    niche: 'saude_clinicas',
    label: 'Saúde, Clínicas & Consultórios',
    regex:
      /\b(clinica|clínica|radioclinica|radioclínica|centro médico|centro medico|unimagem|crb imagem|laboratorio|laboratório|unilab|ambulatorio|ambulatório|hospital|husf|odontologia|odonto|dentista|médico|medico|dr\b|dr\.|dra\b|dra\.|doutor|doutora|pediatria|psicologa|psicóloga|psicologia|fisioterapia|fisioterapeuta|nutricionista|nutrição|enfermagem|enfer\b|veterinaria|veterinária|medicina felina|pet\b|petsim|drogaria|farmacia|farmácia|vita pharma|saúde ocupacional)\b/i,
  },
  {
    niche: 'escritorios_servicos',
    label: 'Escritórios, Jurídico, Imobiliárias & Gestão',
    regex:
      /\b(advocacia|advogados|advogado|advogada|juridico|jurídico|jurídica|bureau juridico|cartorio|cartório|contabilidade|contador|contadora|escritorio|escritório|imobiliaria|imobiliária|imoveis|imóveis|imobmaxx|corretor|corretora|lotes|geoincorp|condominio|condomínio|condominiais|sindica|síndica|sindico|síndico|administradora|assessoria|consultoria|recursos humanos|adecco|departamento pessoal|adm pessoal|cia de talentos|financeiro|finanças|financeira|consórcio|consorcio|seguros|despachante|detetive)\b/i,
  },
  {
    niche: 'agencias_graficas_tech',
    label: 'Agências, Mídia, Gráficas & Tecnologia',
    regex:
      /\b(agência|agencia|ag\.\s*novo|agenzzia|marketing|v2bmkt|mídia|midia|digital|publicidade|lh content|gráfica|grafica|copiadora|print|editora|fotografia|fotografo|fotógrafo|foto acesso|web studio|studio pc3d|3d\b|design|designer|tecnologia|martech|systems|sistemas|isolution|marcomp|informatica|informática|tech|assistencia|assistência|conserta smart|cell|celulares|megacell|pointchip|telcabos|eletrônicos|eletronicos|eletrobidu)\b/i,
  },
  {
    niche: 'comercio_gastronomia',
    label: 'Comércio, Lojas & Gastronomia',
    regex:
      /\b(comercio|comércio|comercial|loja|store|shop\b|papelaria|embalagens|brindes|bazar|moda\b|modas|fashion|jeans|alianças|joias|ótica|otica|oculos|óculos|perfumes|móveis|moveis|decorações|decoração|paisagismo|utilidades|pechincha|kids|mercado|supermercado|pizzaria|pizza|pizzas|esfiharia|hamburgueria|burger|burguer|churrascaria|espeto|restaurante|lanchonete|lanches|confeitaria|bolos|bolo\b|doces|doce\b|salgados|milk shake|cioccolato|beer|comida caseira|castanhas|queijaria|açaí|açai)\b/i,
  },
  {
    niche: 'auto_construcao_industria',
    label: 'Automotivo, Construção, Indústria & Logística',
    regex:
      /\b(autoescola|auto escola|auto moto|auto center|direção certa|pneus|rodas|multimarcas|veículos|veiculos|motors|motos\b|moto elétrica|carros|caminhões|jet&car|oficina|mecanica|mecânica|engenheiro|engenharia|eng\b|construtora|construções|reformas|constru\b|arquitetura|arquiteto|vidros|vidro\b|vidraçaria|marcenaria|serralheria|ferramentas|wylie tools|módulos|containers|depósito|deposito|guaialajes|hidrofiber|energia solar|alesol|elétrica|eletric|manutenção|indústria|industria|maquinas|máquinas|distribuidora|transportes|transportadora|express|logistica|logística|logistics|delivery|ltda|eireli|prestadora de serviços|multiserviços|multiservice)\b/i,
  },
  {
    niche: 'educacao_beleza_hotelaria',
    label: 'Educação, Beleza, Fitness & Eventos',
    regex:
      /\b(escola|school|colégio|colegio|emei\b|curso|reforço escolar|capacitação|educacional|academy|academia|fitness|dmfitness|forma fit|athlos fit|cross\b|personal\b|pousada|hotel|chalés|recanto|turismo|tour\b|excursões|festas|eventos|ceremonial|robô de led|estética|estetica|beauty|spa\b|bronzeamento|epilacão|laser\b|espaçolaser|laserficando|studio|estúdio|barber|barbershop|barbearia|salão|salao|cabelos|tranças|sobrancelhas|nails|nail\b|tattoo|ateliê|atelie)\b/i,
  },
];

function classifyContact(displayName, isBusinessFlag) {
  if (!displayName) {
    return {
      isB2B: false,
      segment: 'Cliente / Residencial',
      niche: 'residencial_pf',
      nicheLabel: 'Cliente / Home Office (PF)',
    };
  }
  if (!FALSE_POSITIVE_B2B_REGEX.test(displayName)) {
    for (const rule of NICHE_RULES) {
      if (rule.regex.test(displayName)) {
        return {
          isB2B: true,
          segment: 'Empresa / B2B',
          niche: rule.niche,
          nicheLabel: rule.label,
        };
      }
    }
  }
  if (isBusinessFlag && !FALSE_POSITIVE_B2B_REGEX.test(displayName)) {
    return {
      isB2B: true,
      segment: 'Empresa / B2B',
      niche: 'comercio_gastronomia',
      nicheLabel: 'Comércio, Lojas & Gastronomia',
    };
  }
  return {
    isB2B: false,
    segment: 'Cliente / Residencial',
    niche: 'residencial_pf',
    nicheLabel: 'Cliente / Home Office (PF)',
  };
}


function snappyUncompress(compressed) {
  let pos = 0;
  const len = compressed.length;
  let uncompressedLength = 0;
  let shift = 0;
  while (pos < len) {
    const b = compressed[pos++];
    uncompressedLength |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  const out = Buffer.allocUnsafe(uncompressedLength);
  let outPos = 0;

  while (pos < len && outPos < uncompressedLength) {
    const c = compressed[pos++];
    const tag = c & 0x03;
    if (tag === 0) {
      let litLen = (c >> 2) + 1;
      if (litLen > 60) {
        const extraBytes = litLen - 60;
        litLen = 0;
        for (let i = 0; i < extraBytes; i++) {
          litLen |= compressed[pos++] << (8 * i);
        }
        litLen += 1;
      }
      compressed.copy(out, outPos, pos, pos + litLen);
      pos += litLen;
      outPos += litLen;
    } else {
      let matchLen, offset;
      if (tag === 1) {
        matchLen = ((c >> 2) & 0x07) + 4;
        offset = ((c & 0xe0) << 3) | compressed[pos++];
      } else if (tag === 2) {
        matchLen = (c >> 2) + 1;
        offset = compressed[pos] | (compressed[pos + 1] << 8);
        pos += 2;
      } else {
        matchLen = (c >> 2) + 1;
        offset =
          (compressed[pos] |
            (compressed[pos + 1] << 8) |
            (compressed[pos + 2] << 16) |
            (compressed[pos + 3] << 24)) >>>
          0;
        pos += 4;
      }
      if (offset === 0 || outPos - offset < 0) {
        throw new Error('Invalid Snappy offset');
      }
      for (let i = 0; i < matchLen; i++) {
        out[outPos] = out[outPos - offset];
        outPos++;
      }
    }
  }
  return out.subarray(0, outPos);
}

function readVarint(buf, offset) {
  let res = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    res += (b & 0x7f) * Math.pow(2, shift);
    if ((b & 0x80) === 0) return { value: res, next: pos };
    shift += 7;
  }
  return null;
}

function readBlock(fileBuf, offset, size) {
  if (offset + size + 5 > fileBuf.length) return null;
  const type = fileBuf[offset + size];
  const raw = fileBuf.subarray(offset, offset + size);
  if (type === 0) return raw;
  if (type === 1) {
    try {
      return snappyUncompress(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function parseLdbBlocks(fileBuf) {
  if (fileBuf.length < 48) return [fileBuf];
  const footer = fileBuf.subarray(fileBuf.length - 48);
  if (footer.readUInt32LE(40) !== 0x8b80fb57 || footer.readUInt32LE(44) !== 0xdb477524) {
    return [fileBuf];
  }
  const metaOffset = readVarint(footer, 0);
  if (!metaOffset) return [fileBuf];
  const metaSize = readVarint(footer, metaOffset.next);
  if (!metaSize) return [fileBuf];
  const idxOffset = readVarint(footer, metaSize.next);
  if (!idxOffset) return [fileBuf];
  const idxSize = readVarint(footer, idxOffset.next);
  if (!idxSize) return [fileBuf];

  const indexBlock = readBlock(fileBuf, idxOffset.value, idxSize.value);
  if (!indexBlock) return [fileBuf];

  const numRestarts = indexBlock.readUInt32LE(indexBlock.length - 4);
  const limit = indexBlock.length - 4 * (numRestarts + 1);
  let pos = 0;
  const blocks = [];

  while (pos < limit) {
    const shared = readVarint(indexBlock, pos);
    if (!shared) break;
    const nonShared = readVarint(indexBlock, shared.next);
    if (!nonShared) break;
    const valLen = readVarint(indexBlock, nonShared.next);
    if (!valLen) break;

    const valStart = valLen.next + nonShared.value;
    const valEnd = valStart + valLen.value;
    if (valEnd > limit) break;

    const handleBuf = indexBlock.subarray(valStart, valEnd);
    const bOffset = readVarint(handleBuf, 0);
    if (bOffset) {
      const bSize = readVarint(handleBuf, bOffset.next);
      if (bSize) {
        const dataBlock = readBlock(fileBuf, bOffset.value, bSize.value);
        if (dataBlock) blocks.push(dataBlock);
      }
    }
    pos = valEnd;
  }

  return blocks.length > 0 ? blocks : [fileBuf];
}

function readV8StringAfter(buf, keyEndOffset) {
  let pos = keyEndOffset;
  if (pos >= buf.length) return null;
  const tag = buf[pos++];
  if (tag === 0x22) {
    const lenInfo = readVarint(buf, pos);
    if (!lenInfo || lenInfo.value <= 0 || lenInfo.value > 200 || lenInfo.next + lenInfo.value > buf.length) {
      return null;
    }
    return buf.subarray(lenInfo.next, lenInfo.next + lenInfo.value).toString('latin1').trim();
  } else if (tag === 0x63) {
    const lenInfo = readVarint(buf, pos);
    if (!lenInfo || lenInfo.value <= 0 || lenInfo.value > 400 || lenInfo.next + lenInfo.value > buf.length) {
      return null;
    }
    return buf.subarray(lenInfo.next, lenInfo.next + lenInfo.value).toString('utf16le').trim();
  }
  return null;
}

function formatPhoneBR(digits) {
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return `+${digits}`;
}

function cleanDisplayName(raw) {
  if (!raw) return '';
  // Remove control chars
  const cleaned = raw.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (cleaned.length < 2 || cleaned === 'aeiou') return '';
  return cleaned;
}

function findWhatsAppDesktopLevelDB() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) throw new Error('Variável LOCALAPPDATA não encontrada.');
  const pkgsDir = path.join(localAppData, 'Packages');
  const waPkg = fs.readdirSync(pkgsDir).find((d) => d.startsWith('5319275A.WhatsAppDesktop_'));
  if (!waPkg) throw new Error('Pacote do WhatsApp Desktop não encontrado em ' + pkgsDir);

  return path.join(
    pkgsDir,
    waPkg,
    'LocalCache',
    'EBWebView',
    'Default',
    'IndexedDB',
    'https_web.whatsapp.com_0.indexeddb.leveldb',
  );
}

function main() {
  const levelDbDir = findWhatsAppDesktopLevelDB();
  console.log(`📂 Lendo banco do WhatsApp Desktop em:\n   ${levelDbDir}`);

  const files = fs
    .readdirSync(levelDbDir)
    .filter((f) => f.endsWith('.ldb') || f.endsWith('.log'))
    .sort();

  const lidToPhone = new Map();
  const contactsByPhone = new Map();
  const namesByLid = new Map();
  const chatStatsById = new Map(); // key: raw id before @ (phone or lid)

  function ensurePhone(phone) {
    let c = contactsByPhone.get(phone);
    if (!c) {
      c = {
        phone,
        savedName: '',
        pushName: '',
        verifiedName: '',
        isAddressBook: false,
        isBusiness: false,
        hasChat: false,
        hasDirectChat: false,
        msgsSent: 0,
        msgsReceived: 0,
        lastChatTs: 0,
      };
      contactsByPhone.set(phone, c);
    }
    return c;
  }

  function ensureChatStat(rawId) {
    let st = chatStatsById.get(rawId);
    if (!st) {
      st = { hasChatThread: false, lastChatTs: 0, sentIds: new Set(), recvIds: new Set() };
      chatStatsById.set(rawId, st);
    }
    return st;
  }

  const allBlocks = [];
  for (const f of files) {
    const buf = fs.readFileSync(path.join(levelDbDir, f));
    const blocks = f.endsWith('.ldb') ? parseLdbBlocks(buf) : [buf];
    for (const b of blocks) allBlocks.push(b);
  }

  for (const b of allBlocks) {
    const s = b.toString('latin1');

    // 1. Protobuf SyncActionData: ["contact","<phone>@s.whatsapp.net"]
    let idx = 0;
    while ((idx = s.indexOf('["contact","', idx)) !== -1) {
      const endBracket = s.indexOf('"]', idx + 12);
      if (endBracket !== -1 && endBracket - idx < 60) {
        const jid = s.slice(idx + 12, endBracket);
        const phone = jid.split('@')[0].replace(/\D/g, '');
        const afterBracket = endBracket + 2;
        if (phone.length >= 10 && afterBracket < b.length && b[afterBracket] === 0x12) {
          const pbLen = readVarint(b, afterBracket + 1);
          if (pbLen && pbLen.value > 0 && pbLen.value < 500 && pbLen.next + pbLen.value <= b.length) {
            const pb = b.subarray(pbLen.next, pbLen.next + pbLen.value);
            let pPos = 0;
            if (pb[pPos] === 0x08) {
              const ts = readVarint(pb, pPos + 1);
              if (ts) pPos = ts.next;
            }
            if (pb[pPos] === 0x1a) {
              const caLen = readVarint(pb, pPos + 1);
              if (caLen && caLen.next + caLen.value <= pb.length) {
                const ca = pb.subarray(caLen.next, caLen.next + caLen.value);
                let cPos = 0;
                let fullName = '';
                let firstName = '';
                let lid = '';
                while (cPos < ca.length) {
                  const fieldTag = ca[cPos++];
                  const wireType = fieldTag & 0x07;
                  const fieldNum = fieldTag >> 3;
                  if (wireType === 2) {
                    const sLen = readVarint(ca, cPos);
                    if (!sLen || sLen.next + sLen.value > ca.length) break;
                    const strVal = cleanDisplayName(
                      ca.subarray(sLen.next, sLen.next + sLen.value).toString('utf8'),
                    );
                    if (fieldNum === 1) fullName = strVal;
                    else if (fieldNum === 2) firstName = strVal;
                    else if (fieldNum === 3 && strVal.endsWith('@lid')) lid = strVal.split('@')[0];
                    cPos = sLen.next + sLen.value;
                  } else if (wireType === 0) {
                    const v = readVarint(ca, cPos);
                    if (!v) break;
                    cPos = v.next;
                  } else {
                    break;
                  }
                }
                const rec = ensurePhone(phone);
                rec.isAddressBook = true;
                if (fullName && fullName.length >= rec.savedName.length) rec.savedName = fullName;
                else if (firstName && !rec.savedName) rec.savedName = firstName;
                if (lid) lidToPhone.set(lid, phone);
              }
            }
          }
        }
      }
      idx = endBracket !== -1 ? endBracket + 2 : idx + 12;
    }

    // 2. V8 serialized contact & chat objects starting with o"\x02id
    idx = 0;
    while ((idx = s.indexOf('o"\x02id', idx)) !== -1) {
      const nextObjIdx = s.indexOf('o"\x02id', idx + 5);
      const idStr = readV8StringAfter(b, idx + 5);
      if (idStr && (idStr.endsWith('@lid') || idStr.endsWith('@c.us') || idStr.endsWith('@s.whatsapp.net'))) {
        const chunkEnd = nextObjIdx !== -1 ? Math.min(nextObjIdx, idx + 1200) : Math.min(b.length, idx + 1200);
        const chunk = b.subarray(idx, chunkEnd);
        const chunkLatin = chunk.toString('latin1');
        const rawId = idStr.split('@')[0].replace(/\D/g, '');

        // Check if this V8 object is an active 1-on-1 Chat entry (has unreadCount or timestamp tN)
        if (chunkLatin.includes('unreadCount') || chunkLatin.includes('notSpam')) {
          const st = ensureChatStat(rawId);
          st.hasChatThread = true;
          const tIdx = chunkLatin.indexOf('"\x01tN');
          if (tIdx !== -1 && tIdx + 12 <= chunk.length) {
            const tsVal = chunk.readDoubleLE(tIdx + 4);
            // Valid timestamp between 2020 and 2028
            if (tsVal > 1577836800 && tsVal < 1830297600 && tsVal > st.lastChatTs) {
              st.lastChatTs = Math.floor(tsVal);
            }
          }
        }

        let phoneNumber = null;
        const pnIdx = chunkLatin.indexOf('"\x0bphoneNumber');
        if (pnIdx !== -1) {
          const pnStr = readV8StringAfter(chunk, pnIdx + 13);
          if (pnStr) phoneNumber = pnStr.split('@')[0].replace(/\D/g, '');
        }

        let name = null;
        const nameIdx = chunkLatin.indexOf('"\x04name');
        if (nameIdx !== -1) {
          name = cleanDisplayName(readV8StringAfter(chunk, nameIdx + 6));
        }

        let shortName = null;
        const snIdx = chunkLatin.indexOf('"\x09shortName');
        if (snIdx !== -1) {
          shortName = cleanDisplayName(readV8StringAfter(chunk, snIdx + 11));
        }

        let pushname = null;
        const pushIdx = chunkLatin.indexOf('"\x08pushname');
        if (pushIdx !== -1) {
          pushname = cleanDisplayName(readV8StringAfter(chunk, pushIdx + 10));
        }
        if (!pushname) {
          const notifyIdx = chunkLatin.indexOf('"\x0anotifyName');
          if (notifyIdx !== -1) {
            pushname = cleanDisplayName(readV8StringAfter(chunk, notifyIdx + 12));
          }
        }
        if (!name) {
          const fmtIdx = chunkLatin.indexOf('"\x0eformattedTitle');
          if (fmtIdx !== -1) {
            const candidate = cleanDisplayName(readV8StringAfter(chunk, fmtIdx + 16));
            if (candidate && !/^\+?\d[\d\s()-]+$/.test(candidate)) {
              name = candidate;
            }
          }
        }

        let verifiedName = null;
        const verIdx = chunkLatin.indexOf('"\x0cverifiedName');
        if (verIdx !== -1) {
          verifiedName = cleanDisplayName(readV8StringAfter(chunk, verIdx + 14));
        }

        if (idStr.endsWith('@lid')) {
          const lid = rawId;
          if (phoneNumber && phoneNumber.length >= 10) {
            lidToPhone.set(lid, phoneNumber);
          }
          const existingLid = namesByLid.get(lid) || {};
          if (name) existingLid.name = name;
          if (shortName && !existingLid.name) existingLid.name = shortName;
          if (pushname) existingLid.pushname = pushname;
          if (verifiedName) existingLid.verifiedName = verifiedName;
          namesByLid.set(lid, existingLid);
        } else {
          const phone = rawId;
          if (phone.length >= 10 && phone.length <= 15) {
            const rec = ensurePhone(phone);
            if (name && name.length >= rec.savedName.length) rec.savedName = name;
            else if (shortName && !rec.savedName) rec.savedName = shortName;
            if (pushname && pushname.length >= rec.pushName.length) rec.pushName = pushname;
            if (verifiedName) {
              rec.verifiedName = verifiedName;
              rec.isBusiness = true;
            }
            if (chunkLatin.includes('isAddressBookContactI\x01')) {
              rec.isAddressBook = true;
            }
          }
        }
      }
      idx += 5;
    }

    // 3. Direct 1-on-1 message IDs: (true|false)_<phone_or_lid>@(c.us|s.whatsapp.net|lid)_<msgId>
    // Avoids group messages (which have @g.us after the first _)
    const msgMatches = s.matchAll(/(true|false)_(\d{10,20})@(c\.us|s\.whatsapp\.net|lid)_([A-Za-z0-9]{8,32})/g);
    for (const m of msgMatches) {
      const fromMe = m[1] === 'true';
      const rawId = m[2];
      const msgId = m[4];
      const st = ensureChatStat(rawId);
      if (fromMe) st.sentIds.add(msgId);
      else st.recvIds.add(msgId);

      if (m.index !== undefined) {
        const subEnd = Math.min(b.length, m.index + 240);
        const subLatin = s.slice(m.index, subEnd);
        const tIdx = subLatin.indexOf('"\x01tN');
        if (tIdx !== -1 && m.index + tIdx + 12 <= b.length) {
          const tsVal = b.readDoubleLE(m.index + tIdx + 4);
          if (tsVal > 1577836800 && tsVal < 1830297600 && tsVal > st.lastChatTs) {
            st.lastChatTs = Math.floor(tsVal);
          }
        }
      }
    }

    // 4. Raw 55... phone numbers from general history (groups + chats)
    const rawPhones = s.match(/55\d{10,11}(?=@c\.us|@s\.whatsapp\.net)/g) || [];
    for (const p of rawPhones) {
      const rec = ensurePhone(p);
      rec.hasChat = true;
    }
  }

  // Merge LID records into phone records
  for (const [lid, info] of namesByLid.entries()) {
    const phone = lidToPhone.get(lid);
    if (phone && phone.length >= 10 && phone.length <= 15) {
      const rec = ensurePhone(phone);
      if (info.name && info.name.length >= rec.savedName.length) rec.savedName = info.name;
      if (info.pushname && info.pushname.length >= rec.pushName.length) rec.pushName = info.pushname;
      if (info.verifiedName) {
        rec.verifiedName = info.verifiedName;
        rec.isBusiness = true;
      }
    }
  }

  // Merge 1-on-1 chat & message stats into phone records (resolving LIDs when mapped)
  for (const [rawId, st] of chatStatsById.entries()) {
    const phone = lidToPhone.get(rawId) || (rawId.startsWith('55') && rawId.length <= 13 ? rawId : null);
    if (!phone) continue;
    const rec = ensurePhone(phone);
    rec.msgsSent += st.sentIds.size;
    rec.msgsReceived += st.recvIds.size;
    if (st.hasChatThread || st.sentIds.size > 0 || st.recvIds.size > 0) {
      rec.hasDirectChat = true;
    }
    if (st.lastChatTs > rec.lastChatTs) {
      rec.lastChatTs = st.lastChatTs;
    }
  }

  // Filter out the store's own number (5511954369269), 0800s, and national chatbots
  const allFormatted = Array.from(contactsByPhone.values())
    .filter((c) => c.phone.startsWith('55') && c.phone.length >= 12 && c.phone.length <= 13)
    .filter((c) => !c.phone.startsWith('55800') && !c.phone.startsWith('550800'))
    .filter((c) => c.phone !== '5511954369269')
    .filter((c) => {
      const displayName = c.savedName || c.verifiedName || c.pushName || '';
      if (!displayName) return true;
      return !BOT_EXCLUDE_REGEX.test(displayName);
    })
    .map((c) => {
      const displayName = c.savedName || c.verifiedName || c.pushName || '';
      const ddd = c.phone.slice(2, 4);
      const classification = classifyContact(displayName, c.isBusiness);
      const totalMessages = c.msgsSent + c.msgsReceived;
      const isHotLead = Boolean(c.hasDirectChat || c.isAddressBook);
      const lastChatDate =
        c.lastChatTs > 0 ? new Date(c.lastChatTs * 1000).toISOString().slice(0, 10) : '';
      return {
        name: displayName || `Contato WhatsApp ${formatPhoneBR(c.phone)}`,
        hasRealName: Boolean(displayName),
        phone: c.phone,
        phoneFormatted: formatPhoneBR(c.phone),
        ddd,
        isRegional: ['11', '19', '12', '35'].includes(ddd),
        segment: classification.segment,
        niche: classification.niche,
        nicheLabel: classification.nicheLabel,
        savedName: c.savedName,
        pushName: c.pushName,
        verifiedName: c.verifiedName,
        isAddressBook: c.isAddressBook,
        hasDirectChat: c.hasDirectChat,
        isHotLead,
        msgsSent: c.msgsSent,
        msgsReceived: c.msgsReceived,
        totalMessages,
        lastChatDate,
      };
    })
    .sort((a, b) => {
      if (a.isHotLead !== b.isHotLead) return a.isHotLead ? -1 : 1;
      if (a.totalMessages !== b.totalMessages) return b.totalMessages - a.totalMessages;
      if (a.hasRealName !== b.hasRealName) return a.hasRealName ? -1 : 1;
      if (a.segment !== b.segment) return a.segment === 'Empresa / B2B' ? -1 : 1;
      if (a.isRegional !== b.isRegional) return a.isRegional ? -1 : 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

  // Include both named contacts AND any direct 1-on-1 chats in namedLeads so no hot chat is lost
  const namedLeads = allFormatted.filter((c) => c.hasRealName || c.hasDirectChat);
  const hotLeads = allFormatted
    .filter((c) => c.isHotLead)
    .sort((a, b) => {
      if (b.totalMessages !== a.totalMessages) return b.totalMessages - a.totalMessages;
      if (a.lastChatDate !== b.lastChatDate) return (b.lastChatDate || '').localeCompare(a.lastChatDate || '');
      if (a.isAddressBook !== b.isAddressBook) return a.isAddressBook ? -1 : 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  const b2bLeads = namedLeads.filter((c) => c.segment === 'Empresa / B2B');

  const outDir = path.resolve('tools/whatsapp-leads/output');
  fs.mkdirSync(outDir, { recursive: true });

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const toCSV = (rows) =>
    '\uFEFF' +
    [
      'Nome;Telefone_E164;Telefone_Formatado;DDD;Lead_Quente;Conversa_Direta_1a1;Msgs_Trocadas;Msgs_Enviadas_Loja;Msgs_Recebidas_Cliente;Ultima_Conversa;Salvo_Na_Agenda;Segmento;Nicho_TI;Nome_Agenda;Nome_Perfil_WhatsApp',
      ...rows.map((r) =>
        [
          esc(r.name),
          esc(r.phone),
          esc(r.phoneFormatted),
          esc(r.ddd),
          esc(r.isHotLead ? 'Sim' : 'Não'),
          esc(r.hasDirectChat ? 'Sim' : 'Não'),
          r.totalMessages,
          r.msgsSent,
          r.msgsReceived,
          esc(r.lastChatDate),
          esc(r.isAddressBook ? 'Sim' : 'Não'),
          esc(r.segment),
          esc(r.nicheLabel),
          esc(r.savedName),
          esc(r.pushName),
        ].join(';'),
      ),
    ].join('\r\n');

  fs.writeFileSync(path.join(outDir, 'leads-quentes-clientes-atendidos.csv'), toCSV(hotLeads), 'utf8');
  fs.writeFileSync(
    path.join(outDir, 'leads-quentes-clientes-atendidos.json'),
    JSON.stringify(hotLeads, null, 2),
    'utf8',
  );
  fs.writeFileSync(path.join(outDir, 'leads-whatsapp-empresas-b2b.csv'), toCSV(b2bLeads), 'utf8');
  fs.writeFileSync(path.join(outDir, 'leads-whatsapp-nomeados.csv'), toCSV(namedLeads), 'utf8');
  fs.writeFileSync(path.join(outDir, 'leads-whatsapp-completo.csv'), toCSV(allFormatted), 'utf8');
  fs.writeFileSync(
    path.join(outDir, 'leads-whatsapp-nomeados.json'),
    JSON.stringify(namedLeads, null, 2),
    'utf8',
  );

  const byNiche = {};
  for (const r of b2bLeads) {
    byNiche[r.nicheLabel] = (byNiche[r.nicheLabel] || 0) + 1;
  }

  console.log(`\n✅ Extração e Segmentação Inteligente concluída com sucesso!`);
  console.log(`   - Total de números únicos (Brasil, sem bots):          ${allFormatted.length}`);
  console.log(`   - Contatos nomeados / com conversa ativa:              ${namedLeads.length}`);
  console.log(`   - 🔥 LEADS QUENTES (Clientes Atendidos / Conversa 1a1): ${hotLeads.length}`);
  console.log(`     • Com conversa direta 1-a-1 no WhatsApp da loja:     ${hotLeads.filter((c) => c.hasDirectChat).length}`);
  console.log(`     • Com mensagens enviadas pela loja (atendidos):      ${hotLeads.filter((c) => c.msgsSent > 0).length}`);
  console.log(`     • Salvos manualmente na agenda da loja:              ${hotLeads.filter((c) => c.isAddressBook).length}`);
  console.log(`   - Empresas / B2B identificadas (Total):                ${b2bLeads.length}`);
  console.log(`   - Empresas / B2B na Região (DDD 11/19/12/35):          ${b2bLeads.filter((c) => c.isRegional).length}`);
  console.log(`\n📊 Distribuição de Leads B2B por Sub-Nicho de Suporte em TI:`);
  for (const [k, v] of Object.entries(byNiche)) {
    console.log(`   • ${k}: ${v} leads`);
  }
}

main();
