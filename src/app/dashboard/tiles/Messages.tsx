"use client";

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../../../supabaseClient';
import { colors } from '../../stylecomponents/colors';
import Tile from './Tile';

type Message = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name?: string;
};

type MessagesProps = {
  isHost?: boolean;
};

const PREVIEW_LENGTH = 150;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

// Splitting on a capture group keeps each URL at the odd indexes.
function linkify(text: string): ReactNode[] {
  const lines = text.split('\n');

  return lines.flatMap((line, lineIndex) => {
    const parts = line.split(URL_PATTERN).map((part, partIndex) =>
      partIndex % 2 === 1 ? (
        <a
          key={`${lineIndex}-${partIndex}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: colors.lime }}
        >
          {part}
        </a>
      ) : (
        part
      ),
    );

    return lineIndex < lines.length - 1 ? [...parts, <br key={`br-${lineIndex}`} />] : parts;
  });
}

function preview(content: string): string {
  if (content.length <= PREVIEW_LENGTH) return content;

  let cut = content.substring(0, PREVIEW_LENGTH);
  const urlStart = cut.lastIndexOf('http');

  // Back up to the space before a URL that the cut would otherwise split in half.
  if (urlStart > -1 && !cut.includes(' ', urlStart)) {
    const spaceBefore = cut.lastIndexOf(' ', urlStart);
    if (spaceBefore > -1) cut = cut.substring(0, spaceBefore);
  }

  return `${cut}...`;
}

type MessageEditorProps = {
  title: string;
  value: string;
  placeholder?: string;
  submitLabel: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
};

function MessageEditor({ title, value, placeholder, submitLabel, onChange, onSubmit, onCancel, onDelete }: MessageEditorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        className="w-full max-w-lg rounded-[18px] border p-5 shadow-2xl"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <h3 className="mb-4 text-xl font-semibold text-[var(--color-text)]">{title}</h3>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={5}
          className="mb-4 w-full rounded-lg border p-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
          style={{ backgroundColor: colors.field, borderColor: colors.borderStrong }}
        />

        <div className="flex items-center justify-between gap-3">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg border px-3 py-2 text-sm font-medium"
                style={{
                  backgroundColor: colors.errorBackground,
                  borderColor: colors.errorBorder,
                  color: colors.errorText,
                }}
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border px-3 py-2 text-sm font-medium text-[var(--color-text)]"
              style={{ borderColor: colors.borderStrong }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!value.trim()}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: colors.lime, color: colors.background }}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Messages({ isHost = false }: MessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:author_id(username)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setMessages(
        data.map((row) => ({
          id: row.id,
          content: row.content,
          created_at: row.created_at,
          author_id: row.author_id,
          author_name: row.profiles?.username,
        })),
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();

    const subscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadMessages]);

  const toggleExpanded = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!editing) return;

    try {
      const { error } = await supabase.from('messages').update({ content: editContent }).eq('id', editing.id);
      if (error) throw error;

      setEditing(null);
      void loadMessages();
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;

    try {
      const { error } = await supabase.from('messages').delete().eq('id', editing.id);
      if (error) throw error;

      setEditing(null);
      void loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleAdd = async () => {
    if (!newContent.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('messages').insert({ content: newContent, author_id: user.id });
      if (error) throw error;

      setShowAdd(false);
      setNewContent('');
      void loadMessages();
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  return (
    <Tile title="Messages" className="min-h-[80px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Messages</h3>

        {isHost && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-95"
            style={{ backgroundColor: colors.lime, color: colors.background }}
          >
            + New message
          </button>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="py-3 text-center text-sm text-[var(--color-muted)]">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="py-3 text-center text-sm text-[var(--color-muted)]">No messages found</p>
        ) : (
          messages.map((message) => {
            const isExpanded = expanded.has(message.id);

            return (
              <div
                key={message.id}
                className="rounded-lg border p-3"
                style={{ backgroundColor: colors.field, borderColor: colors.border }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-medium text-[var(--color-text)]">{message.author_name || 'Unknown'}</span>
                    <span className="mx-2 text-[var(--color-muted)]">•</span>
                    <span className="text-xs text-[var(--color-muted)]">
                      {format(new Date(message.created_at), 'MMM dd, yyyy')}
                    </span>
                  </p>

                  {isHost && (
                    <button
                      type="button"
                      aria-label="Edit message"
                      onClick={() => {
                        setEditing(message);
                        setEditContent(message.content);
                      }}
                      className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-lime)]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  )}
                </div>

                <p className="mt-1 break-words text-sm text-[var(--color-text)]/90">
                  {linkify(isExpanded ? message.content : preview(message.content))}
                </p>

                {message.content.length > PREVIEW_LENGTH && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(message.id)}
                    className="mt-1 text-sm font-medium"
                    style={{ color: colors.lime }}
                  >
                    {isExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {editing && (
        <MessageEditor
          title="Edit message"
          value={editContent}
          submitLabel="Save"
          onChange={setEditContent}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
          onDelete={handleDelete}
        />
      )}

      {showAdd && (
        <MessageEditor
          title="New message"
          value={newContent}
          placeholder="Enter your message here..."
          submitLabel="Post message"
          onChange={setNewContent}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </Tile>
  );
}
