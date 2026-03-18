export const BUILDER_TIERS = {
  cpu: [
    { id: 'cpu-entry', label: 'Entry', model: 'Intel Core i3 / AMD Ryzen 3', price: 350 },
    { id: 'cpu-mid', label: 'Mid', model: 'Intel Core i5 / AMD Ryzen 5', price: 650 },
    { id: 'cpu-high', label: 'High', model: 'Intel Core i7 / AMD Ryzen 7', price: 1200 },
    { id: 'cpu-ultra', label: 'Ultra', model: 'Intel Core i9 / AMD Ryzen 9', price: 2200 },
  ],
  gpu: [
    { id: 'gpu-nãone', label: 'Nenhuma', model: 'GPU Integrada', price: 0 },
    { id: 'gpu-entry', label: 'Entry', model: 'GTX 1650 / RX 6500', price: 700 },
    { id: 'gpu-mid', label: 'Mid', model: 'RTX 3060 / RX 6600', price: 1400 },
    { id: 'gpu-high', label: 'High', model: 'RTX 4070 / RX 7800', price: 2800 },
    { id: 'gpu-ultra', label: 'Ultra', model: 'RTX 4090 / RX 7900 XT', price: 5500 },
  ],
  ram: [
    { id: 'ram-8-d4', label: '8 GB DDR4', model: 'Memória 8GB DDR4', price: 120 },
    { id: 'ram-16-d4', label: '16 GB DDR4', model: 'Memória 16GB DDR4', price: 220 },
    { id: 'ram-32-d4', label: '32 GB DDR4', model: 'Memória 32GB DDR4', price: 380 },
    { id: 'ram-16-d5', label: '16 GB DDR5', model: 'Memória 16GB DDR5', price: 300 },
    { id: 'ram-32-d5', label: '32 GB DDR5', model: 'Memória 32GB DDR5', price: 550 },
  ],
  storage: [
    { id: 'ssd-240', label: 'SSD 240 GB', model: 'SSD 240GB SATA/M.2', price: 150 },
    { id: 'ssd-480', label: 'SSD 480 GB', model: 'SSD 480GB SATA/M.2', price: 220 },
    { id: 'ssd-1tb', label: 'SSD 1 TB', model: 'SSD 1TB NVMe', price: 320 },
    { id: 'ssd-2tb', label: 'SSD 2 TB', model: 'SSD 2TB NVMe', price: 480 },
    { id: 'hdd-1tb', label: 'HDD 1 TB', model: 'HD 1TB Sata III', price: 130 },
  ],
  mobo: [
    { id: 'mobo-entry', label: 'Entry', model: 'H510 / A520', price: 350 },
    { id: 'mobo-mid', label: 'Mid', model: 'B660 / B550', price: 600 },
    { id: 'mobo-high', label: 'High', model: 'Z690 / X570', price: 950 },
  ],
  psu: [
    { id: 'psu-low', label: '400-500 W', model: 'Fonte 80 Plus Standard', price: 180 },
    { id: 'psu-mid', label: '600-650 W', model: 'Fonte 80 Plus Bronze', price: 280 },
    { id: 'psu-gold', label: '750-850 W', model: 'Fonte 80 Plus Gold', price: 420 },
    { id: 'psu-plat', label: '1000 W+', model: 'Fonte 80 Plus Platinum', price: 600 },
  ],
  case: [
    { id: 'case-basic', label: 'Básico', model: 'Gabinete sem janela', price: 120 },
    { id: 'case-glass', label: 'Mid-Tower', model: 'Gabinete com Vidro', price: 250 },
    { id: 'case-full', label: 'Full-Tower', model: 'Gabinete Premium', price: 420 },
  ],
};
