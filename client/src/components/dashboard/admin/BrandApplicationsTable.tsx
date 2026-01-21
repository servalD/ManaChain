"use client";

import { useState, useEffect } from "react";
import { Search, Check, X as XIcon, MoreHorizontal, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BrandApplication } from "@/types/brand-application.types";
import BrandApplicationService from "@/services/brand-application.service";
import PinataService from "@/services/pinata.service";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Mock applications data
const mockApplications: BrandApplication[] = [
  {
    id: "770e8400-e29b-41d4-a716-446655440000",
    contact_email: "contact@newbrand.com",
    contact_first_name: "John",
    contact_last_name: "Smith",
    contact_phone: "+33612345678",
    brand_name: "New Fashion Brand",
    description: "A sustainable fashion brand",
    website_url: "https://newbrand.com",
    logo_url: "/Logo_NIKE.svg",
    business_registration_number: "123456789",
    country: "France",
    headquarters_street: "123 Fashion Street",
    headquarters_city: "Paris",
    headquarters_zip_code: "75001",
    headquarters_address_complement: null,
    motivation: "We want to build a community",
    estimated_community_size: 5000,
    social_media_links: { instagram: "https://instagram.com/newbrand" },
    how_did_you_hear_about_us: "Social media",
    registration_proof_url: "https://example.com/proof.pdf",
    status: "pending",
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    notes: null,
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440001",
    contact_email: "info@techstartup.com",
    contact_first_name: "Jane",
    contact_last_name: "Doe",
    contact_phone: "+33698765432",
    brand_name: "Tech Startup",
    description: "Innovative tech solutions",
    website_url: "https://techstartup.com",
    logo_url: "/Adidas_Logo.svg",
    business_registration_number: "987654321",
    country: "USA",
    headquarters_street: "456 Tech Avenue",
    headquarters_city: "San Francisco",
    headquarters_zip_code: "94102",
    headquarters_address_complement: null,
    motivation: "We want to engage with our community",
    estimated_community_size: 10000,
    social_media_links: { twitter: "https://twitter.com/techstartup" },
    how_did_you_hear_about_us: "Referral",
    registration_proof_url: "https://example.com/proof2.pdf",
    status: "needs_review",
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    notes: "Need to verify documents",
    created_at: "2024-01-18T10:00:00Z",
    updated_at: "2024-01-19T10:00:00Z",
  },
];

export function BrandApplicationsTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<BrandApplication[]>(mockApplications);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<BrandApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");

  // TODO: Fetch applications from API
  // useEffect(() => {
  //   const fetchApplications = async () => {
  //     setIsLoading(true);
  //     const response = await BrandApplicationService.getApplications({});
  //     if (response?.success) {
  //       setApplications(response.data.applications);
  //     }
  //     setIsLoading(false);
  //   };
  //   fetchApplications();
  // }, []);

  const filteredApplications = applications.filter((app) =>
    app.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (applicationId: string) => {
    try {
      const response = await BrandApplicationService.approveApplication(applicationId);
      if (response) {
        // Refresh applications
        setApplications(applications.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'approved' as const }
            : app
        ));
      }
    } catch (error) {
      // Error handling is done in the service
    }
  };

  const handleRejectClick = (application: BrandApplication) => {
    setSelectedApplication(application);
    setRejectionReason("");
    setRejectionNotes("");
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required.",
        variant: "error",
      });
      return;
    }

    try {
      const response = await BrandApplicationService.rejectApplication(
        selectedApplication.id,
        { rejection_reason: rejectionReason }
      );
      if (response) {
        // Refresh applications
        setApplications(applications.map(app => 
          app.id === selectedApplication.id 
            ? { 
                ...app, 
                status: 'rejected' as const,
                rejection_reason: rejectionReason,
                notes: rejectionNotes || app.notes,
              }
            : app
        ));
        setRejectModalOpen(false);
        setSelectedApplication(null);
        setRejectionReason("");
        setRejectionNotes("");
      }
    } catch (error) {
      // Error handling is done in the service
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 pt-8 w-full">
        <div>
          <h2 className="text-xl font-bold">Brand Applications</h2>
          <p className="text-sm text-muted-foreground">
            {filteredApplications.length} {filteredApplications.length === 1 ? "application" : "applications"} found
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by brand name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app, index) => (
                    <tr
                      key={app.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/20 transition-colors",
                        index === filteredApplications.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {app.logo_url ? (
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5 border border-border">
                              <img
                                src={PinataService.normalizeIpfsUrl(app.logo_url)}
                                alt={app.brand_name}
                                className="w-full h-full object-contain"
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    target.style.display = 'none';
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                                    placeholder.textContent = app.brand_name.charAt(0);
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-violet-400">
                                {app.brand_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-sm">{app.brand_name}</div>
                            <div className="text-xs text-muted-foreground">{app.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">{app.contact_email}</div>
                        <div className="text-xs text-muted-foreground">
                          {app.contact_first_name} {app.contact_last_name}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", getStatusBadgeColor(app.status))}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString("en-US", {
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
            {selectedApplication && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {selectedApplication.logo_url ? (
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5 border border-border">
                    <img
                      src={PinataService.normalizeIpfsUrl(selectedApplication.logo_url)}
                      alt={selectedApplication.brand_name}
                      className="w-full h-full object-contain"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-violet-400">
                      {selectedApplication.brand_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm">{selectedApplication.brand_name}</div>
                  <div className="text-xs text-muted-foreground">{selectedApplication.contact_email}</div>
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
