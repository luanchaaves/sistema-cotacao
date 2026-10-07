import React from 'react';
import QuoteViewClient from './QuoteViewClient';

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolvedParams = await params;
  return <QuoteViewClient code={resolvedParams.code} />;
}
