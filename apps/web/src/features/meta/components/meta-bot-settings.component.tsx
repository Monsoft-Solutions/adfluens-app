/**
 * Meta Bot Settings Component
 *
 * Configuration UI for AI bot settings including personality, business hours,
 * response rules, and handoff settings.
 */

import { useState } from "react";
import { useTRPC } from "@/lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Switch,
  Slider,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import {
  Bot,
  Settings,
  Clock,
  MessageSquare,
  Loader2,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  UserCog,
  Volume2,
  Languages,
  X,
} from "lucide-react";

type MetaBotSettingsProps = {
  pageId: string;
};

type AiPersonality = {
  tone: "professional" | "friendly" | "casual" | "formal";
  responseLength: "concise" | "detailed" | "auto";
  useEmojis: boolean;
  customInstructions?: string;
};

type BusinessHours = {
  enabled: boolean;
  timezone: string;
  schedule: Array<{
    day: number;
    startTime: string;
    endTime: string;
  }>;
};

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "UTC",
];

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

export function MetaBotSettings({ pageId }: MetaBotSettingsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Test message state
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState<string | null>(null);

  // Settings state
  const [localSettings, setLocalSettings] = useState<{
    aiEnabled: boolean;
    aiPersonality: AiPersonality;
    aiTemperature: number;
    welcomeMessage: string;
    awayMessage: string;
    businessHours: BusinessHours;
    handoffKeywords: string[];
    handoffNotificationEmail: string;
    useOrganizationContext: boolean;
    useWebsiteContext: boolean;
    additionalContext: string;
    salesAssistantEnabled: boolean;
    customerSupportEnabled: boolean;
    appointmentSchedulingEnabled: boolean;
    autoTranslateEnabled: boolean;
    supportedLanguages: string[];
    defaultLanguage: string;
  } | null>(null);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    ...trpc.metaBot.getSettings.queryOptions({ pageId }),
    select: (data) => {
      // Initialize local state on first load
      if (!localSettings && data) {
        setLocalSettings({
          aiEnabled: data.aiEnabled,
          aiPersonality: (data.aiPersonality as AiPersonality) || {
            tone: "professional",
            responseLength: "auto",
            useEmojis: false,
          },
          aiTemperature: parseFloat(data.aiTemperature) || 0.7,
          welcomeMessage: data.welcomeMessage || "",
          awayMessage: data.awayMessage || "",
          businessHours: (data.businessHours as BusinessHours) || {
            enabled: false,
            timezone: "America/New_York",
            schedule: [],
          },
          handoffKeywords: (data.handoffKeywords as string[]) || [],
          handoffNotificationEmail: data.handoffNotificationEmail || "",
          useOrganizationContext: data.useOrganizationContext ?? true,
          useWebsiteContext: data.useWebsiteContext ?? true,
          additionalContext: data.additionalContext || "",
          salesAssistantEnabled: data.salesAssistantEnabled ?? false,
          customerSupportEnabled: data.customerSupportEnabled ?? true,
          appointmentSchedulingEnabled:
            data.appointmentSchedulingEnabled ?? false,
          autoTranslateEnabled: data.autoTranslateEnabled ?? false,
          supportedLanguages: (data.supportedLanguages as string[]) || ["en"],
          defaultLanguage: data.defaultLanguage || "en",
        });
      }
      return data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    ...trpc.metaBot.updateSettings.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.metaBot.getSettings.queryKey({ pageId }),
      });
    },
  });

  // Test response mutation
  const testResponseMutation = useMutation({
    ...trpc.metaBot.testResponse.mutationOptions(),
    onSuccess: (data) => {
      setTestResponse(data.response);
    },
  });

  const handleSaveSettings = () => {
    if (!localSettings) return;

    updateSettingsMutation.mutate({
      pageId,
      aiEnabled: localSettings.aiEnabled,
      aiPersonality: localSettings.aiPersonality,
      aiTemperature: localSettings.aiTemperature,
      welcomeMessage: localSettings.welcomeMessage || null,
      awayMessage: localSettings.awayMessage || null,
      businessHours: localSettings.businessHours,
      handoffKeywords: localSettings.handoffKeywords,
      handoffNotificationEmail: localSettings.handoffNotificationEmail || null,
      useOrganizationContext: localSettings.useOrganizationContext,
      useWebsiteContext: localSettings.useWebsiteContext,
      additionalContext: localSettings.additionalContext || null,
      salesAssistantEnabled: localSettings.salesAssistantEnabled,
      customerSupportEnabled: localSettings.customerSupportEnabled,
      appointmentSchedulingEnabled: localSettings.appointmentSchedulingEnabled,
      autoTranslateEnabled: localSettings.autoTranslateEnabled,
      supportedLanguages: localSettings.supportedLanguages,
      defaultLanguage: localSettings.defaultLanguage,
    });
  };

  const handleTestResponse = () => {
    if (!testMessage.trim()) return;
    testResponseMutation.mutate({
      pageId,
      message: testMessage,
    });
  };

  const updateSetting = <K extends keyof NonNullable<typeof localSettings>>(
    key: K,
    value: NonNullable<typeof localSettings>[K]
  ) => {
    setLocalSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings || !localSettings) {
    return (
      <div className="p-6 bg-muted/30 border border-border rounded-lg text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          No bot configuration found. Please select a page first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Bot Configuration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how the AI bot responds to messages
          </p>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {updateSettingsMutation.isSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
          Settings saved successfully
        </div>
      )}

      {updateSettingsMutation.isError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
          Failed to save settings
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="personality" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2">
            <Languages className="w-4 h-4" />
            Language
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="w-4 h-4" />
            Business Hours
          </TabsTrigger>
          <TabsTrigger value="handoff" className="gap-2">
            <UserCog className="w-4 h-4" />
            Handoff
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Test
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bot Capabilities</CardTitle>
              <CardDescription>
                Enable or disable different bot features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Auto-Reply</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI-powered automatic responses
                  </p>
                </div>
                <Switch
                  checked={localSettings.aiEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("aiEnabled", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Customer Support Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Help customers with questions and issues
                  </p>
                </div>
                <Switch
                  checked={localSettings.customerSupportEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("customerSupportEnabled", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sales Assistant Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Qualify leads and assist with sales inquiries
                  </p>
                </div>
                <Switch
                  checked={localSettings.salesAssistantEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("salesAssistantEnabled", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    Appointment Scheduling
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to book appointments
                  </p>
                </div>
                <Switch
                  checked={localSettings.appointmentSchedulingEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("appointmentSchedulingEnabled", checked)
                  }
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Context Sources</CardTitle>
              <CardDescription>
                Choose what information the AI uses to respond
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use Organization Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Include business info from your organization profile
                  </p>
                </div>
                <Switch
                  checked={localSettings.useOrganizationContext}
                  onCheckedChange={(checked) =>
                    updateSetting("useOrganizationContext", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use Website Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Include scraped website content for context
                  </p>
                </div>
                <Switch
                  checked={localSettings.useWebsiteContext}
                  onCheckedChange={(checked) =>
                    updateSetting("useWebsiteContext", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Context</Label>
                <Textarea
                  placeholder="Add any additional information the bot should know about (e.g., current promotions, special instructions)..."
                  value={localSettings.additionalContext}
                  onChange={(e) =>
                    updateSetting("additionalContext", e.target.value)
                  }
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Welcome & Away Messages</CardTitle>
              <CardDescription>
                Custom messages for special situations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Textarea
                  placeholder="First message sent to new conversations (leave empty to skip)..."
                  value={localSettings.welcomeMessage}
                  onChange={(e) =>
                    updateSetting("welcomeMessage", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Away Message</Label>
                <Textarea
                  placeholder="Message sent outside business hours..."
                  value={localSettings.awayMessage}
                  onChange={(e) => updateSetting("awayMessage", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personality Settings */}
        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Personality</CardTitle>
              <CardDescription>
                Customize how the AI communicates with customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select
                  value={localSettings.aiPersonality.tone}
                  onValueChange={(value) =>
                    updateSetting("aiPersonality", {
                      ...localSettings.aiPersonality,
                      tone: value as AiPersonality["tone"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Professional: Business-appropriate. Friendly: Warm and
                  approachable. Casual: Relaxed. Formal: Respectful and
                  structured.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Response Length</Label>
                <Select
                  value={localSettings.aiPersonality.responseLength}
                  onValueChange={(value) =>
                    updateSetting("aiPersonality", {
                      ...localSettings.aiPersonality,
                      responseLength: value as AiPersonality["responseLength"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">
                      Concise (1-2 sentences)
                    </SelectItem>
                    <SelectItem value="auto">Auto (match question)</SelectItem>
                    <SelectItem value="detailed">
                      Detailed (thorough)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use Emojis</Label>
                  <p className="text-sm text-muted-foreground">
                    Add emojis to make responses more friendly
                  </p>
                </div>
                <Switch
                  checked={localSettings.aiPersonality.useEmojis}
                  onCheckedChange={(checked) =>
                    updateSetting("aiPersonality", {
                      ...localSettings.aiPersonality,
                      useEmojis: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Creativity (Temperature)</Label>
                  <span className="text-sm text-muted-foreground">
                    {localSettings.aiTemperature.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[localSettings.aiTemperature]}
                  onValueChange={([value]) => {
                    if (value !== undefined) {
                      updateSetting("aiTemperature", value);
                    }
                  }}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more consistent. Higher = more creative and varied.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea
                  placeholder="Add specific instructions for how the AI should behave (e.g., 'Always greet customers by name', 'Mention our satisfaction guarantee')..."
                  value={localSettings.aiPersonality.customInstructions || ""}
                  onChange={(e) =>
                    updateSetting("aiPersonality", {
                      ...localSettings.aiPersonality,
                      customInstructions: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Settings */}
        <TabsContent value="language" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Translation</CardTitle>
              <CardDescription>
                Automatically detect customer language and translate responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Translation</Label>
                  <p className="text-sm text-muted-foreground">
                    Detect user language and automatically translate bot
                    responses
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoTranslateEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("autoTranslateEnabled", checked)
                  }
                />
              </div>

              {localSettings.autoTranslateEnabled && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label>Default Language</Label>
                    <Select
                      value={localSettings.defaultLanguage}
                      onValueChange={(value) =>
                        updateSetting("defaultLanguage", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The primary language for your bot responses before
                      translation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Supported Languages</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select which languages the bot should support for
                      auto-translation
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {localSettings.supportedLanguages.map((langCode) => {
                        const lang = SUPPORTED_LANGUAGES.find(
                          (l) => l.code === langCode
                        );
                        return (
                          <Badge
                            key={langCode}
                            variant="secondary"
                            className="gap-1"
                          >
                            {lang?.name || langCode}
                            <button
                              type="button"
                              className="ml-1 hover:text-destructive"
                              onClick={() => {
                                const newLangs =
                                  localSettings.supportedLanguages.filter(
                                    (c) => c !== langCode
                                  );
                                updateSetting("supportedLanguages", newLangs);
                              }}
                              disabled={langCode === "en"}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!localSettings.supportedLanguages.includes(value)) {
                          updateSetting("supportedLanguages", [
                            ...localSettings.supportedLanguages,
                            value,
                          ]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add a language..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.filter(
                          (l) =>
                            !localSettings.supportedLanguages.includes(l.code)
                        ).map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      How it works
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        - Language is detected from the first customer message
                      </li>
                      <li>
                        - All bot responses are automatically translated to
                        their language
                      </li>
                      <li>
                        - Human agents see messages in the original language
                      </li>
                      <li>
                        - Translation is powered by AI for natural-sounding
                        responses
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set when the bot should be active. Outside these hours, the away
                message will be sent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Business Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict bot responses to specific hours
                  </p>
                </div>
                <Switch
                  checked={localSettings.businessHours.enabled}
                  onCheckedChange={(checked) =>
                    updateSetting("businessHours", {
                      ...localSettings.businessHours,
                      enabled: checked,
                    })
                  }
                />
              </div>

              {localSettings.businessHours.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={localSettings.businessHours.timezone}
                      onValueChange={(value) =>
                        updateSetting("businessHours", {
                          ...localSettings.businessHours,
                          timezone: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Schedule</Label>
                    <div className="space-y-2">
                      {DAYS_OF_WEEK.map((day, index) => {
                        const schedule =
                          localSettings.businessHours.schedule.find(
                            (s) => s.day === index
                          );
                        const isEnabled = !!schedule;

                        return (
                          <div
                            key={day}
                            className="flex items-center gap-4 p-3 border rounded-lg"
                          >
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => {
                                const newSchedule = checked
                                  ? [
                                      ...localSettings.businessHours.schedule,
                                      {
                                        day: index,
                                        startTime: "09:00",
                                        endTime: "17:00",
                                      },
                                    ]
                                  : localSettings.businessHours.schedule.filter(
                                      (s) => s.day !== index
                                    );
                                updateSetting("businessHours", {
                                  ...localSettings.businessHours,
                                  schedule: newSchedule,
                                });
                              }}
                            />
                            <span className="w-24 font-medium">{day}</span>
                            {isEnabled && schedule && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={schedule.startTime}
                                  onChange={(e) => {
                                    const newSchedule =
                                      localSettings.businessHours.schedule.map(
                                        (s) =>
                                          s.day === index
                                            ? {
                                                ...s,
                                                startTime: e.target.value,
                                              }
                                            : s
                                      );
                                    updateSetting("businessHours", {
                                      ...localSettings.businessHours,
                                      schedule: newSchedule,
                                    });
                                  }}
                                  className="w-32"
                                />
                                <span className="text-muted-foreground">
                                  to
                                </span>
                                <Input
                                  type="time"
                                  value={schedule.endTime}
                                  onChange={(e) => {
                                    const newSchedule =
                                      localSettings.businessHours.schedule.map(
                                        (s) =>
                                          s.day === index
                                            ? { ...s, endTime: e.target.value }
                                            : s
                                      );
                                    updateSetting("businessHours", {
                                      ...localSettings.businessHours,
                                      schedule: newSchedule,
                                    });
                                  }}
                                  className="w-32"
                                />
                              </div>
                            )}
                            {!isEnabled && (
                              <span className="text-muted-foreground text-sm">
                                Closed
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Handoff Settings */}
        <TabsContent value="handoff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Human Handoff</CardTitle>
              <CardDescription>
                Configure when conversations should be transferred to a human
                agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Handoff Keywords</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  When a customer uses these words, the conversation will be
                  flagged for human review.
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {localSettings.handoffKeywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {keyword}
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={() => {
                          const newKeywords =
                            localSettings.handoffKeywords.filter(
                              (_, i) => i !== index
                            );
                          updateSetting("handoffKeywords", newKeywords);
                        }}
                      >
                        x
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword (e.g., 'speak to human', 'complaint')..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = e.currentTarget.value.trim();
                        if (
                          value &&
                          !localSettings.handoffKeywords.includes(value)
                        ) {
                          updateSetting("handoffKeywords", [
                            ...localSettings.handoffKeywords,
                            value,
                          ]);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Press Enter to add a keyword
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Notification Email</Label>
                <Input
                  type="email"
                  placeholder="team@company.com"
                  value={localSettings.handoffNotificationEmail}
                  onChange={(e) =>
                    updateSetting("handoffNotificationEmail", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Receive email notifications when a handoff is triggered
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Panel */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Bot Response</CardTitle>
              <CardDescription>
                Send a test message to preview how the bot will respond
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Test Message</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message to test the bot..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && testMessage.trim()) {
                        handleTestResponse();
                      }
                    }}
                  />
                  <Button
                    onClick={handleTestResponse}
                    disabled={
                      !testMessage.trim() || testResponseMutation.isPending
                    }
                  >
                    {testResponseMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {testResponse && (
                <div className="space-y-2">
                  <Label>Bot Response</Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{testResponse}</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Testing Tips
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Try questions about your products or services</li>
                  <li>- Test handoff keywords to see escalation behavior</li>
                  <li>- Ask pricing or availability questions</li>
                  <li>- Try greeting messages like Hi or Hello</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
