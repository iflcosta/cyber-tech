"use client";
import { useState } from "react";
import { Smartphone, Laptop, Monitor, CheckCircle2 } from "lucide-react";
import LeadModal from "./LeadModal";

const services = [
    {
        title: "Smartphones",
        icon: <Smartphone className="text-blue-500" size={32} />,
        desc: "Troca de tela, bateria e reparos em placa (Android/iOS).",
        price: "A partir de R$ 150"
    },
    {
        title: "Notebooks",
        icon: <Laptop className="text-blue-500" size={32} />,
        desc: "Formatação, upgrade de SSD/RAM e limpeza preventiva.",
        price: "A partir de R$ 120"
    },
    {
        title: "Computadores",
        icon: <Monitor className="text-blue-500" size={32} />,
        desc: "Diagnóstico, limpeza, troca de peças e upgrades em desktops.",
        price: "A partir de R$ 100"
    }
];

export default function Maintenance() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <section id="assistencia" className="py-12 md:py-24 bg-zinc-950/50">
            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                interestType="manutencao"
            />
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
                    <div className="flex-1">
                        <h2 className="text-4xl font-black mb-6 italic tracking-tight uppercase">
                            ASSISTÊNCIA <span className="text-blue-500">EXPRESSA</span>
                        </h2>
                        <p className="text-white/60 text-lg mb-8">
                            Reparos rápidos com garantia Cyber. Seu dispositivo pronto para o jogo em tempo recorde.
                        </p>

                        <ul className="space-y-4 mb-10">
                            {["Peças Originais", "Garantia de 90 dias", "Técnicos Certificados", "Orçamento em 5 minutos"].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-white/80 font-medium">
                                    <CheckCircle2 size={18} className="text-blue-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white text-black font-black px-8 py-4 rounded-lg hover:bg-blue-500 hover:text-white transition-all w-full md:w-auto"
                        >
                            SOLICITAR ORÇAMENTO AGORA
                        </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                        {services.map((service) => (
                            <div key={service.title} className="glass p-8 rounded-2xl card-hover border-white/5">
                                <div className="mb-4">{service.icon}</div>
                                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                                <p className="text-white/40 text-sm mb-4">{service.desc}</p>
                                <div className="text-blue-400 font-black">{service.price}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
