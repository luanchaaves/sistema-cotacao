import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

let isSeeding = false;

export async function ensureDatabaseSeeded() {
  if (isSeeding) return;
  isSeeding = true;

  try {
    // 1. Settings (Upsert)
    await prisma.setting.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        companyName: 'Robô LED Partner',
        originCep: '09710-000',
        originStreet: 'Rua Marechal Deodoro',
        originNumber: '1000',
        originComplement: 'Base Operacional',
        originNeighborhood: 'Centro',
        originCity: 'São Bernardo do Campo',
        originState: 'SP',
        originLat: -23.7000,
        originLng: -46.5500,
        vehicleConsumptionKmL: 10.0,
        gasPricePerLiter: 7.00,
        displacementMarginFixed: 30.00,
        minShippingPrice: 50.00,
        whatsappPhone: '5511919973647',
        instagramUrl: 'https://www.instagram.com/roboledpartner/',
        linktreeUrl: 'https://linktr.ee/roboledpartner',
      },
    });

    // 2. Admin User (Create only if no admin exists)
    const adminCount = await prisma.adminUser.count();
    if (adminCount === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await prisma.adminUser.create({
        data: {
          email: 'admin@roboledpartner.com.br',
          passwordHash,
          name: 'Robô LED Partner Admin',
          role: 'admin',
        },
      });
    }

    // 3. Services (Upsert by slug)
    const defaultServices = [
      {
        name: 'Robô de LED',
        slug: 'robo-de-led',
        description: 'Robô gigante com iluminação LED de última geração, lasers de mão e animação eletrizante na pista de dança.',
        price: 550.0,
        priceType: 'hourly',
        category: 'attraction',
        imageUrl: '/images/robo-hero.png',
        isActive: true,
        order: 1,
      },
      {
        name: 'Personagens',
        slug: 'personagens',
        description: 'Personagens vivos com figurinos impecáveis para recepção, fotos e interação com os convidados.',
        price: 450.0,
        priceType: 'hourly',
        category: 'character',
        imageUrl: '/images/homem-aranha.png',
        isActive: true,
        order: 2,
      },
      {
        name: 'Cilindro',
        slug: 'cilindro',
        description: 'Efeito especial de fumaça gelada CO2 para impacto visual máximo na pista e entrada triunfal.',
        price: 50.0,
        priceType: 'fixed',
        category: 'special_effect',
        imageUrl: '/images/raio.png',
        isActive: true,
        order: 3,
      },
      {
        name: 'Gerb',
        slug: 'gerb',
        description: 'Efeito pirotécnico indoor frio (faíscas seguras sem fumaça para ambientes fechados).',
        price: 40.0,
        priceType: 'fixed',
        category: 'special_effect',
        imageUrl: '/images/raio.png',
        isActive: true,
        order: 4,
      },
    ];

    for (const svc of defaultServices) {
      await prisma.service.upsert({
        where: { slug: svc.slug },
        update: {},
        create: svc,
      });
    }

    // 4. Characters
    const defaultCharacters = [
      { name: 'Homem-Aranha', slug: 'homem-aranha', category: 'Heróis', imageUrl: '/images/homem-aranha.png', order: 1 },
      { name: 'Mickey', slug: 'mickey', category: 'Clássicos Disney', imageUrl: '/images/mickey.jpg', order: 2 },
      { name: 'Minnie', slug: 'minnie', category: 'Clássicos Disney', imageUrl: '/images/minnie.jpg', order: 3 },
      { name: 'Chase (Policial)', slug: 'chase-policial', category: 'Patrulha Canina', imageUrl: '/images/chase.jpg', order: 4 },
      { name: 'Skye', slug: 'skye', category: 'Patrulha Canina', imageUrl: '/images/skye.png', order: 5 },
      { name: 'Marshall', slug: 'marshall', category: 'Patrulha Canina', imageUrl: '/images/marshall.png', order: 6 },
      { name: 'Sonic', slug: 'sonic', category: 'Games', imageUrl: '/images/sonic.jpg', order: 7 },
      { name: 'La Casa de Papel', slug: 'la-casa-de-papel', category: 'Teens & Adultos', imageUrl: '/images/la-casa-de-papel.jpg', order: 8 },
    ];

    for (const char of defaultCharacters) {
      await prisma.character.upsert({
        where: { slug: char.slug },
        update: {},
        create: char,
      });
    }

    // 5. Combos
    const defaultCombos = [
      {
        name: 'Combo Robô + Cilindro + Gerb',
        slug: 'combo-robo-cilindro-gerb',
        description: 'O combo favorito para pistas de dança! Robô de LED com show de 1h + disparo de Cilindro CO2 + efeito de Gerb indoor.',
        imageUrl: '/images/robo-led-1.jpg',
        regularPrice: 640.0,
        promoPrice: 590.0,
        durationHours: 1.0,
        includedItems: JSON.stringify(['Robô de LED', 'Cilindro', 'Gerb']),
        badgeText: 'Mais Escolhido',
        isActive: true,
        order: 1,
      },
      {
        name: 'Combo Robô + Personagem',
        slug: 'combo-robo-personagem',
        description: 'A união perfeita de entretenimento: 1 hora de Robô de LED + 1 Personagem vivo de sua escolha para animar seu evento.',
        imageUrl: '/images/robo-led-2.jpg',
        regularPrice: 1000.0,
        promoPrice: 850.0,
        durationHours: 1.0,
        includedItems: JSON.stringify(['Robô de LED', 'Personagens']),
        badgeText: 'Super Sucesso',
        isActive: true,
        order: 2,
      },
      {
        name: 'Combo Mega Show: Robô + 2 Personagens + Efeitos',
        slug: 'combo-mega-show',
        description: 'Experiência máxima para grandes comemorações: Robô de LED (1h) + 2 Personagens à escolha + Cilindro de CO2 + Gerb.',
        imageUrl: '/images/robo-hero.png',
        regularPrice: 1540.0,
        promoPrice: 1290.0,
        durationHours: 1.0,
        includedItems: JSON.stringify(['Robô de LED', 'Personagens', 'Cilindro', 'Gerb']),
        badgeText: 'Experiência Completa',
        isActive: true,
        order: 3,
      },
    ];

    for (const combo of defaultCombos) {
      await prisma.combo.upsert({
        where: { slug: combo.slug },
        update: {},
        create: combo,
      });
    }

    // 6. Tolls
    const defaultTolls = [
      { name: 'Pedágio Imigrantes (Km 32)', highway: 'SP-160 Imigrantes', price: 36.80, region: 'Litoral Paulista', direction: 'Ambos', isActive: true },
      { name: 'Pedágio Anchieta (Km 31)', highway: 'SP-150 Anchieta', price: 36.80, region: 'Litoral Paulista', direction: 'Ambos', isActive: true },
      { name: 'Pedágio Rodoanel Sul', highway: 'SP-021 Rodoanel Sul', price: 4.50, region: 'Grande SP', direction: 'Ambos', isActive: true },
      { name: 'Pedágio Rodoanel Oeste', highway: 'SP-021 Rodoanel Oeste', price: 3.20, region: 'Grande SP', direction: 'Ambos', isActive: true },
      { name: 'Pedágio Castello Branco (Km 20)', highway: 'SP-280 Castello Branco', price: 5.90, region: 'Interior / Barueri', direction: 'Ambos', isActive: true },
    ];

    const countTolls = await prisma.toll.count();
    if (countTolls === 0) {
      for (const toll of defaultTolls) {
        await prisma.toll.create({ data: toll });
      }
    }
  } catch (err) {
    console.error('Safe database seeding error (non-fatal):', err);
  } finally {
    isSeeding = false;
  }
}
