import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { messages, source } = await req.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'Mensagens não fornecidas' }, { status: 400 });
        }

        // 1. Pedir ao Gemini para extrair nome e telefone
        const prompt = `Analise este histórico de conversa entre um cliente e um assistente de loja de informática.
Extraia APENAS um objeto JSON válido (com as chaves "name" e "phone") com o nome e número de telefone (WhatsApp) do cliente, SE ELE TIVER INFORMADO. 
Se ele não informou, retorne null para os valores correspondentes. Não inclua Markdown, apenas o JSON.

Histórico:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`;

        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const result = await model.generateContent(prompt);
        let extractedDataText = result.response.text().trim();

        // Limpar possíveis formatações markdown do retornão
        if (extractedDataText.startsWith('```json')) {
            extractedDataText = extractedDataText.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        let extractedData: { name: string | null, phone: string | null } = { name: null, phone: null };
        try {
            extractedData = JSON.parse(extractedDataText);
        } catch (e) {
            console.error("Falha ao parsear retornão do Gemini:", extractedDataText);
        }

        if (!extractedData.name && !extractedData.phone) {
            return NextResponse.json({ status: 'não_lead_data_extracted' }, { status: 200 });
        }

        // 2. Verificar se este telefone já existe
        if (extractedData.phone) {
            const cleanPhone = extractedData.phone.replace(/\D/g, ''); // Apenas números
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .eq('phone', cleanPhone)
                .single();

            if (existingLead) {
                return NextResponse.json({ status: 'lead_already_exists' }, { status: 200 });
            }

            // 3. Inserir não Supabase se for novo
            // O voucher será gerado por um trigger não Supabase ou podemos gerar aqui
            const { error } = await supabase
                .from('leads')
                .insert({
                    name: extractedData.name || 'Cliente (Não Informado)',
                    phone: cleanPhone,
                    source: source || 'Cyber IA Chat',
                    status: 'new'
                });

            if (error) {
                console.error("Erro ao inserir lead não Supabase:", error);
                return NextResponse.json({ error: 'Falha ao salvar lead.' }, { status: 500 });
            }

            return NextResponse.json({ status: 'lead_captured', data: extractedData }, { status: 200 });
        }

        return NextResponse.json({ status: 'não_phone_provided' }, { status: 200 });

    } catch (error) {
        console.error('Erro na extração do lead:', error);
        return NextResponse.json({ error: 'Erro internão' }, { status: 500 });
    }
}
