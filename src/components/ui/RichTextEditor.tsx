import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Iframe } from '@/extensions/IframeExtension';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Link as LinkIcon, Image as ImageIcon, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Heading2, Heading3,
  Quote, Palette, Undo, Redo, Sparkles, Video, Loader2, Code
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { uploadEditorImage, getVideoEmbedUrl, isFacebookUrl } from '@/lib/editorUpload';
import { useToast } from '@/hooks/use-toast';
import { EmojiPicker } from './editor/EmojiPicker';
import { TableMenu } from './editor/TableMenu';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  onAIAssist?: () => void;
  showAIButton?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899',
  'hsl(var(--foreground))',
  'hsl(var(--muted-foreground))',
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Écrivez votre contenu ici...',
  className,
  onAIAssist,
  showAIButton = true,
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isSyncing = useRef(false);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false, // replaced by CodeBlockLowlight
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 decoration-primary/40 cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full h-auto my-3' },
        resize: {
          enabled: true,
          minWidth: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
      Iframe,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (isSyncing.current) return;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              event.preventDefault();
              const file = items[i].getAsFile();
              if (file) handleImageUpload(file);
              return true;
            }
          }
        }
        const html = event.clipboardData?.getData('text/html');
        if (html) return false;
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
              event.preventDefault();
              handleImageUpload(files[i]);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image trop lourde', description: 'Maximum 5 Mo par image.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadEditorImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      } else {
        toast({ title: 'Erreur', description: "Impossible d'uploader l'image.", variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'uploader l'image.", variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [editor, toast]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      isSyncing.current = true;
      editor.commands.setContent(value);
      isSyncing.current = false;
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL du lien:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleImageUpload(file);
    };
    input.click();
  }, [editor, handleImageUpload]);

  const addImageByUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL de l'image:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addVideo = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL de la vidéo (YouTube, Facebook, TikTok, Vimeo, Dailymotion, Twitter/X, Instagram):');
    if (!url) return;

    // Facebook doesn't allow iframe embedding — insert a styled link instead
    if (isFacebookUrl(url)) {
      editor.chain().focus().insertContent(
        `<p><a href="${url}" target="_blank" rel="noopener noreferrer">🎬 Voir la vidéo Facebook</a></p>`
      ).run();
      toast({ title: 'Lien Facebook ajouté', description: 'Facebook ne permet pas l\'intégration en iframe. Un lien cliquable a été inséré.' });
      return;
    }

    const embedUrl = getVideoEmbedUrl(url);
    if (embedUrl) {
      editor.chain().focus().setIframe({ src: embedUrl }).run();
    } else {
      toast({
        title: 'URL non supportée',
        description: 'Formats acceptés : YouTube, TikTok, Vimeo, Dailymotion, Twitter/X, Instagram. Facebook : lien cliquable.',
        variant: 'destructive',
      });
    }
  }, [editor, toast]);

  if (!editor) return null;

  const ToolBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'h-7 w-7 rounded flex items-center justify-center transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('border border-border rounded-xl overflow-hidden bg-card', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Bloc de code">
          <Code className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Aligner gauche">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrer">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Aligner droite">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Lien">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={addImage} title="Importer une image">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={addImageByUrl} title="Image par URL">
          <span className="text-[9px] font-bold">URL</span>
        </ToolBtn>
        <ToolBtn onClick={addVideo} title="Intégrer une vidéo">
          <Video className="h-3.5 w-3.5" />
        </ToolBtn>
        <TableMenu editor={editor} />

        <div className="relative">
          <ToolBtn onClick={() => setShowColorPicker(!showColorPicker)} title="Couleur">
            <Palette className="h-3.5 w-3.5" />
          </ToolBtn>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg p-2 shadow-lg flex gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColorPicker(false);
                  }}
                  className="h-5 w-5 rounded-full border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        <EmojiPicker onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()} />

        <div className="w-px h-5 bg-border mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>

        {uploading && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Upload...
          </div>
        )}

        {showAIButton && onAIAssist && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAIAssist}
              className="h-7 gap-1 text-[10px] px-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3 w-3" /> Aide IA
            </Button>
          </>
        )}
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}
