import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, useRef } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ content, onChange, placeholder = 'Start typing...', minHeight = '300px' }: RichTextEditorProps) {
  const editorRef = useRef<{ chain: () => unknown } | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-indigo-600 underline' },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none',
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                const src = reader.result as string;
                editorRef.current?.chain().focus().setImage({ src }).run();
              };
              reader.readAsDataURL(file);
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);
  // Sync external content (e.g. when switching pages) - only when it differs and we didn't just emit it
  const lastEmittedRef = useRef('');
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current && content !== lastEmittedRef.current) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  const handleUpdate = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    }
  }, [editor, onChange]);

  useEffect(() => {
    editor?.on('update', handleUpdate);
    return () => editor?.off('update', handleUpdate);
  }, [editor, handleUpdate]);

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  };

  const addYoutube = () => {
    const url = window.prompt('Enter YouTube URL:');
    if (url) editor?.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  if (!editor) return <div className="animate-pulse rounded border border-accent-200 bg-accent-50" style={{ minHeight }} />;

  return (
    <div className="rounded-lg border border-accent-200 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-accent-200 bg-accent-50/50 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-sm font-medium ${editor.isActive('bold') ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive('italic') ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive('strike') ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          Strike
        </button>
        <span className="mx-1 self-center text-accent-400">|</span>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive('heading', { level: 1 }) ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive('heading', { level: 3 }) ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          H3
        </button>
        <span className="mx-1 self-center text-accent-400">|</span>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive('bulletList') ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive('orderedList') ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          Numbered
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive('blockquote') ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          Quote
        </button>
        <span className="mx-1 self-center text-accent-400">|</span>
        <button type="button" onClick={addLink} className="rounded px-2 py-1 text-sm hover:bg-accent-100">
          Link
        </button>
        <button type="button" onClick={addImage} className="rounded px-2 py-1 text-sm hover:bg-accent-100">
          Image
        </button>
        <button type="button" onClick={addYoutube} className="rounded px-2 py-1 text-sm hover:bg-accent-100">
          Video
        </button>
        <span className="mx-1 self-center text-accent-400">|</span>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive('codeBlock') ? 'bg-accent-200' : 'hover:bg-accent-100'}`}
        >
          Code
        </button>
      </div>

      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
