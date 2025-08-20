export type ResourceArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // YYYY-MM-DD
  readingMinutes: number;
  tags: string[];
  body: string; // simple HTML / JSX string
};

export const articles: ResourceArticle[] = [
  {
    slug: '5-formas-optimizar-gestion-citas',
    title: '5 formas de optimizar la gestión de citas en tu clínica dental',
    date: '2025-08-20',
    readingMinutes: 5,
    tags: ['agenda', 'productividad', 'operaciones'],
    excerpt: 'Reduce ausencias, mejora la ocupación y ofrece una mejor experiencia al paciente con estas prácticas apoyadas por SmileSys.',
    body: `
      <p>La agenda es el pulso operativo de la clínica. Una gestión ineficiente impacta directamente en ingresos y experiencia del paciente. Estas son cinco estrategias accionables que puedes implementar hoy aprovechando SmileSys:</p>
      <ol class="list-decimal pl-5 space-y-3 mt-4">
        <li><strong>Recordatorios automatizados:</strong> Configura notificaciones previas a la cita para reducir inasistencias. En SmileSys las notificaciones en tiempo real y los recordatorios ayudan a mantener la agenda llena.</li>
        <li><strong>Vista semanal inteligente:</strong> Analiza disponibilidad y huecos entre citas. Nuestra <em>Agenda Inteligente</em> permite arrastrar y reubicar evitando solapamientos.</li>
        <li><strong>Sincronización con Google Calendar:</strong> Evita dobles reservas conectando cada profesional a su calendario externo. La integración bidireccional mantiene todo alineado.</li>
        <li><strong>Bloques y tipos de tratamiento predefinidos:</strong> Estandariza duraciones para estimaciones más precisas y mejor planificación de recursos.</li>
        <li><strong>Métricas de ocupación:</strong> Usa los reportes para identificar horas muertas y reconfigurar horarios (p. ej. ampliar tarde del jueves si la demanda es alta).</li>
      </ol>
      <p class="mt-6">Aplicando estas acciones y apoyándote en las capacidades de SmileSys (agenda visual, notificaciones y métricas) puedes incrementar la utilización y reducir cancelaciones no justificadas.</p>
    `,
  },
  {
    slug: 'odontograma-digital-mejora-experiencia-paciente',
    title: 'Cómo un odontograma digital mejora la experiencia del paciente',
    date: '2025-08-20',
    readingMinutes: 4,
    tags: ['odontograma', 'pacientes', 'tratamientos'],
    excerpt: 'El odontograma digital no es solo registro clínico: es una herramienta de comunicación y confianza. Te contamos cómo sacarle provecho.',
    body: `
      <p>Un odontograma digital interactivo transforma la conversación con el paciente de algo abstracto a algo visual y comprensible.</p>
      <h3 class="mt-4 font-semibold">Beneficios clave</h3>
      <ul class="list-disc pl-5 space-y-2 mt-2">
        <li><strong>Claridad:</strong> El paciente ve exactamente qué piezas requieren atención y el plan propuesto.</li>
        <li><strong>Adherencia:</strong> Visualizar el progreso de tratamientos aumenta la aceptación de presupuestos.</li>
        <li><strong>Consistencia:</strong> Estandariza la documentación para todo el equipo clínico.</li>
        <li><strong>Auditoría y trazabilidad:</strong> Cambios quedan registrados junto a fechas y responsables.</li>
      </ul>
      <h3 class="mt-6 font-semibold">Cómo lo implementa SmileSys</h3>
      <p>Nuestro <em>Odontograma Interactivo</em> permite marcar diagnósticos, registrar procedimientos y asociar cada intervención a presupuestos y pagos, integrando clínica y facturación.</p>
      <p class="mt-4">El resultado: pacientes mejor informados, mayor confianza y procesos administrativos más ordenados.</p>
    `,
  },
  {
    slug: 'usar-metricas-para-crecer-clinica-dental',
    title: 'Usar métricas para hacer crecer tu clínica dental',
    date: '2025-08-20',
    readingMinutes: 6,
    tags: ['reportes', 'crecimiento', 'finanzas'],
    excerpt: 'Ingresos por profesional, tasa de ocupación y conversión de presupuestos: tres métricas que debes vigilar semanalmente.',
    body: `
      <p>Sin datos operas a ciegas. Estas son tres métricas que recomendamos monitorizar en SmileSys:</p>
      <ol class="list-decimal pl-5 space-y-3 mt-4">
        <li><strong>Ingresos por profesional:</strong> Identifica variaciones y oportunidades de capacitación o reasignación de horarios.</li>
        <li><strong>Tasa de ocupación:</strong> % de horas disponibles efectivamente reservadas. Combínala con cancelaciones para detectar problemas de retención.</li>
        <li><strong>Conversión de presupuestos:</strong> Qué porcentaje de propuestas aceptan los pacientes. Mejora la presentación apoyándote en el odontograma digital.</li>
      </ol>
      <p class="mt-6">Los <em>Reportes y Métricas</em> de SmileSys consolidan estos indicadores para decisiones rápidas y accionables.</p>
    `,
  }
];

export function getArticle(slug: string) {
  return articles.find(a => a.slug === slug);
}
