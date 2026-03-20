import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Section = { type?: string; heading?: string; content?: string; caption?: string };

const SECTION_COLORS = [
  'border-l-emerald-500 bg-emerald-50/60',
  'border-l-blue-500 bg-blue-50/60',
  'border-l-violet-500 bg-violet-50/60',
  'border-l-amber-500 bg-amber-50/60',
  'border-l-rose-500 bg-rose-50/60',
  'border-l-cyan-500 bg-cyan-50/60',
];

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="mb-4 text-2xl font-bold text-brand-800">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="mb-3 mt-6 text-xl font-bold text-brand-700">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-2 mt-4 text-lg font-semibold text-brand-700">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-4 ml-6 list-disc space-y-1 text-gray-700">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="mb-4 ml-6 list-decimal space-y-1 text-gray-700">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-brand-800">{children}</strong>,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.includes('language-');
    return isBlock ? (
      <code className="block font-mono text-sm">{children}</code>
    ) : (
      <code className="rounded bg-brand-100 px-1.5 py-0.5 font-mono text-sm text-brand-800">{children}</code>
    );
  },
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-brand-400 bg-brand-50/80 pl-4 py-2 my-3 italic text-gray-700">{children}</blockquote>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-brand-100">{children}</pre>
  ),
};

export default function StudyMaterialRenderer({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-6">
      {sections.map((s, i) => {
        const colorClass = SECTION_COLORS[i % SECTION_COLORS.length];
        return (
          <div key={i} className={`rounded-xl border-l-4 p-5 ${colorClass} transition-shadow hover:shadow-md`}>
            {(s.type === 'text' || !s.type) && (
              <div className="study-material-content">
                {s.heading && <h3 className="mb-2 font-semibold text-brand-800">{s.heading}</h3>}
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {s.content || ''}
                </ReactMarkdown>
              </div>
            )}
            {s.type === 'image' && (
              <div className="overflow-hidden rounded-lg border-2 border-white shadow-lg">
                <img
                  src={s.content}
                  alt={s.caption || 'Concept illustration'}
                  className="max-h-80 w-full object-contain"
                  draggable={false}
                  style={{ pointerEvents: 'none' }}
                />
                {s.caption && (
                  <p className="mt-2 rounded-b-lg bg-white/80 px-3 py-2 text-center text-sm font-medium text-gray-600">
                    {s.caption}
                  </p>
                )}
              </div>
            )}
            {s.type === 'audio' && (
              <div className="rounded-lg border-2 border-white bg-white/50 p-4">
                <audio src={s.content} controls controlsList="nodownload" className="w-full" />
                {s.caption && <p className="mt-2 text-sm text-gray-600">{s.caption}</p>}
              </div>
            )}
            {s.type === 'video' && (
              <div className="overflow-hidden rounded-lg border-2 border-white shadow-lg">
                <video src={s.content} controls controlsList="nodownload" className="w-full rounded-lg" />
                {s.caption && (
                  <p className="mt-2 rounded-b-lg bg-white/80 px-3 py-2 text-center text-sm font-medium text-gray-600">
                    {s.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
