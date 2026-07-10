"use client";

import { useState } from "react";
import { Send, Users, Building2, Mail, CheckCircle2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useSendNotification } from "@/hooks/api/useNotifications";
import { SendNotificationRequestRole } from "@/api/generated/models";
import ReactMarkdown from "react-markdown";

type RecipientType = 'all_users' | 'all_brands' | 'both';

interface NotificationForm {
  recipientType: RecipientType;
  title: string;
  message: string;
}

export function NotificationCenter() {
  const [form, setForm] = useState<NotificationForm>({
    recipientType: 'all_users',
    title: '',
    message: '',
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [messageViewMode, setMessageViewMode] = useState<'edit' | 'preview'>('edit');

  const sendNotification = useSendNotification();

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and message.",
        variant: "error",
      });
      return;
    }

    const result = await sendNotification.mutateAsync({
      data:
        form.recipientType === "both"
          ? { recipientType: "all", title: form.title.trim(), body: form.message.trim() }
          : {
              recipientType: "role",
              role:
                form.recipientType === "all_users"
                  ? SendNotificationRequestRole.CLIENT
                  : SendNotificationRequestRole.BRANDUSER,
              title: form.title.trim(),
              body: form.message.trim(),
            },
    });

    toast({
      title: "Notifications sent",
      description: `Delivered to ${result.recipientCount} recipient${result.recipientCount === 1 ? "" : "s"}.`,
      variant: "success",
    });

    setForm({ recipientType: 'all_users', title: '', message: '' });
    setPreviewMode(false);
  };

  const getRecipientLabel = () => {
    switch (form.recipientType) {
      case 'all_users':
        return 'All Users';
      case 'all_brands':
        return 'All Brands';
      case 'both':
        return 'Everyone';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 pt-8 w-full">
      <div>
        <h2 className="text-xl font-bold">Notification Center</h2>
        <p className="text-sm text-muted-foreground">
          Send notifications to all users or brands on the platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipient Selection */}
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-violet-500" />
              <h3 className="text-lg font-semibold">Recipients</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, recipientType: 'all_users' })}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left",
                  form.recipientType === 'all_users'
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-border hover:border-violet-500/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className={cn(
                    "h-5 w-5",
                    form.recipientType === 'all_users' ? "text-violet-500" : "text-muted-foreground"
                  )} />
                  <span className="font-semibold text-sm">All Users</span>
                </div>
                <p className="text-xs text-muted-foreground">Send to all platform users</p>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, recipientType: 'all_brands' })}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left",
                  form.recipientType === 'all_brands'
                    ? "border-fuchsia-500 bg-fuchsia-500/10"
                    : "border-border hover:border-fuchsia-500/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className={cn(
                    "h-5 w-5",
                    form.recipientType === 'all_brands' ? "text-fuchsia-500" : "text-muted-foreground"
                  )} />
                  <span className="font-semibold text-sm">All Brands</span>
                </div>
                <p className="text-xs text-muted-foreground">Send to all brand accounts</p>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, recipientType: 'both' })}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left",
                  form.recipientType === 'both'
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-border hover:border-indigo-500/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Mail className={cn(
                    "h-5 w-5",
                    form.recipientType === 'both' ? "text-indigo-500" : "text-muted-foreground"
                  )} />
                  <span className="font-semibold text-sm">Both</span>
                </div>
                <p className="text-xs text-muted-foreground">Send to everyone</p>
              </button>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Recipients:</span> {getRecipientLabel()}
              </p>
            </div>
          </div>

          {/* Notification Form */}
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Send className="h-5 w-5 text-violet-500" />
              <h3 className="text-lg font-semibold">Notification Details</h3>
            </div>

            <div className="space-y-2">
              <label htmlFor="notification-title" className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="notification-title"
                placeholder="Enter notification title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {form.title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="notification-message" className="text-sm font-medium">
                  Message <span className="text-red-500">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(Markdown supported)</span>
                </label>
                <div className="flex gap-1 border border-border rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMessageViewMode('edit')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                      messageViewMode === 'edit'
                        ? "bg-violet-500 text-white"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageViewMode('preview')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                      messageViewMode === 'preview'
                        ? "bg-violet-500 text-white"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                </div>
              </div>
              
              {messageViewMode === 'edit' ? (
                <textarea
                  id="notification-message"
                  placeholder="Enter notification message... (Markdown supported: **bold**, *italic*, [links](url), etc.)"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  maxLength={2000}
                />
              ) : (
                <div className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm overflow-auto">
                  {form.message ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => (
                            <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{children}</code>
                          ),
                          a: ({ href, children }) => (
                            <a href={href} className="text-violet-500 hover:text-violet-600 underline" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-violet-500 pl-3 italic my-2 text-muted-foreground">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {form.message}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Your markdown preview will appear here...</p>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {form.message.length}/2000 characters
              </p>
            </div>

          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex-1"
            >
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button
              onClick={() => void handleSend()}
              disabled={sendNotification.isPending || !form.title.trim() || !form.message.trim()}
              className="flex-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white hover:from-violet-700 hover:via-fuchsia-700 hover:to-indigo-700"
            >
              {sendNotification.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-1">
          <div className="border border-border rounded-lg p-6 space-y-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-semibold">Preview</h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm break-words">
                        {form.title || "Notification Title"}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {form.recipientType === 'all_users' && 'To: All Users'}
                      {form.recipientType === 'all_brands' && 'To: All Brands'}
                      {form.recipientType === 'both' && 'To: All Users & Brands'}
                    </p>
                    <div className="text-sm text-foreground max-h-[300px] overflow-y-auto pr-2 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      {form.message ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</p>,
                              h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ol>,
                              li: ({ children }) => <li className="text-sm break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</strong>,
                              em: ({ children }) => <em className="italic break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</em>,
                              code: ({ children }) => (
                                <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono break-all" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</code>
                              ),
                              a: ({ href, children }) => (
                                <a href={href} className="text-violet-500 hover:text-violet-600 underline break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }} target="_blank" rel="noopener noreferrer">
                                  {children}
                                </a>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-violet-500 pl-3 italic my-2 text-muted-foreground break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {form.message}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Your notification message will appear here...</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipients:</span>
                    <span className="font-medium">{getRecipientLabel()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title length:</span>
                    <span className="font-medium">{form.title.length}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Message length:</span>
                    <span className="font-medium">{form.message.length}/2000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
