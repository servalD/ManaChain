"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check, X as XIcon, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  useBrandApplicationsList,
  useApproveBrandApplication,
  useRejectBrandApplication,
} from "@/hooks/api/useBrandApplications";
import PinataService from "@/services/pinata.service";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function BrandApplicationsTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [limit, setLimit] = useState<number>(10);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedApplicationSummary, setSelectedApplicationSummary] = useState<{ brandName: string; contactEmail: string; logoUrl: string | null } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const { data, isLoading } = useBrandApplicationsList({
    limit,
    offset: 0,
    status: statusFilter !== "all" ? (statusFilter as 'pending' | 'approved' | 'rejected' | 'needs_review') : undefined,
    search: debouncedSearchQuery || undefined,
  });
  const applications = data?.applications ?? [];
  const total = data?.total ?? 0;

  const approveApplication = useApproveBrandApplication();
  const rejectApplication = useRejectBrandApplication();

  const handleApprove = (applicationId: string) => {
    approveApplication.mutate({ id: applicationId });
  };

  const handleRejectClick = (application: { id: string; brandName: string; contactEmail: string; logoUrl: string | null }) => {
    setSelectedApplicationId(application.id);
    setSelectedApplicationSummary({
      brandName: application.brandName,
      contactEmail: application.contactEmail,
      logoUrl: application.logoUrl,
    });
    setRejectionReason("");
    setRejectionNotes("");
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedApplicationId || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required.",
        variant: "error",
      });
      return;
    }

    rejectApplication.mutate(
      { id: selectedApplicationId, data: { rejectionReason } },
      {
        onSuccess: () => {
          setRejectModalOpen(false);
          setSelectedApplicationId(null);
          setSelectedApplicationSummary(null);
          setRejectionReason("");
          setRejectionNotes("");
        },
      }
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'approved':
        return 'bg-green-500/20 text-green-500';
      case 'rejected':
        return 'bg-red-500/20 text-red-500';
      case 'needs_review':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <>
      <div className="space-y-4 pt-8 w-full">
        <div>
          <h2 className="text-xl font-bold">Brand Applications</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${total} ${total === 1 ? "application" : "applications"} found`}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by brand name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 items-center">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="needs_review">Needs Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
            <Select
              value={limit.toString()}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="min-w-[100px]"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Brand</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Contact</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Created</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  applications.map((app, index) => (
                    <tr
                      key={app.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/20 transition-colors",
                        index === applications.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {app.logoUrl ? (
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5 border border-border">
                              <img
                                src={PinataService.normalizeIpfsUrl(app.logoUrl)}
                                alt={app.brandName}
                                className="w-full h-full object-contain"
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    target.style.display = 'none';
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                                    placeholder.textContent = app.brandName.charAt(0);
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-violet-400">
                                {app.brandName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-sm">{app.brandName}</div>
                            <div className="text-xs text-muted-foreground">{app.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">{app.contactEmail}</div>
                        <div className="text-xs text-muted-foreground">
                          {app.contactFirstName} {app.contactLastName}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", getStatusBadgeColor(app.status))}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(app.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {app.status === 'pending' || app.status === 'needs_review' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                onClick={() => handleApprove(app.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => handleRejectClick(app)}
                              >
                                <XIcon className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => router.push(`/admin/brand-applications/${app.id}`)}
                          >
                            <MoreHorizontal className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Brand Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. This reason will be sent to the applicant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedApplicationSummary && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {selectedApplicationSummary.logoUrl ? (
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5 border border-border">
                    <img
                      src={PinataService.normalizeIpfsUrl(selectedApplicationSummary.logoUrl)}
                      alt={selectedApplicationSummary.brandName}
                      className="w-full h-full object-contain"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-violet-400">
                      {selectedApplicationSummary.brandName.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm">{selectedApplicationSummary.brandName}</div>
                  <div className="text-xs text-muted-foreground">{selectedApplicationSummary.contactEmail}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="text-sm font-medium">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="rejection-notes" className="text-sm font-medium">
                Internal Notes (Optional)
              </label>
              <textarea
                id="rejection-notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Add internal notes (not visible to applicant)..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectionReason("");
                setRejectionNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            >
              Reject Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
