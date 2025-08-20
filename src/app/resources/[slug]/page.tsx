import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticle } from '@/content/resources';
import { Button } from '@/components/ui/button';

interface Props { params: { slug: string } }

export function generateMetadata({ params }: Props) {
  const article = getArticle(params.slug);
  if (!article) return { title: 'Artículo no encontrado - Recursos SmileSys' };
  return { title: `${article.title} | Recursos SmileSys`, description: article.excerpt };
}

export default function ArticlePage({ params }: Props) {
  const article = getArticle(params.slug);
  if (!article) return notFound();
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="mb-8">
        <Link href="/resources" className="text-sm text-muted-foreground hover:text-primary">← Volver</Link>
      </div>
      <article>
        <header className="mb-8">
          <div className="text-xs text-muted-foreground mb-2 flex gap-3 flex-wrap">
            <span>{new Date(article.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span>• {article.readingMinutes} min lectura</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight">{article.title}</h1>
          <div className="mt-3 flex gap-2 flex-wrap">
            {article.tags.map(t => (
              <span key={t} className="text-[11px] uppercase tracking-wide bg-primary/10 text-primary px-2 py-1 rounded">{t}</span>
            ))}
          </div>
        </header>
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: article.body }} />
      </article>
      <div className="mt-12 border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-sm text-muted-foreground">¿Listo para aplicar estas ideas? Centraliza agenda, pacientes y reportes con SmileSys.</div>
        <Button asChild><Link href="/signup-new">Comenzar Gratis</Link></Button>
      </div>
    </div>
  );
}
