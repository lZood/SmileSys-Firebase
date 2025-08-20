'use client';
import Link from 'next/link';
import { articles } from '@/content/resources';
import { Button } from '@/components/ui/button';

export default function ResourcesIndex() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Recursos y Blog</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">Buenas prácticas, operaciones y crecimiento para clínicas dentales. Aprende cómo aprovechar SmileSys para optimizar procesos.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {articles.map(a => (
          <Link key={a.slug} href={`/resources/${a.slug}`} className="group rounded-xl border bg-card p-5 flex flex-col hover:shadow-sm transition">
            <div className="text-xs text-muted-foreground mb-2 flex gap-2 flex-wrap">
              <span>{new Date(a.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
              <span>• {a.readingMinutes} min</span>
            </div>
            <h2 className="font-semibold mb-2 group-hover:text-primary line-clamp-2">{a.title}</h2>
            <p className="text-sm text-muted-foreground line-clamp-4 flex-1">{a.excerpt}</p>
            <div className="mt-4 text-sm font-medium text-primary">Leer más →</div>
          </Link>
        ))}
      </div>
      <div className="mt-16 text-center">
        <Button asChild><Link href="/signup-new">Probar SmileSys Gratis</Link></Button>
      </div>
    </div>
  );
}
