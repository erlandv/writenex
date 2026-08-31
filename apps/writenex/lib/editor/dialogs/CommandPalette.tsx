"use client";

import { Command } from "cmdk";
import {
  BookOpen,
  FileText,
  Keyboard,
  Maximize2,
  Monitor,
  Plus,
  Search,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { exportWorkspace } from "@/lib/backup";
import { createDocument } from "@/lib/db";
import { useEditorStore } from "@/lib/store";

export function CommandPalette(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const {
    documents,
    setActiveDocumentId,
    addDocument,
    setContent,
    setShortcutsOpen,
    isFocusMode,
    setFocusMode,
    isReadOnly,
    setReadOnly,
    setSearchOpen,
    setSettingsOpen,
  } = useEditorStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleCreateDocument = async () => {
    const doc = await createDocument("Untitled", "");
    addDocument({ id: doc.id, title: doc.title, updatedAt: doc.updatedAt });
    setActiveDocumentId(doc.id);
    setContent("");
    setOpen(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className="fixed left-1/2 top-1/4 z-[100] w-full max-w-[640px] -translate-x-1/2 transform rounded-xl border border-zinc-200 bg-white p-0 shadow-2xl overflow-hidden dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center border-b border-zinc-200 px-3 dark:border-zinc-800">
        <Search className="mr-2 h-5 w-5 shrink-0 text-zinc-500 opacity-50 dark:text-zinc-400" />
        <Command.Input
          placeholder="Type a command or search..."
          className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-400"
        />
      </div>
      <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
        <Command.Empty className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No results found.
        </Command.Empty>

        <Command.Group
          heading="Documents"
          className="px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
        >
          {documents.map((doc) => (
            <Command.Item
              key={doc.id}
              onSelect={() => {
                setActiveDocumentId(doc.id);
                setOpen(false);
              }}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:text-zinc-100 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              {doc.title}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Separator className="-mx-1 my-1 h-px bg-zinc-200 dark:bg-zinc-800" />

        <Command.Group
          heading="Actions"
          className="px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
        >
          <Command.Item
            onSelect={handleCreateDocument}
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:text-zinc-100 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Document
          </Command.Item>
          <Command.Item
            onSelect={() => {
              setSearchOpen(true);
              setOpen(false);
            }}
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:text-zinc-100 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
          >
            <Search className="mr-2 h-4 w-4" />
            Search in Document
          </Command.Item>
          <Command.Item
            onSelect={() => {
              setFocusMode(!isFocusMode);
              setOpen(false);
            }}
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:text-zinc-100 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
          >
            <Maximize2 className="mr-2 h-4 w-4" />
            Toggle Focus Mode
          </Command.Item>
          <Command.Item
            onSelect={() => {
              setReadOnly(!isReadOnly);
              setOpen(false);
            }}
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:text-zinc-100 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Toggle Read-Only
          </Command.Item>
        </Command.Group>

        <Command.Separator className="-mx-1 my-1 h-px bg-zinc-200 dark:bg-zinc-800" />

        <Command.Group
          heading="Templates"
          className="px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
        >
          {[
            {
              name: "Blog Post",
              content:
                "# New Blog Post\n\nWrite your introduction here...\n\n## Subheading\n\nContent...",
            },
            {
              name: "Docs Page",
              content:
                "# Documentation Title\n\nBrief overview of the feature.\n\n## Usage\n\n```javascript\n// Code example\n```",
            },
            {
              name: "Changelog",
              content:
                "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n## [Unreleased]\n\n### Added\n- New feature\n\n### Fixed\n- Bug fix",
            },
            {
              name: "Release Note",
              content:
                "# Release v1.0.0\n\n## Highlight 1\nDescription of highlight...\n\n## Highlight 2\nDescription of highlight...",
            },
            {
              name: "Meeting Notes",
              content:
                "# Meeting Notes\n**Date:** YYYY-MM-DD\n**Attendees:** \n\n## Agenda\n1. \n\n## Action Items\n- [ ] Task 1",
            },
            {
              name: "PRD",
              content:
                "# Product Requirements Document\n\n## Objective\nWhat are we building and why?\n\n## Requirements\n- Req 1\n- Req 2",
            },
          ].map((template) => (
            <Command.Item
              key={template.name}
              onSelect={async () => {
                const doc = await createDocument(
                  template.name,
                  template.content
                );
                addDocument({
                  id: doc.id,
                  title: doc.title,
                  updatedAt: doc.updatedAt,
                });
                setActiveDocumentId(doc.id);
                setContent(template.content);
                setOpen(false);
              }}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:text-zinc-100 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              New {template.name}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Separator className="-mx-1 my-1 h-px bg-zinc-200 dark:bg-zinc-800" />

        <Command.Group
          heading="Settings & Tools"
          className="px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
        >
          <Command.Item
            onSelect={() => {
              setShortcutsOpen(true);
              setOpen(false);
            }}
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:text-zinc-100 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Keyboard Shortcuts
          </Command.Item>
          <Command.Item
            onSelect={() => {
              setSettingsOpen(true);
              setOpen(false);
            }}
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:text-zinc-100 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
          >
            <Monitor className="mr-2 h-4 w-4" />
            Editor Settings
          </Command.Item>
          <Command.Item
            onSelect={() => {
              exportWorkspace();
              setOpen(false);
            }}
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:text-zinc-100 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
          >
            <Monitor className="mr-2 h-4 w-4" />
            Backup Workspace (ZIP)
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
