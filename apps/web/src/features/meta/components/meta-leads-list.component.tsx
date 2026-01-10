import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Mail, Phone, Calendar, FileText } from "lucide-react";
import { Badge, cn, Card, CardContent, Skeleton } from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  qualified: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  converted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  lost: "bg-red-500/10 text-red-600 border-red-500/20",
};

/**
 * List of leads from Meta Ads
 */
export const MetaLeadsList: React.FC = () => {
  const trpc = useTRPC();
  const { organization } = useAuth();

  const { data, isLoading } = useQuery({
    ...trpc.meta.listLeads.queryOptions({ limit: 20 }),
    enabled: !!organization,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const leads = data?.leads || [];

  if (leads.length === 0) {
    return (
      <div className="p-6 bg-muted/30 border border-border rounded-lg text-center">
        <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <h3 className="font-medium text-foreground mb-1">No Leads Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Leads from your Meta Lead Ads will appear here once you start
          receiving them. Make sure your webhook is configured correctly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">
          {leads.length} Lead{leads.length !== 1 ? "s" : ""}
        </h3>
      </div>

      <div className="grid gap-4">
        {leads.map((lead) => (
          <Card key={lead.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-foreground truncate">
                      {lead.fullName || "Unknown"}
                    </h4>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 capitalize",
                        statusColors[lead.status] || statusColors.new
                      )}
                    >
                      {lead.status}
                    </Badge>
                  </div>

                  <div className="grid gap-1 text-sm text-muted-foreground">
                    {lead.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.formName && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate">{lead.formName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(lead.leadCreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
