"use client";

import React from "react";
import { saveSetting } from "@/lib/db";
import { useEditorStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/lib/ui";

export function SettingsModal(): React.ReactElement | null {
  const {
    isSettingsOpen,
    setSettingsOpen,
    autoSaveInterval,
    setAutoSaveInterval,
    showLineNumbers,
    setShowLineNumbers,
    confirmClearEditor,
    setConfirmClearEditor,
  } = useEditorStore();

  const handleAutoSaveChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = parseInt(e.target.value, 10);
    setAutoSaveInterval(value);
    await saveSetting("autoSaveInterval", value.toString());
  };

  const handleShowLineNumbersChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.checked;
    setShowLineNumbers(value);
    await saveSetting("showLineNumbers", value.toString());
  };

  const handleConfirmClearChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.checked;
    setConfirmClearEditor(value);
    await saveSetting("confirmClearEditor", value.toString());
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        description="Manage your editor preferences and settings"
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Adjust auto-save interval, visual preferences, and confirmation
            dialogues.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label
                htmlFor="autoSaveInterval"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-save Interval
              </label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                How often your document is automatically saved.
              </p>
            </div>
            <select
              id="autoSaveInterval"
              value={autoSaveInterval}
              onChange={handleAutoSaveChange}
              className="flex h-10 w-32 items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus:ring-zinc-300"
            >
              <option value={1000}>1 second</option>
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label
                htmlFor="showLineNumbers"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show Line Numbers
              </label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Display line numbers in the editor margin.
              </p>
            </div>
            <input
              id="showLineNumbers"
              type="checkbox"
              checked={showLineNumbers}
              onChange={handleShowLineNumbersChange}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus:ring-zinc-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label
                htmlFor="confirmClearEditor"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirm Clear Editor
              </label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Ask for confirmation before clearing all content.
              </p>
            </div>
            <input
              id="confirmClearEditor"
              type="checkbox"
              checked={confirmClearEditor}
              onChange={handleConfirmClearChange}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus:ring-zinc-300"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
