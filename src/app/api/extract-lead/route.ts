import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { nanoid } from 'nanoid';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { messages, source, session_voucher_code } = await req.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'Mensagens não fornecidas' }, { status: 400 });
        }

        const prompt = `Analise este histórico de conversa entre um cliente e o assistente "Cyber IA".
Extraia um objeto JSON com:
- "name": Nome do cliente (null se não houver)
- "whatsapp": WhatsApp do cliente formatado apenas números (null se não houver)
- "interest_type": 'venda', 'manutencao' ou 'duvida'
- "description": Breve resumo do que o cliente quer.

Histórico:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        
        if (text.includes('```')) {
            text = text.split('```json')[1]?.split('```')[0] || text.split('```')[1]?.split('```')[0] || text;
        }

        const extraction = JSON.parse(text);

        if (!extraction.whatsapp) {
            return NextResponse.json({ status: 'no_contact' });
        }

        const cleanWhatsapp = extraction.whatsapp.replace(/\D/g, '');
        
        // Check for existing lead
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('whatsapp', cleanWhatsapp)
            .single();

        if (existing) {
            return NextResponse.json({ status: 'existing_lead' });
        }

        const voucher = session_voucher_code || `BPC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const { error } = await supabase
            .from('leads')
            .upsert({
                client_name: extraction.name || 'Lead via Cyber IA',
                whatsapp: cleanWhatsapp,
                interest_type: extraction.interest_type || 'duvida',
                description: extraction.description,
                marketing_source: 'cyber_ia',
                voucher_code: voucher,
                status: 'pending'
            }, { onConflict: 'voucher_code', ignoreDuplicates: false });

        if (error) throw error;

        return NextResponse.json({ status: 'captured', voucher });

    } catch (e) {
        console.error('Lead Extraction Error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
