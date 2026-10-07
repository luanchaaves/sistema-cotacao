import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalQuotes,
      quotesToday,
      quotesThisMonth,
      confirmedQuotes,
      allQuotesAggregate,
      recentQuotes,
    ] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { createdAt: { gte: today } } }),
      prisma.quote.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.quote.count({ where: { status: 'confirmed' } }),
      prisma.quote.aggregate({
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
      prisma.quote.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const formattedRecent = recentQuotes.map((q) => ({
      ...q,
      selectedComboData: q.selectedComboData ? JSON.parse(q.selectedComboData) : null,
      selectedServicesData: q.selectedServicesData ? JSON.parse(q.selectedServicesData) : [],
    }));

    return NextResponse.json({
      totalQuotes,
      quotesToday,
      quotesThisMonth,
      confirmedQuotes,
      totalEstimatedRevenue: allQuotesAggregate._sum.totalAmount || 0,
      averageQuoteTicket: allQuotesAggregate._avg.totalAmount || 0,
      recentQuotes: formattedRecent,
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    return NextResponse.json(
      { error: 'Erro ao calcular métricas do dashboard', details: err.message },
      { status: 500 }
    );
  }
}
