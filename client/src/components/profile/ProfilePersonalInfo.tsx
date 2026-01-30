"use client";

import { Button } from "@/components/ui/button";

interface ProfilePersonalInfoProps {
  first_name: string;
  last_name: string;
  username: string;
  isSaving: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onSave: (e: React.FormEvent) => void;
}

const inputClassName =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm";

export function ProfilePersonalInfo({
  first_name,
  last_name,
  username,
  isSaving,
  onFirstNameChange,
  onLastNameChange,
  onUsernameChange,
  onSave,
}: ProfilePersonalInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Personal information</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update your name and username
        </p>
      </div>
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="profile-first_name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              First name
            </label>
            <input
              id="profile-first_name"
              type="text"
              value={first_name}
              onChange={(e) => onFirstNameChange(e.target.value)}
              className={inputClassName}
              placeholder="First name"
            />
          </div>
          <div>
            <label
              htmlFor="profile-last_name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Last name
            </label>
            <input
              id="profile-last_name"
              type="text"
              value={last_name}
              onChange={(e) => onLastNameChange(e.target.value)}
              className={inputClassName}
              placeholder="Last name"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="profile-username"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Username
          </label>
          <input
            id="profile-username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className={inputClassName}
            placeholder="Username"
          />
        </div>
        <Button type="submit" disabled={isSaving} size="sm">
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
