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

const B2B_REGEX =
  /\b(ltda|me\b|eireli|s\/a|comercio|comércio|servicos|serviços|loja|assistencia|assistência|informatica|informática|tech|cell|celulares|escritorio|escritório|clinica|clínica|radioclinica|radioclínica|unimagem|crb\b|laboratorio|laboratório|hospital|advocacia|advogado|advogada|contabilidade|contador|contadora|engenharia|engenheiro|arquitetura|arquiteto|consultoria|mercado|supermercado|auto\b|autoescola|oficina|mecanica|mecânica|studio|estúdio|escola|colegio|colégio|faculdade|imobiliaria|imobiliária|farmacia|farmácia|drogaria|ótica|otica|padaria|restaurante|pizzaria|lanchonete|hotel|pousada|transportes|transportadora|logistica|logística|odontologia|odonto|dentista|médico|medico|psicologa|psicóloga|fisioterapia|veterinaria|veterinária|pet\b|construtora|incorporadora|condominio|condomínio| sindico|síndico|distribuidora|atacado|industria|indústria| gráfica|grafica|marcenaria|serralheria|vidracaria|vidraçaria|academia| estética|estetica|salao|salão|barbearia|seguros|corretora|despachante)\b/i;

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
      };
      contactsByPhone.set(phone, c);
    }
    return c;
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

    // 2. V8 serialized contact objects starting with o"\x02id
    idx = 0;
    while ((idx = s.indexOf('o"\x02id', idx)) !== -1) {
      const nextObjIdx = s.indexOf('o"\x02id', idx + 5);
      const idStr = readV8StringAfter(b, idx + 5);
      if (idStr && (idStr.endsWith('@lid') || idStr.endsWith('@c.us') || idStr.endsWith('@s.whatsapp.net'))) {
        const chunkEnd = nextObjIdx !== -1 ? Math.min(nextObjIdx, idx + 1200) : Math.min(b.length, idx + 1200);
        const chunk = b.subarray(idx, chunkEnd);
        const chunkLatin = chunk.toString('latin1');

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

        let verifiedName = null;
        const verIdx = chunkLatin.indexOf('"\x0cverifiedName');
        if (verIdx !== -1) {
          verifiedName = cleanDisplayName(readV8StringAfter(chunk, verIdx + 14));
        }

        if (idStr.endsWith('@lid')) {
          const lid = idStr.split('@')[0];
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
          const phone = idStr.split('@')[0].replace(/\D/g, '');
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

    // 3. Raw 55... phone numbers from chat/message history
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

  // Filter out the store's own number (5511954369269) and normalize Brazilian numbers
  const allFormatted = Array.from(contactsByPhone.values())
    .filter((c) => c.phone.startsWith('55') && c.phone.length >= 12 && c.phone.length <= 13)
    .filter((c) => c.phone !== '5511954369269')
    .map((c) => {
      const displayName = c.savedName || c.verifiedName || c.pushName || '';
      const ddd = c.phone.slice(2, 4);
      const isB2B = c.isBusiness || B2B_REGEX.test(displayName);
      return {
        name: displayName || `Contato WhatsApp ${formatPhoneBR(c.phone)}`,
        hasRealName: Boolean(displayName),
        phone: c.phone,
        phoneFormatted: formatPhoneBR(c.phone),
        ddd,
        isRegional: ['11', '19', '12', '35'].includes(ddd),
        segment: isB2B ? 'Empresa / B2B' : 'Cliente / Residencial',
        savedName: c.savedName,
        pushName: c.pushName,
        verifiedName: c.verifiedName,
        isAddressBook: c.isAddressBook,
      };
    })
    .sort((a, b) => {
      if (a.hasRealName !== b.hasRealName) return a.hasRealName ? -1 : 1;
      if (a.segment !== b.segment) return a.segment === 'Empresa / B2B' ? -1 : 1;
      if (a.isRegional !== b.isRegional) return a.isRegional ? -1 : 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

  const namedLeads = allFormatted.filter((c) => c.hasRealName);
  const b2bLeads = namedLeads.filter((c) => c.segment === 'Empresa / B2B');

  const outDir = path.resolve('tools/whatsapp-leads/output');
  fs.mkdirSync(outDir, { recursive: true });

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const toCSV = (rows) =>
    '\uFEFF' +
    [
      'Nome;Telefone_E164;Telefone_Formatado;DDD;Segmento;Salvo_Na_Agenda;Nome_Agenda;Nome_Perfil_WhatsApp',
      ...rows.map((r) =>
        [
          esc(r.name),
          esc(r.phone),
          esc(r.phoneFormatted),
          esc(r.ddd),
          esc(r.segment),
          esc(r.isAddressBook ? 'Sim' : 'Não'),
          esc(r.savedName),
          esc(r.pushName),
        ].join(';'),
      ),
    ].join('\r\n');

  fs.writeFileSync(path.join(outDir, 'leads-whatsapp-empresas-b2b.csv'), toCSV(b2bLeads), 'utf8');
  fs.writeFileSync(path.join(outDir, 'leads-whatsapp-nomeados.csv'), toCSV(namedLeads), 'utf8');
  fs.writeFileSync(path.join(outDir, 'leads-whatsapp-completo.csv'), toCSV(allFormatted), 'utf8');
  fs.writeFileSync(
    path.join(outDir, 'leads-whatsapp-nomeados.json'),
    JSON.stringify(namedLeads, null, 2),
    'utf8',
  );

  console.log(`\n✅ Extração do WhatsApp Desktop concluída com sucesso!`);
  console.log(`   - Total de números únicos (Brasil):     ${allFormatted.length}`);
  console.log(`   - Contatos com nome identificado:       ${namedLeads.length}`);
  console.log(`   - Empresas / B2B identificadas:         ${b2bLeads.length}`);
  console.log(`   - Contatos DDD 11/19/12/35 (Região):    ${namedLeads.filter((c) => c.isRegional).length}`);
  console.log(`\n📁 Arquivos gerados em tools/whatsapp-leads/output/:`);
  console.log(`   1. leads-whatsapp-empresas-b2b.csv (${b2bLeads.length} empresas/clínicas/escritórios/lojas)`);
  console.log(`   2. leads-whatsapp-nomeados.csv     (${namedLeads.length} contatos com nome)`);
  console.log(`   3. leads-whatsapp-completo.csv     (${allFormatted.length} todos os números do WhatsApp)`);
  console.log(`   4. leads-whatsapp-nomeados.json    (pré-carregado no painel /admin/clientes/leads)`);
}

main();
