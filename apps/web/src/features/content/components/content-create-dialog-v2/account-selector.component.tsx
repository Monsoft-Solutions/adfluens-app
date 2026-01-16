/**
 * Account Selector Component
 *
 * Displays connected platform accounts for selection when creating content.
 */

import React from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { Checkbox, cn, Label } from "@repo/ui";
import { GoogleBusinessIcon } from "@/shared/components/icons/google-business.icon";

type PlatformConnection = {
  id: string;
  platform: string;
  accountName: string;
  accountUsername?: string | null;
  accountImageUrl?: string | null;
};

type AccountSelectorProps = {
  accounts: PlatformConnection[];
  selectedAccountIds: string[];
  onToggle: (accountId: string) => void;
  isLoading?: boolean;
};

const platformIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  facebook: Facebook,
  instagram: Instagram,
  gmb: GoogleBusinessIcon,
  linkedin: Linkedin,
  twitter: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
};

const platformLabels: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  gmb: "Google Business",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
};

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  selectedAccountIds,
  onToggle,
  isLoading,
}) => {
  // Group accounts by platform
  const groupedAccounts = accounts.reduce<Record<string, PlatformConnection[]>>(
    (acc, account) => {
      const platformAccounts = acc[account.platform] ?? [];
      platformAccounts.push(account);
      acc[account.platform] = platformAccounts;
      return acc;
    },
    {}
  );

  const platformOrder = ["facebook", "instagram", "gmb", "linkedin", "twitter"];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">No connected accounts found.</p>
        <p className="text-xs mt-1">
          Connect your social media accounts in Meta Business or Google Business
          sections.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {platformOrder.map((platform) => {
        const platformAccounts = groupedAccounts[platform];
        if (!platformAccounts || platformAccounts.length === 0) return null;

        const Icon = platformIcons[platform] || Facebook;

        return (
          <div key={platform} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Icon className="w-4 h-4" />
              <span>{platformLabels[platform] || platform}</span>
            </div>
            <div className="space-y-1">
              {platformAccounts.map((account) => {
                const isSelected = selectedAccountIds.includes(account.id);
                return (
                  <div
                    key={account.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => onToggle(account.id)}
                  >
                    <Checkbox id={account.id} checked={isSelected} />
                    {account.accountImageUrl ? (
                      <img
                        src={account.accountImageUrl}
                        alt={account.accountName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={account.id}
                        className="font-medium cursor-pointer"
                      >
                        {account.accountName}
                      </Label>
                      {account.accountUsername && (
                        <p className="text-xs text-muted-foreground truncate">
                          @{account.accountUsername}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
